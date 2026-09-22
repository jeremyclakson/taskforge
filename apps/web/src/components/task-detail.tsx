"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { formatUsd, timeAgo, formatAddress, cn } from "@/lib/utils";
import { Bot, User, Building2, Coins, Shield, Clock, Tag, CheckCircle2, XCircle } from "lucide-react";

interface TaskDetailClientProps {
  task: {
    id: string;
    spec: {
      title: string;
      description: string;
      taskType: string;
      category?: string;
      tags?: string[];
      workerType: string;
      pricing?: { amount: string };
      requiredSkills?: string[];
      deadline?: string;
      estimatedDurationHours?: number;
      validation?: { type: string; criteria: Array<{ description: string; weight: number; type: string }> };
    };
    budget: string;
    currency: string;
    chainId: number;
    status: string;
    viewCount: number;
    applicationCount: number;
    createdAt: Date;
    publisher: {
      id: string;
      username: string | null;
      displayName: string | null;
      avatarUrl: string | null;
      identityType: string;
      humanReputation: { creditScore: number; tier: string } | null;
      agentReputation: { creditScore: number; tier: string } | null;
    };
    acceptedBid: {
      id: string;
      price: string;
      agent: {
        id: string;
        username: string | null;
        displayName: string | null;
        avatarUrl: string | null;
        identityType: string;
      };
    } | null;
    bids: Array<{
      id: string;
      price: string;
      currency: string;
      proposal?: string | null;
      estimatedDays?: number | null;
      status: string;
      createdAt: Date;
      agent: {
        id: string;
        username: string | null;
        displayName: string | null;
        avatarUrl: string | null;
        identityType: string;
        humanReputation: { creditScore: number; tier: string } | null;
        agentReputation: { creditScore: number; tier: string } | null;
      };
    }>;
    milestones: Array<{
      id: string;
      name: string;
      amount: string;
      status: string;
    }>;
  };
}

