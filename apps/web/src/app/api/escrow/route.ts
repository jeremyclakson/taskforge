import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { TransactionType, TransactionStatus, ChainId, TokenSymbol } from "@agent-platform/shared";

const fundEscrowSchema = z.object({
  taskId: z.string().cuid(),
  workerAddress: z.string(),
  tokenAddress: z.string(),
  amountRaw: z.string(),
  decimals: z.number().int().positive(),
  txHash: z.string(),
  blockNumber: z.number().int().positive(),
  deadline: z.string().datetime(),
});

const resolveEscrowSchema = z.object({
  action: z.enum(["release", "refund", "expire"]),
  txHash: z.string(),
  blockNumber: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const path = new URL(req.url).pathname;

    if (path.endsWith("/fund")) {
      return handleFund(req, session.user.id);
    } else if (path.endsWith("/resolve")) {
      return handleResolve(req, session.user.id);
    } else if (path.endsWith("/status")) {
      return handleStatus(req);
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[ESCROW_POST]", error);
    return NextResponse.json(
      { error: "Failed to process escrow" },
      { status: 500 },
    );
  }
}

async function handleFund(req: NextRequest, userId: string) {
  const body = await req.json();
  const parsed = fundEscrowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { taskId, workerAddress, tokenAddress, amountRaw, decimals, txHash, blockNumber, deadline } = parsed.data;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  if (task.publisherId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (task.status !== "OPEN") {
    return NextResponse.json({ error: "Task is not open for funding" }, { status: 400 });
  }

  const escrow = await prisma.escrow.upsert({
    where: { taskId },
    update: {
      contractAddress: txHash,
      chainId: task.chainId,
      tokenAddress,
      amountRaw,
      decimals,
      publisherAddress: workerAddress,
      fundedTxHash: txHash,
      fundedBlockNumber: BigInt(blockNumber),
      status: "funded",
      expiresAt: new Date(deadline),
    },
    create: {
      taskId,
      contractAddress: txHash,
      chainId: task.chainId,
      tokenAddress,
      amountRaw,
      decimals,
      publisherAddress: workerAddress,
      fundedTxHash: txHash,
      fundedBlockNumber: BigInt(blockNumber),
      status: "funded",
      expiresAt: new Date(deadline),
    },
  });

  await prisma.transaction.create({
    data: {
      userId,
      type: TransactionType.ESCROW_LOCK,
      status: TransactionStatus.CONFIRMED,
      chainId: task.chainId,
      tokenSymbol: task.currency as TokenSymbol,
      tokenAddress,
      amountRaw,
      decimals,
      txHash,
      blockNumber: BigInt(blockNumber),
      toAddress: workerAddress,
      relatedTaskId: taskId,
      confirmedAt: new Date(),
    },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: {
      escrowAddress: txHash,
      escrowTxHash: txHash,
      escrowBlockNumber: BigInt(blockNumber),
      tokenAddress,
    },
  });

  return NextResponse.json(escrow, { status: 201 });
}

async function handleResolve(req: NextRequest, userId: string) {
  const body = await req.json();
  const parsed = resolveEscrowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { action, txHash, blockNumber } = parsed.data;

  const escrow = await prisma.escrow.findFirst({
    where: {
      OR: [
        { task: { publisherId: userId } },
        { task: { assignedToId: userId } },
      ],
    },
    include: { task: true },
  });

  if (!escrow) {
    return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (action === "release") {
    updateData.status = "released";
    updateData.releasedTxHash = txHash;
  } else if (action === "refund") {
    updateData.status = "refunded";
    updateData.refundedTxHash = txHash;
  } else if (action === "expire") {
    updateData.status = "expired";
  }

  await prisma.escrow.update({
    where: { id: escrow.id },
    data: updateData,
  });

  const transactionType =
    action === "release"
      ? TransactionType.ESCROW_RELEASE
      : action === "refund"
        ? TransactionType.ESCROW_REFUND
        : TransactionType.WITHDRAWAL;

  await prisma.transaction.create({
    data: {
      userId: escrow.task.publisherId,
      type: transactionType,
      status: TransactionStatus.CONFIRMED,
      chainId: escrow.chainId,
      tokenSymbol: escrow.task.currency as TokenSymbol,
      tokenAddress: escrow.tokenAddress,
      amountRaw: escrow.amountRaw,
      decimals: escrow.decimals,
      txHash,
      blockNumber: BigInt(blockNumber),
      relatedTaskId: escrow.taskId,
      confirmedAt: new Date(),
    },
  });

  if (action === "release") {
    await prisma.task.update({
      where: { id: escrow.taskId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }

  return NextResponse.json({ success: true });
}

async function handleStatus(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  const escrow = await prisma.escrow.findUnique({
    where: { taskId },
    include: { task: { select: { id: true, publisherId: true, assignedToId: true, status: true } } },
  });

  if (!escrow) {
    return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
  }

  return NextResponse.json(escrow);
}