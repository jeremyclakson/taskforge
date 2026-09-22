"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { TASK_CATEGORIES, WorkerType, ChainId, TokenSymbol } from "@agent-platform/shared";
import { Bot, User, Users, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export function NewTaskForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const { address } = useAccount();

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    taskType: "code-generation",
    category: "",
    workerType: WorkerType.BOTH,
    tags: "",
    budget: "",
    currency: TokenSymbol.USDC,
    chainId: ChainId.BASE,
    estimatedDurationHours: "",
    deadline: "",
    requiredSkills: "",
    minReputationScore: "0",
    inputType: "json",
    inputSchema: "{}",
    outputType: "json",
    outputSchema: "{}",
    executionRuntime: "nodejs:20",
    validationType: "hybrid",
    validationCriteria: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      toast.error("Please sign in first");
      router.push("/auth/signin");
      return;
    }
    if (!address) {
      toast.error("Please connect your wallet to fund the escrow");
      return;
    }

    setSubmitting(true);
    try {
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const requiredSkills = form.requiredSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const validationCriteria = form.validationCriteria
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => ({
          type: "human_review" as const,
          description: c,
          weight: 1,
        }));

      const payload = {
        spec: {
          taskType: form.taskType,
          category: form.category || undefined,
          tags,
          workerType: form.workerType,
          title: form.title,
          description: form.description,
          inputSchema: {
            type: form.inputType as "json" | "file" | "url" | "text" | "binary",
            schema: JSON.parse(form.inputSchema || "{}"),
          },
          outputSchema: {
            type: form.outputType as "json" | "file" | "url" | "text" | "binary",
            schema: JSON.parse(form.outputSchema || "{}"),
          },
          execution: {
            runtime: form.executionRuntime,
            timeoutSec: 300,
            deliverableFormat: "github_pr",
          },
          validation: {
            type: form.validationType as "auto" | "manual" | "hybrid",
            criteria: validationCriteria,
            autoApproveThreshold: 0.8,
          },
          pricing: {
            model: "fixed" as const,
            amount: form.budget,
            token: {
              chainId: form.chainId,
              symbol: form.currency,
              decimals: 6,
            },
          },
          requiredSkills,
          minReputationScore: parseInt(form.minReputationScore) || 0,
          allowAgent: form.workerType === WorkerType.AGENT || form.workerType === WorkerType.BOTH,
          allowHuman: form.workerType === WorkerType.HUMAN || form.workerType === WorkerType.BOTH,
          estimatedDurationHours: form.estimatedDurationHours
            ? parseInt(form.estimatedDurationHours)
            : undefined,
          deadline: form.deadline || undefined,
        },
        budget: form.budget,
        currency: form.currency,
        chainId: parseInt(String(form.chainId)),
        tokenAddress: null,
      };

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create task");
      }

      const task = await res.json();
      toast.success("Task created! Now fund the escrow to make it live.");
      router.push(`/tasks/${task.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  }

  const workerTypeOptions = [
    { value: WorkerType.HUMAN, label: "Human Only", icon: User },
    { value: WorkerType.AGENT, label: "Agent Only", icon: Bot },
    { value: WorkerType.BOTH, label: "Open to Both", icon: Users },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Task Details</h2>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            minLength={5}
            maxLength={200}
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="e.g. Build a React dashboard with real-time charts"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            required
            minLength={20}
            maxLength={50000}
            rows={6}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Describe what needs to be done, acceptance criteria, etc."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Task Type <span className="text-red-400">*</span>
            </label>
            <select
              value={form.taskType}
              onChange={(e) => update("taskType", e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100"
            >
              {TASK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Category
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              placeholder="e.g. frontend, backend, ml"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => update("tags", e.target.value)}
            placeholder="react, typescript, charts"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Who should do this task?</h2>
        <div className="grid grid-cols-3 gap-3">
          {workerTypeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update("workerType", opt.value)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors",
                form.workerType === opt.value
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700",
              )}
            >
              <opt.icon className="h-6 w-6" />
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Coins className="h-5 w-5 text-indigo-400" />
          Budget & Payment
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Budget (USD) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={form.budget}
              onChange={(e) => update("budget", e.target.value)}
              placeholder="100.00"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Currency
            </label>
            <select
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100"
            >
              <option value={TokenSymbol.USDC}>USDC</option>
              <option value={TokenSymbol.USDT}>USDT</option>
              <option value={TokenSymbol.ETH}>ETH</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Chain
          </label>
          <select
            value={form.chainId}
            onChange={(e) => update("chainId", e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100"
          >
            <option value={ChainId.BASE}>Base (Low fees)</option>
            <option value={ChainId.ARBITRUM}>Arbitrum One</option>
            <option value={ChainId.OPTIMISM}>Optimism</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Estimated Duration (hours)
            </label>
            <input
              type="number"
              min="1"
              value={form.estimatedDurationHours}
              onChange={(e) => update("estimatedDurationHours", e.target.value)}
              placeholder="48"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Deadline
            </label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => update("deadline", e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Required Skills (comma-separated)
          </label>
          <input
            type="text"
            value={form.requiredSkills}
            onChange={(e) => update("requiredSkills", e.target.value)}
            placeholder="React, TypeScript, WebSocket"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Minimum Reputation Score (0-1000)
          </label>
          <input
            type="number"
            min="0"
            max="1000"
            value={form.minReputationScore}
            onChange={(e) => update("minReputationScore", e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Input/Output Schema</h2>
        <p className="text-sm text-zinc-500">
          Define the expected input and output format for this task. This helps agents understand
          what data to process and what to deliver.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Input Type</label>
            <select
              value={form.inputType}
              onChange={(e) => update("inputType", e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100"
            >
              <option value="json">JSON</option>
              <option value="file">File</option>
              <option value="url">URL</option>
              <option value="text">Text</option>
              <option value="binary">Binary</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Output Type</label>
            <select
              value={form.outputType}
              onChange={(e) => update("outputType", e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100"
            >
              <option value="json">JSON</option>
              <option value="file">File</option>
              <option value="url">URL</option>
              <option value="text">Text</option>
              <option value="binary">Binary</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Input Schema (JSON)
            </label>
            <textarea
              rows={5}
              value={form.inputSchema}
              onChange={(e) => update("inputSchema", e.target.value)}
              placeholder='{"type": "object", "properties": {...}}'
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 font-mono text-sm text-zinc-100 placeholder-zinc-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Output Schema (JSON)
            </label>
            <textarea
              rows={5}
              value={form.outputSchema}
              onChange={(e) => update("outputSchema", e.target.value)}
              placeholder='{"type": "object", "properties": {...}}'
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 font-mono text-sm text-zinc-100 placeholder-zinc-600"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Validation Criteria</h2>
        <p className="text-sm text-zinc-500">
          One criteria per line. These will be checked when the task is submitted for review.
        </p>
        <textarea
          rows={4}
          value={form.validationCriteria}
          onChange={(e) => update("validationCriteria", e.target.value)}
          placeholder={"Code passes all tests\nNo TypeScript errors\nDocumentation updated\nCode reviewed by human"}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Creating..." : "Create Task"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3 font-medium text-zinc-300 hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}