export function TaskDetailClient({ task }: TaskDetailClientProps) {
  const { data: session } = useSession();
  const { address } = useAccount();
  const router = useRouter();
  const [bidding, setBidding] = useState(false);
  const [bidForm, setBidForm] = useState({
    price: "",
    proposal: "",
    estimatedDays: "",
  });

  const isOwner = session?.user?.id === task.publisher.id;
  const hasBid = task.bids.some((b) => b.agent.id === session?.user?.id);
  const canBid =
    task.status === "OPEN" && !isOwner && !hasBid && !!session;

  async function handleBid(e: React.FormEvent) {
    e.preventDefault();
    setBidding(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: bidForm.price,
          currency: task.currency,
          proposal: bidForm.proposal,
          estimatedDays: bidForm.estimatedDays
            ? parseInt(bidForm.estimatedDays)
            : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to place bid");
      }

      toast.success("Bid placed successfully!");
      setBidForm({ price: "", proposal: "", estimatedDays: "" });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place bid");
    } finally {
      setBidding(false);
    }
  }

  async function handleAcceptBid(bidId: string) {
    try {
      const res = await fetch(`/api/bids/${bidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to accept bid");
      }

      toast.success("Bid accepted! Task is now in progress.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept bid");
    }
  }

  async function handleRejectBid(bidId: string) {
    try {
      const res = await fetch(`/api/bids/${bidId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      if (!res.ok) throw new Error("Failed to reject bid");
      toast.success("Bid rejected");
      router.refresh();
    } catch {
      toast.error("Failed to reject bid");
    }
  }

  async function handleComplete() {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      if (!res.ok) throw new Error("Failed to complete task");
      toast.success("Task marked as completed! Escrow will be released.");
      router.refresh();
    } catch {
      toast.error("Failed to complete task");
    }
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-zinc-700 text-zinc-300",
    OPEN: "bg-green-500/10 text-green-400",
    IN_PROGRESS: "bg-blue-500/10 text-blue-400",
    REVIEW: "bg-yellow-500/10 text-yellow-400",
    COMPLETED: "bg-indigo-500/10 text-indigo-400",
    DISPUTED: "bg-red-500/10 text-red-400",
    CANCELLED: "bg-zinc-700 text-zinc-400",
  };

  const identityIcon = (type: string) => {
    if (type === "COMPANY") return <Building2 className="h-4 w-4" />;
    if (type === "AGENT_OPERATOR") return <Bot className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <button onClick={() => router.push("/tasks")} className="hover:text-zinc-300">
          ← Back to Tasks
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className={cn("rounded-full px-3 py-1 text-xs font-medium", statusColors[task.status])}>
            {task.status.replace(/_/g, " ")}
          </span>
          <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs text-indigo-400">
            {task.spec.taskType}
          </span>
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            {task.spec.workerType === "HUMAN" && <User className="h-3 w-3" />}
            {task.spec.workerType === "AGENT" && <Bot className="h-3 w-3" />}
            {task.spec.workerType === "BOTH" && (
              <>
                <User className="h-3 w-3" />
                <Bot className="h-3 w-3" />
              </>
            )}
            {task.spec.workerType}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold">{task.spec.title}</h1>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
              {identityIcon(task.publisher.identityType)}
            </div>
            <div>
              <div className="text-sm font-medium">
                {task.publisher.displayName || task.publisher.username || formatAddress(task.publisher.id)}
              </div>
              <div className="text-xs text-zinc-500">
                {task.publisher.humanReputation && `Score: ${task.publisher.humanReputation.creditScore} · ${task.publisher.humanReputation.tier}`}
                {task.publisher.agentReputation && `Score: ${task.publisher.agentReputation.creditScore} · ${task.publisher.agentReputation.tier}`}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-400">{formatUsd(task.budget)}</div>
            <div className="text-xs text-zinc-500">{task.currency}</div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold mb-3">Description</h2>
            <p className="whitespace-pre-wrap text-zinc-300">{task.spec.description}</p>
          </div>

          {task.spec.validation?.criteria && task.spec.validation.criteria.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold mb-3">Acceptance Criteria</h2>
              <ul className="space-y-2">
                {task.spec.validation.criteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                    {c.description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {task.bids.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold mb-4">
                Bids ({task.bids.length})
              </h2>
              <div className="space-y-3">
                {task.bids.map((bid) => (
                  <div
                    key={bid.id}
                    className={cn(
                      "rounded-xl border p-4",
                      bid.status === "ACCEPTED"
                        ? "border-indigo-500/50 bg-indigo-500/5"
                        : "border-zinc-800 bg-zinc-950",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                          {identityIcon(bid.agent.identityType)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            {bid.agent.displayName || bid.agent.username || formatAddress(bid.agent.id)}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {bid.agent.humanReputation && `${bid.agent.humanReputation.creditScore} pts`}
                            {bid.agent.agentReputation && `${bid.agent.agentReputation.creditScore} pts`}
                            {bid.estimatedDays && ` · ${bid.estimatedDays}d`}
                            {" · "}{timeAgo(bid.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-indigo-400">
                          {formatUsd(bid.price)}
                        </div>
                        <span className={cn(
                          "text-xs",
                          bid.status === "ACCEPTED" ? "text-indigo-400" : "text-zinc-500"
                        )}>
                          {bid.status}
                        </span>
                      </div>
                    </div>
                    {bid.proposal && (
                      <p className="mt-3 text-sm text-zinc-400">{bid.proposal}</p>
                    )}
                    {isOwner && task.status === "OPEN" && bid.status === "PENDING" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleAcceptBid(bid.id)}
                          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectBid(bid.id)}
                          className="rounded-lg border border-zinc-700 px-4 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {canBid && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold mb-4">Place a Bid</h2>
              <form onSubmit={handleBid} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                      Your Price (USD) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={bidForm.price}
                      onChange={(e) =>
                        setBidForm((p) => ({ ...p, price: e.target.value }))
                      }
                      placeholder="80.00"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                      Estimated Days
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={bidForm.estimatedDays}
                      onChange={(e) =>
                        setBidForm((p) => ({ ...p, estimatedDays: e.target.value }))
                      }
                      placeholder="3"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Proposal
                  </label>
                  <textarea
                    rows={4}
                    value={bidForm.proposal}
                    onChange={(e) =>
                      setBidForm((p) => ({ ...p, proposal: e.target.value }))
                    }
                    placeholder="Describe your approach, relevant experience, etc."
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={bidding}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {bidding ? "Placing bid..." : "Place Bid"}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase text-zinc-500">Task Info</h2>

            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <Coins className="h-4 w-4" /> Budget
              </span>
              <span className="font-medium">{formatUsd(task.budget)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> Escrow
              </span>
              <span className="font-medium">{task.status === "OPEN" ? "Pending" : "Funded"}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> Posted
              </span>
              <span className="font-medium">{timeAgo(task.createdAt)}</span>
            </div>

            {task.spec.tags && task.spec.tags.length > 0 && (
              <div>
                <div className="text-xs text-zinc-500 mb-2 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {task.spec.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {task.spec.requiredSkills && task.spec.requiredSkills.length > 0 && (
              <div>
                <div className="text-xs text-zinc-500 mb-2">Required Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {task.spec.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs text-indigo-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {isOwner && task.status === "IN_PROGRESS" && (
              <button
                onClick={handleComplete}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Mark as Complete
              </button>
            )}

            {!session && task.status === "OPEN" && (
              <button
                onClick={() => router.push("/auth/signin")}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Sign In to Bid
              </button>
            )}

            {session && !isOwner && !hasBid && task.status === "OPEN" && !address && (
              <div className="text-xs text-zinc-500 text-center">
                Connect wallet to place a bid
              </div>
            )}
          </div>

          {task.acceptedBid && (
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                <h2 className="text-sm font-semibold">Assigned To</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                  {identityIcon(task.acceptedBid.agent.identityType)}
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {task.acceptedBid.agent.displayName ||
                      task.acceptedBid.agent.username ||
                      formatAddress(task.acceptedBid.agent.id)}
                  </div>
                  <div className="text-xs text-zinc-500">
                    Bid: {formatUsd(task.acceptedBid.price)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {task.milestones.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-sm font-semibold uppercase text-zinc-500 mb-3">Milestones</h2>
              <div className="space-y-3">
                {task.milestones.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">{m.name}</span>
                    <span className="text-zinc-500">{formatUsd(m.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}