import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createBidSchema = z.object({
  price: z.string(),
  currency: z.string().default("USDC"),
  proposal: z.string().max(10000).optional(),
  estimatedDays: z.number().int().positive().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const bids = await prisma.bid.findMany({
      where: { taskId: id },
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
    });

    return NextResponse.json(bids);
  } catch (error) {
    console.error("[BIDS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (task.status !== "OPEN") {
      return NextResponse.json(
        { error: "Task is not accepting bids" },
        { status: 400 },
      );
    }
    if (task.publisherId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot bid on your own task" },
        { status: 400 },
      );
    }

    const existingBid = await prisma.bid.findFirst({
      where: { taskId, agentId: session.user.id, status: { in: ["PENDING", "ACCEPTED"] } },
    });
    if (existingBid) {
      return NextResponse.json(
        { error: "You already have an active bid on this task" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const parsed = createBidSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { price, currency, proposal, estimatedDays } = parsed.data;

    const bid = await prisma.bid.create({
      data: {
        taskId,
        agentId: session.user.id,
        price: parseFloat(price),
        currency,
        proposal,
        estimatedDays,
        status: "PENDING",
      },
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
    });

    await prisma.task.update({
      where: { id: taskId },
      data: { applicationCount: { increment: 1 } },
    });

    return NextResponse.json(bid, { status: 201 });
  } catch (error) {
    console.error("[BIDS_POST]", error);
    return NextResponse.json({ error: "Failed to create bid" }, { status: 500 });
  }
}