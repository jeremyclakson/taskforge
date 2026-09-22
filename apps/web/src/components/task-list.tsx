"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatAddress, formatUsd, timeAgo, cn } from "@/lib/utils";
import { Bot, User, Building2 } from "lucide-react";
import { useMemo, useState } from "react";

interface TaskListProps {
  initialTasks: Array<{
    id: string;
    spec: { title: string; taskType: string; workerType: string; category?: string; tags?: string[]; pricing?: { amount: string } };
    budget: { toString(): string };
    currency: string;
    chainId: number;
    status: string;
    applicationCount: number;
    viewCount: number;
    createdAt: Date;
    publisher: {
      id: string;
      username: string | null;
      displayName: string | null;
      avatarUrl: string | null;
      identityType: string;
    };
    bids: Array<{ id: string; price: { toString(): string }; status: string }>;
  }>;
}

const workerTypeFilters = [
  { value: "ALL", label: "All" },
  { value: "HUMAN", label: "Human Only" },
  { value: "AGENT", label: "Agent Only" },
  { value: "BOTH", label: "Open to Both" },
] as const;

export function TaskList({ initialTasks }: TaskListProps) {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<string>(searchParams.get("workerType") || "ALL");
  const [sortBy, setSortBy] = useState<"newest" | "budget">("newest");

  const filtered = useMemo(() => {
    let result = initialTasks;
    if (filter !== "ALL") {
      result = result.filter((t) => t.spec.workerType === filter);
    }
    if (sortBy === "budget") {
      result = [...result].sort((a, b) => {
        const aBudget = typeof a.budget === "object" ? a.budget.toString() : String(a.budget);
        const bBudget = typeof b.budget === "object" ? b.budget.toString() : String(b.budget);
        return parseFloat(bBudget) - parseFloat(aBudget);
      });
    }
    return result;
  }, [initialTasks, filter, sortBy]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex gap-2">
          {workerTypeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                filter === f.value
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "newest" | "budget")}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-200"
        >
          <option value="newest">Newest</option>
          <option value="budget">Highest Budget</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <p className="text-zinc-500">No tasks found. Try adjusting filters.</p>
          <Link
            href="/tasks/new"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Post the first task
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((task) => {
            const budgetStr = typeof task.budget === "object" ? task.budget.toString() : String(task.budget);
            return (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-indigo-500/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400">
                        {task.spec.taskType}
                      </span>
                      <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400">
                        {task.spec.workerType === "HUMAN" && <User className="inline h-3 w-3 mr-1" />}
                        {task.spec.workerType === "AGENT" && <Bot className="inline h-3 w-3 mr-1" />}
                        {task.spec.workerType === "BOTH" && (
                          <>
                            <User className="inline h-3 w-3 mr-1" />
                            <Bot className="inline h-3 w-3 mr-1" />
                          </>
                        )}
                        {task.spec.workerType}
                      </span>
                      {task.spec.category && (
                        <span className="text-xs text-zinc-500">{task.spec.category}</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-indigo-300 transition-colors">
                      {task.spec.title}
                    </h3>
                    <div className="mt-3 flex items-center gap-4 text-sm text-zinc-500">
                      <span>
                        {task.publisher.identityType === "COMPANY" ? (
                          <Building2 className="inline h-3.5 w-3.5 mr-1" />
                        ) : task.publisher.identityType === "AGENT_OPERATOR" ? (
                          <Bot className="inline h-3.5 w-3.5 mr-1" />
                        ) : (
                          <User className="inline h-3.5 w-3.5 mr-1" />
                        )}
                        {task.publisher.displayName || task.publisher.username || formatAddress(task.publisher.id)}
                      </span>
                      <span>{task.bids.length} bids</span>
                      <span>{task.viewCount} views</span>
                      <span>{timeAgo(task.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-bold text-indigo-400">
                      {formatUsd(budgetStr)}
                    </div>
                    <div className="text-xs text-zinc-500">{task.currency}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}