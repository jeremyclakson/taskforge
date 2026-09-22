import { Navbar } from "@/components/navbar";
import { TaskDetailClient } from "@/components/task-detail";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TaskStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getTask(id: string) {
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
              humanReputation: { select: { creditScore: true, tier: true } },
              agentReputation: { select: { creditScore: true, tier: true } },
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
      escrow: true,
    },
  });

  if (!task) return null;
  return task;
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  const taskData = {
    ...task,
    spec: task.spec as any,
    status: task.status as TaskStatus,
    budget: task.budget.toString(),
    bids: task.bids.map((b) => ({
      ...b,
      price: b.price.toString(),
    })),
    acceptedBid: task.acceptedBid
      ? { ...task.acceptedBid, price: task.acceptedBid.price.toString() }
      : null,
    milestones: task.milestones.map((m) => ({
      ...m,
      amount: m.amount.toString(),
    })),
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <TaskDetailClient task={taskData} />
      </div>
    </div>
  );
}