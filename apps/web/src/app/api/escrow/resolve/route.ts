import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { TransactionType, TransactionStatus } from "@agent-platform/shared";

const resolveSchema = z.object({
  taskId: z.string().cuid(),
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

    const body = await req.json();
    const parsed = resolveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { taskId, action, txHash, blockNumber } = parsed.data;

    const escrow = await prisma.escrow.findUnique({
      where: { taskId },
      include: { task: true },
    });

    if (!escrow) {
      return NextResponse.json({ error: "Escrow not found" }, { status: 404 });
    }

    if (escrow.task.publisherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
        tokenSymbol: escrow.task.currency,
        tokenAddress: escrow.tokenAddress,
        amountRaw: escrow.amountRaw,
        decimals: escrow.decimals,
        txHash,
        blockNumber: BigInt(blockNumber),
        relatedTaskId: taskId,
        confirmedAt: new Date(),
      },
    });

    if (action === "release") {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
    } else if (action === "refund") {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "Escrow refunded" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ESCROW_RESOLVE]", error);
    return NextResponse.json({ error: "Failed to resolve escrow" }, { status: 500 });
  }
}