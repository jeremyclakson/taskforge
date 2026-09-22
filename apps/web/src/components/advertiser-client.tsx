"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatUsd, cn } from "@/lib/utils";
import { Megaphone, BarChart3, TrendingUp, DollarSign } from "lucide-react";

export function AdvertiserClient() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"campaigns" | "slots" | "stats">("campaigns");

  const { data: campaignsData } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/ads/slots");
      if (!res.ok) return { slots: [], campaigns: [] };
      return res.json();
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await fetch("/api/ads/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create campaign");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign created!");
    },
  });

  const stats = {
    totalSpend: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Megaphone className="h-8 w-8 text-indigo-400" />
          Advertiser Dashboard
        </h1>
        <p className="mt-1 text-zinc-400">
          Manage your advertising campaigns and get your tasks in front of the right audience.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500">Total Spend</span>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-400">{formatUsd(stats.totalSpend)}</div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500">Impressions</span>
            <BarChart3 className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold">{stats.impressions.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500">Clicks</span>
            <TrendingUp className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold">{stats.clicks.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500">CTR</span>
            <TrendingUp className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold">{stats.ctr}%</div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-zinc-800">
        {[
          { id: "campaigns", label: "Campaigns" },
          { id: "slots", label: "Ad Slots" },
          { id: "stats", label: "Analytics" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
              tab === t.id
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
        <p className="text-zinc-500">
          {tab === "campaigns" && "Create your first advertising campaign to boost task visibility."}
          {tab === "slots" && "Browse available ad slots across the platform."}
          {tab === "stats" && "View your campaign performance metrics and analytics."}
        </p>
      </div>
    </div>
  );
}