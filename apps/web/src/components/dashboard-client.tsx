"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatUsd, timeAgo, cn } from "@/lib/utils";
import { Coins, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

interface DashboardData {
  publishedTasks: Array<{
    id: string;
    spec: { title: string };
    status: string;
    budget: string;
    createdAt: Date;
    bids: Array<{ id: string; price: { toString(): string }; status: string }>;
  }>;
  assignedTasks: Array<{
    id: string;
    spec: { title: string };
    status: string;
    budget: string;
    createdAt: Date;
  }>;
  bids: Array<{
    id: string;
    price: string;
    status: string;
    createdAt: Date;
    task: {
      id: string;
      spec: { title: string };
      status: string;
      budget: string;
    };
  }>;
  transactions: Array<{
    id: string;
    type: string;
    status: string;
    tokenSymbol: string;
    amountRaw: string;
    amountUsd: string | null;
    txHash: string | null;
    createdAt: Date;
  }>;
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"published" | "assigned" | "bids" | "transactions">("published");

  const stats = {
    published: data.publishedTasks.length,
    assigned: data.assignedTasks.length,
    activeBids: data.bids.filter((b) => b.status === "PENDING").length,
    totalEarnings: data.transactions
      .filter((t) => t.type === "ESCROW_RELEASE")
      .reduce((sum, t) => sum + parseFloat(t.amountUsd || "0"), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>
        <p className="mt-1 text-zinc-400">
          Welcome back, {session?.user?.name || session?.user?.email}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="text-2xl font-bold text-indigo-400">{stats.published}</div>
          <div className="text-sm text-zinc-500">Posted Tasks</div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="text-2xl font-bold text-green-400">{stats.assigned}</div>
          <div className="text-sm text-zinc-500">Assigned Tasks</div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="text-2xl font-bold text-yellow-400">{stats.activeBids}</div>
          <div className="text-sm text-zinc-500">Active Bids</div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="text-2xl font-bold text-indigo-400">{formatUsd(stats.totalEarnings)}</div>
          <div className="text-sm text-zinc-500">Total Earnings</div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-zinc-800 overflow-x-auto">
        {[
          { id: "published", label: "Posted Tasks" },
          { id: "assigned", label: "Assigned Tasks" },
          { id: "bids", label: "My Bids" },
          { id: "transactions", label: "Transactions" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              tab === t.id
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[200px]">
        {tab === "published" && (
          <div className="space-y-3">
            {data.publishedTasks.length === 0 ? (
              <EmptyState message="No tasks posted yet" cta="/tasks/new" ctaLabel="Post a Task" />
            ) : (
              data.publishedTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700"
                >
                  <div>
                    <div className="font-medium">{task.spec.title}</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {task.bids.length} bids · {timeAgo(task.createdAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-indigo-400">{formatUsd(task.budget)}</div>
                    <span className={cn(
                      "text-xs",
                      task.status === "OPEN" ? "text-green-400" : "text-zinc-500"
                    )}>
                      {task.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {tab === "assigned" && (
          <div className="space-y-3">
            {data.assignedTasks.length === 0 ? (
              <EmptyState message="No assigned tasks yet" cta="/tasks" ctaLabel="Browse Tasks" />
            ) : (
              data.assignedTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700"
                >
                  <div>
                    <div className="font-medium">{task.spec.title}</div>
                    <div className="text-xs text-zinc-500 mt-1">{timeAgo(task.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-indigo-400">{formatUsd(task.budget)}</div>
                    <span className="text-xs text-blue-400">{task.status}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {tab === "bids" && (
          <div className="space-y-3">
            {data.bids.length === 0 ? (
              <EmptyState message="No bids placed yet" cta="/tasks" ctaLabel="Browse Tasks" />
            ) : (
              data.bids.map((bid) => (
                <Link
                  key={bid.id}
                  href={`/tasks/${bid.task.id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700"
                >
                  <div>
                    <div className="font-medium">{bid.task.spec.title}</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Bid: {formatUsd(bid.price)} · {timeAgo(bid.createdAt)}
                    </div>
                  </div>
                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-full",
                    bid.status === "ACCEPTED" ? "bg-indigo-500/10 text-indigo-400" :
                    bid.status === "PENDING" ? "bg-yellow-500/10 text-yellow-400" :
                    "bg-zinc-800 text-zinc-500"
                  )}>
                    {bid.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        )}

        {tab === "transactions" && (
          <div className="space-y-3">
            {data.transactions.length === 0 ? (
              <EmptyState message="No transactions yet" />
            ) : (
              data.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full",
                      tx.type === "ESCROW_RELEASE" ? "bg-green-500/10 text-green-400" :
                      tx.type === "ESCROW_LOCK" ? "bg-yellow-500/10 text-yellow-400" :
                      tx.type === "WITHDRAWAL" ? "bg-blue-500/10 text-blue-400" :
                      "bg-zinc-800 text-zinc-400"
                    )}>
                      {tx.type === "WITHDRAWAL" ? <ArrowUpRight className="h-4 w-4" /> :
                       tx.type === "ESCROW_RELEASE" ? <ArrowDownLeft className="h-4 w-4" /> :
                       <Coins className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{tx.type.replace(/_/g, " ")}</div>
                      <div className="text-xs text-zinc-500">
                        {tx.tokenSymbol} · {timeAgo(tx.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {tx.amountUsd ? formatUsd(tx.amountUsd) : "—"}
                    </div>
                    <span className={cn(
                      "text-xs",
                      tx.status === "CONFIRMED" ? "text-green-400" :
                      tx.status === "PENDING" ? "text-yellow-400" :
                      "text-red-400"
                    )}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message, cta, ctaLabel }: { message: string; cta?: string; ctaLabel?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
      <p className="text-zinc-500">{message}</p>
      {cta && ctaLabel && (
        <Link
          href={cta}
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}