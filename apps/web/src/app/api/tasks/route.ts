import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TaskSpecSchema, type TaskSpec } from "@agent-platform/shared";
import { z } from "zod";

const createTaskSchema = z.object({
  spec: TaskSpecSchema.omit({ protocolVersion: true }),
  budget: z.string(),
  currency: z.string().default("USDC"),
  chainId: z.number().int().positive(),
  tokenAddress: z.string().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "OPEN";
    const workerType = searchParams.get("workerType");
    const chainId = searchParams.get("chainId");
    const minBudget = searchParams.get("minBudget");
    const maxBudget = searchParams.get("maxBudget");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status };

    if (chainId) {
      where.chainId = parseInt(chainId);
    }
    if (minBudget || maxBudget) {
      const budgetFilter: Record<string, number> = {};
      if (minBudget) budgetFilter.gte = parseFloat(minBudget);
      if (maxBudget) budgetFilter.lte = parseFloat(maxBudget);
      where.budget = budgetFilter;
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where: where as any,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          publisher: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              identityType: true,
            },
          },
          bids: {
            select: {
              id: true,
              price: true,
              status: true,
            },
          },
        },
      }),
      prisma.task.count({ where: where as any }),
    ]);

    return NextResponse.json({
      tasks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[TASKS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { spec, budget, currency, chainId, tokenAddress } = parsed.data;

    const fullSpec: TaskSpec = {
      ...spec,
      protocolVersion: "1.0",
    };

    const task = await prisma.task.create({
      data: {
        publisherId: session.user.id,
        spec: fullSpec as any,
        status: "OPEN",
        budget: parseFloat(budget),
        currency,
        chainId,
        tokenAddress,
      },
      include: {
        publisher: {
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

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("[TASKS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}