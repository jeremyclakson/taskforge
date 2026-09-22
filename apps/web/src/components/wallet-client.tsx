"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { formatAddress, formatUsd, cn } from "@/lib/utils";
import { Coins, Wallet, Plus, RefreshCw, Copy, CheckCircle2 } from "lucide-react";

export function WalletClient() {
  const queryClient = useQueryClient();
  const { address, isConnected } = useAccount();
  const [showAddModal, setShowAddModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: walletsData } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const res = await fetch("/api/wallet");
      if (!res.ok) return { wallets: [], balances: [] };
      return res.json();
    },
    enabled: isConnected,
  });

  const addWalletMutation = useMutation({
    mutationFn: async (wallet: { chainId: number; address: string; label?: string }) => {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wallet),
      });
      if (!res.ok) throw new Error("Failed to add wallet");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setShowAddModal(false);
      toast.success("Wallet added!");
    },
    onError: (err) => toast.error(err.message),
  });

  const wallets = walletsData?.wallets || [];
  const balances = walletsData?.balances || [];

  function copyAddress(addr: string) {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallet & Payments</h1>
          <p className="mt-1 text-zinc-400">Manage your crypto wallets and payment methods</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus className="mr-1.5 inline h-4 w-4" /> Add Wallet
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-indigo-400" />
          Connected Wallet
        </h2>
        <div className="flex items-center justify-between">
          <div>
            {isConnected ? (
              <>
                <div className="font-mono text-lg">{address}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500">{address ? formatAddress(address) : ""}</span>
                  <button
                    onClick={() => copyAddress(address || "")}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-zinc-500">No wallet connected</p>
            )}
          </div>
          <ConnectButton />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Coins className="h-5 w-5 text-indigo-400" />
          Balances
        </h2>
        {balances.length === 0 ? (
          <p className="text-zinc-500">No balances tracked yet. Fund your escrow to get started.</p>
        ) : (
          <div className="space-y-3">
            {balances.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl bg-zinc-950 p-4">
                <div>
                  <div className="font-medium">{b.tokenSymbol}</div>
                  <div className="text-xs text-zinc-500">
                    {b.chainId === 8453 ? "Base" : b.chainId === 42161 ? "Arbitrum" : b.chainId === 10 ? "Optimism" : `Chain ${b.chainId}`}
                    {b.tokenAddress && ` · ${formatAddress(b.tokenAddress)}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-indigo-400">
                    {formatTokenAmount(b.balanceRaw, b.decimals)} {b.tokenSymbol}
                  </div>
                  {b.lockedRaw && b.lockedRaw !== "0" && (
                    <div className="text-xs text-yellow-400">
                      {formatTokenAmount(b.lockedRaw, b.decimals)} locked
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-indigo-400" />
          Registered Wallets
        </h2>
        {wallets.length === 0 ? (
          <p className="text-zinc-500">No wallets registered yet.</p>
        ) : (
          <div className="space-y-3">
            {wallets.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between rounded-xl bg-zinc-950 p-4">
                <div>
                  <div className="font-mono">{w.address}</div>
                  <div className="text-xs text-zinc-500">
                    {w.chainId === 8453 ? "Base" : w.chainId === 42161 ? "Arbitrum" : w.chainId === 10 ? "Optimism" : `Chain ${w.chainId}`}
                    {w.label && ` · ${w.label}`}
                    {w.isPrimary && " · Primary"}
                  </div>
                </div>
                <button
                  onClick={() => copyAddress(w.address)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAddModal(false)}>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Add Wallet</h3>
            <AddWalletForm
              onAdd={(wallet) => addWalletMutation.mutate(wallet)}
              loading={addWalletMutation.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AddWalletForm({ onAdd, loading }: { onAdd: (wallet: { chainId: number; address: string; label?: string }) => void; loading: boolean }) {
  const [address, setAddress] = useState("");
  const [chainId, setChainId] = useState(8453);
  const [label, setLabel] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    onAdd({ chainId, address, label: label || undefined });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Address</label>
        <input
          type="text"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 font-mono text-zinc-100 placeholder-zinc-600"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Chain</label>
        <select
          value={chainId}
          onChange={(e) => setChainId(parseInt(e.target.value))}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100"
        >
          <option value={8453}>Base</option>
          <option value={42161}>Arbitrum One</option>
          <option value={10}>Optimism</option>
          <option value={1}>Ethereum Mainnet</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Label (optional)</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Payment Wallet"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-600"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add Wallet"}
      </button>
    </form>
  );
}

function formatTokenAmount(amountRaw: string, decimals: number): string {
  const amount = BigInt(amountRaw);
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  const fractionStr = fraction.toString().padStart(decimals, "0").slice(0, 4);
  return `${whole.toString()}.${fractionStr}`;
}