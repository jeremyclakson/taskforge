import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { TransactionType, TransactionStatus } from "@agent-platform/shared";

const fundSchema = z.object({
  taskId: z.string().cuid(),
  workerAddress: z.string(),
  tokenAddress: z.string(),
  amountRaw: z.string(),
  decimals: z.number().int().positive(),
  txHash: z.string(),
  blockNumber: z.number().int().positive(),
  deadline: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = fundSchema.safeParse(body);
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
    if (task.publisherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (task.status !== "OPEN") {
      return NextResponse.json({ error: "Task is not open for funding" }, { status: 400 });
    }

    const existingEscrow = await prisma.escrow.findUnique({ where: { taskId } });
    if (existingEscrow) {
      return NextResponse.json({ error: "Escrow already exists for this task" }, { status: 400 });
    }

    const escrow = await prisma.escrow.create({
      data: {
        taskId,
        contractAddress: txHash,
        chainId: task.chainId,
        tokenAddress,
        amountRaw,
        decimals,
        publisherAddress: session.user.id,
        fundedTxHash: txHash,
        fundedBlockNumber: BigInt(blockNumber),
        status: "funded",
        expiresAt: new Date(deadline),
      },
    });

    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: TransactionType.ESCROW_LOCK,
        status: TransactionStatus.CONFIRMED,
        chainId: task.chainId,
        tokenSymbol: task.currency,
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
  } catch (error) {
    console.error("[ESCROW_FUND]", error);
    return NextResponse.json({ error: "Failed to fund escrow" }, { status: 500 });
  }
}