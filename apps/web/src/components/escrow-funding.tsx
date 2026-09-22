"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatTokenAmount, cn } from "@/lib/utils";
import { Coins, Shield, CheckCircle2, Loader2 } from "lucide-react";

interface EscrowFundProps {
  taskId: string;
  budget: string;
  currency: string;
  chainId: number;
  tokenAddress: string;
  onFunded: () => void;
}

const USDC_ADDRESS_MAP: Record<number, string> = {
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71F32E8fB5B67",
  42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  10: "0x0b2C639c533813f4Aa9D7837caF62653d097Ff85",
  137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
};

export function EscrowFunding({ taskId, budget, currency, chainId, tokenAddress, onFunded }: EscrowFundProps) {
  const { address, isConnected } = useAccount();
  const [funding, setFunding] = useState(false);
  const [fundTxHash, setFundTxHash] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const tokenAddressResolved = tokenAddress || USDC_ADDRESS_MAP[chainId] || "";

  const { writeContractAsync } = useWriteContract();
  const { data: receipt, isLoading: waitingForReceipt } = useWaitForTransactionReceipt({
    hash: fundTxHash as `0x${string}` | undefined,
  });

  async function handleFund() {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setFunding(true);
    try {
      const amountRaw = BigInt(Math.floor(parseFloat(budget) * 1e6));

      const tokenAddr = tokenAddressResolved as `0x${string}`;

      const result = await writeContractAsync({
        address: tokenAddr,
        abi: [
          {
            type: "function",
            name: "approve",
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ type: "bool" }],
            stateMutability: "nonpayable",
          },
        ],
        functionName: "approve",
        args: [
          "0x0000000000000000000000000000000000000000",
          amountRaw,
        ],
        chainId: chainId as 8453,
      });

      if (result) {
        setFundTxHash(result);
        setConfirming(true);
        toast.info("Transaction sent! Waiting for confirmation...");
      }
    } catch (err) {
      toast.error("Failed to create funding transaction");
    } finally {
      setFunding(false);
    }
  }

  async function confirmFunded() {
    if (!receipt || !receipt.blockNumber) return;

    setConfirming(false);
    try {
      const session = await auth();
      if (!session?.user?.id) {
        toast.error("Please sign in");
        return;
      }

      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await fetch("/api/escrow/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          workerAddress: address || "",
          tokenAddress: tokenAddressResolved,
          amountRaw: BigInt(Math.floor(parseFloat(budget) * 1e6)).toString(),
          decimals: 6,
          txHash: fundTxHash || "",
          blockNumber: Number(receipt.blockNumber),
          deadline,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to confirm funding");
      }

      toast.success("Escrow funded! Task is now live.");
      onFunded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm funding");
    }
  }

  if (funding) {
    return (
      <div className="flex items-center gap-2 text-sm text-yellow-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Waiting for signature...</span>
      </div>
    );
  }

  if (confirming || waitingForReceipt) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-yellow-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Waiting for transaction confirmation...</span>
        </div>
        {receipt && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Confirmed in block {receipt.blockNumber}</span>
          </div>
        )}
        <button
          onClick={confirmFunded}
          disabled={!receipt}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Confirm Funding
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-5 w-5 text-yellow-400" />
        <h3 className="font-semibold text-yellow-300">Fund Escrow</h3>
      </div>
      <p className="text-sm text-zinc-400 mb-4">
        Lock {budget} {currency} in a smart contract. Funds are only released when you approve the work.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <div className="text-zinc-500">Amount</div>
          <div className="font-medium">{budget} {currency}</div>
        </div>
        <div>
          <div className="text-zinc-500">Chain</div>
          <div className="font-medium">
            {chainId === 8453 ? "Base" : chainId === 42161 ? "Arbitrum" : chainId === 10 ? "Optimism" : `Chain ${chainId}`}
          </div>
        </div>
      </div>

      {!isConnected && (
        <p className="text-xs text-zinc-500 mb-3">Connect your wallet to fund the escrow.</p>
      )}

      <button
        onClick={handleFund}
        disabled={!isConnected || !address}
        className="w-full rounded-xl bg-yellow-500 px-4 py-2.5 font-medium text-zinc-900 hover:bg-yellow-400 disabled:opacity-50"
      >
        {isConnected ? "Approve & Fund Escrow" : "Connect Wallet to Fund"}
      </button>
    </div>
  );
}