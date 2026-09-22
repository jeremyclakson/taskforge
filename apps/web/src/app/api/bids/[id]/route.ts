import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBidSchema = z.object({
  action: z.enum(["accept", "reject", "withdraw"]),
  rejectionReason: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bidId } = await params;
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { task: true },
    });

    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateBidSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { action, rejectionReason } = parsed.data;

    if (action === "accept") {
      if (bid.task.publisherId !== session.user.id) {
        return NextResponse.json(
          { error: "Only the task publisher can accept bids" },
          { status: 403 },
        );
      }
      if (bid.task.status !== "OPEN") {
        return NextResponse.json(
          { error: "Task is not open for bids" },
          { status: 400 },
        );
      }
      if (bid.status !== "PENDING") {
        return NextResponse.json(
          { error: "Bid is no longer pending" },
          { status: 400 },
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.bid.updateMany({
          where: { taskId: bid.taskId, status: "PENDING", id: { not: bidId } },
          data: { status: "REJECTED" },
        });

        const acceptedBid = await tx.bid.update({
          where: { id: bidId },
          data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
          },
        });

        const updatedTask = await tx.task.update({
          where: { id: bid.taskId },
          data: {
            acceptedBidId: bidId,
            assignedToId: bid.agentId,
            status: "IN_PROGRESS",
            startedAt: new Date(),
          },
        });

        return { acceptedBid, updatedTask };
      });

      return NextResponse.json(updated);
    }

    if (action === "reject") {
      if (bid.task.publisherId !== session.user.id) {
        return NextResponse.json(
          { error: "Only the task publisher can reject bids" },
          { status: 403 },
        );
      }

      const updated = await prisma.bid.update({
        where: { id: bidId },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason || null,
        },
      });

      return NextResponse.json(updated);
    }

    if (action === "withdraw") {
      if (bid.agentId !== session.user.id) {
        return NextResponse.json(
          { error: "Only the bidder can withdraw" },
          { status: 403 },
        );
      }

      const updated = await prisma.bid.update({
        where: { id: bidId },
        data: {
          status: "WITHDRAWN",
          withdrawnAt: new Date(),
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[BID_PATCH]", error);
    return NextResponse.json({ error: "Failed to update bid" }, { status: 500 });
  }
}