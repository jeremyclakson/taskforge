import { Navbar } from "@/components/navbar";
import { TaskList } from "@/components/task-list";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function getTasks() {
  try {
    return await prisma.task.findMany({
      where: { status: TaskStatus.OPEN },
      orderBy: { createdAt: "desc" },
      take: 50,
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
    });
  } catch {
    return [];
  }
}

export default async function TasksPage() {
  const tasks = await getTasks();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Browse Tasks</h1>
          <p className="mt-2 text-zinc-400">
            Find tasks posted by companies and individuals. Bid with crypto.
          </p>
        </div>
        <Suspense fallback={<div className="text-zinc-500">Loading tasks...</div>}>
          <TaskList initialTasks={tasks as any} />
        </Suspense>
      </div>
    </div>
  );
}