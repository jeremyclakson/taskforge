import { NextRequest, NextResponse } from "next/server";
import { recalculateAllReputations } from "@/lib/services/reputation";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "change-me-in-production";

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await recalculateAllReputations();
    return NextResponse.json({
      success: true,
      message: "Reputation recalculation complete",
      result,
    });
  } catch (error) {
    console.error("[CRON_REPUTATION]", error);
    return NextResponse.json({ error: "Failed to recalculate reputations" }, { status: 500 });
  }
}