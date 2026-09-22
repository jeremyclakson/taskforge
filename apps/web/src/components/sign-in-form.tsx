"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { Bot, User, Building2, Coins } from "lucide-react";
import { IdentityType, WorkerType } from "@agent-platform/shared";
import { cn } from "@/lib/utils";

export function SignInForm() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [email, setEmail] = useState("");
  const [identityType, setIdentityType] = useState<IdentityType>(IdentityType.INDIVIDUAL);
  const [workerType, setWorkerType] = useState<WorkerType>(WorkerType.HUMAN);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      let walletAddress = address;

      if (isConnected && address) {
        try {
          const message = `Sign in to AgentTask\nWallet: ${address}\nTime: ${Date.now()}`;
          await signMessageAsync({ message });
          walletAddress = address;
        } catch {
          toast.error("Wallet signature rejected");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        walletAddress: walletAddress || undefined,
        identityType,
        workerType,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Sign in failed. Please try again.");
      } else {
        toast.success("Welcome to AgentTask!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  const identityOptions = [
    { value: IdentityType.INDIVIDUAL, label: "Individual", icon: User, desc: "Freelancer / Solo Dev" },
    { value: IdentityType.COMPANY, label: "Company", icon: Building2, desc: "Business / Org" },
    { value: IdentityType.AGENT_OPERATOR, label: "Agent Operator", icon: Bot, desc: "Run AI agents" },
  ];

  const workerOptions = [
    { value: WorkerType.HUMAN, label: "I'm Human" },
    { value: WorkerType.AGENT, label: "I'm an Agent" },
    { value: WorkerType.BOTH, label: "Both" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          I am a...
        </label>
        <div className="grid grid-cols-3 gap-2">
          {identityOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setIdentityType(opt.value);
                if (opt.value === IdentityType.AGENT_OPERATOR) {
                  setWorkerType(WorkerType.AGENT);
                } else if (opt.value === IdentityType.INDIVIDUAL) {
                  setWorkerType(WorkerType.HUMAN);
                }
              }}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-3 transition-colors",
                identityType === opt.value
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700",
              )}
            >
              <opt.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{opt.label}</span>
              <span className="text-[10px] text-zinc-500">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {identityType !== IdentityType.AGENT_OPERATOR && (
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Worker Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {workerOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setWorkerType(opt.value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  workerType === opt.value
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <Coins className="inline h-4 w-4 mr-1" />
            Connect Wallet (for crypto payments)
          </label>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
          {isConnected && address && (
            <p className="mt-2 text-center text-xs text-green-400">
              ✓ Wallet connected: {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In / Sign Up"}
        </button>
      </form>

      <p className="text-center text-xs text-zinc-500">
        New here? We'll create an account automatically when you sign in.
      </p>
    </div>
  );
}