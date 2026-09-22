import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        publisher: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            identityType: true,
            humanReputation: { select: { creditScore: true, tier: true } },
            agentReputation: { select: { creditScore: true, tier: true } },
          },
        },
        acceptedBid: {
          include: {
            agent: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                identityType: true,
              },
            },
          },
        },
        bids: {
          include: {
            agent: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                identityType: true,
                humanReputation: { select: { creditScore: true, tier: true } },
                agentReputation: { select: { creditScore: true, tier: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        milestones: true,
        reviews: true,
        escrow: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_GET]", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (task.publisherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updateData: Record<string, unknown> = {};

    if (body.status) updateData.status = body.status;
    if (body.escrowAddress) updateData.escrowAddress = body.escrowAddress;
    if (body.escrowTxHash) updateData.escrowTxHash = body.escrowTxHash;
    if (body.escrowBlockNumber) updateData.escrowBlockNumber = body.escrowBlockNumber;
    if (body.acceptedBidId !== undefined) {
      updateData.acceptedBidId = body.acceptedBidId;
      if (body.assignedToId) updateData.assignedToId = body.assignedToId;
      if (body.status === "IN_PROGRESS") {
        updateData.startedAt = new Date();
      }
    }
    if (body.status === "COMPLETED") {
      updateData.completedAt = new Date();
    }
    if (body.status === "CANCELLED") {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = body.cancelReason || "Cancelled by publisher";
    }

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[TASK_PATCH]", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (task.publisherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (task.status !== "DRAFT" && task.status !== "OPEN") {
      return NextResponse.json(
        { error: "Cannot delete task in current status" },
        { status: 400 },
      );
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TASK_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}