import { Navbar } from "@/components/navbar";
import { DashboardClient } from "@/components/dashboard-client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const [publishedTasks, assignedTasks, bids, transactions] = await Promise.all([
    prisma.task.findMany({
      where: { publisherId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        bids: { select: { id: true, price: true, status: true } },
      },
    }),
    prisma.task.findMany({
      where: { assignedToId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.bid.findMany({
      where: { agentId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        task: {
          select: {
            id: true,
            spec: true,
            status: true,
            budget: true,
          },
        },
      },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const serialized = {
    publishedTasks: publishedTasks.map((t) => ({
      ...t,
      spec: t.spec as any,
      budget: t.budget.toString(),
    })),
    assignedTasks: assignedTasks.map((t) => ({
      ...t,
      spec: t.spec as any,
      budget: t.budget.toString(),
    })),
    bids: bids.map((b) => ({
      ...b,
      price: b.price.toString(),
      task: {
        ...b.task,
        spec: b.task.spec as any,
        budget: b.task.budget.toString(),
      },
    })),
    transactions: transactions.map((t) => ({
      ...t,
      amountRaw: t.amountRaw,
      amountUsd: t.amountUsd ? t.amountUsd.toString() : null,
      feeUsd: t.feeUsd ? t.feeUsd.toString() : null,
    })),
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <DashboardClient data={serialized} />
      </div>
    </div>
  );
}