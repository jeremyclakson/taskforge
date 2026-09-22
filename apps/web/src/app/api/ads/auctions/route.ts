import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AdSlotType } from "@agent-platform/shared";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slotType = searchParams.get("slotType") as AdSlotType | null;
    const categoryId = searchParams.get("categoryId");

    const where: Record<string, unknown> = { isActive: true, status: { in: ["active", "pending"] } };
    if (slotType) where.slotId = slotType;

    const campaigns = await prisma.adCampaign.findMany({
      where: where as any,
      include: {
        slot: true,
        creative: true,
        advertiser: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, identityType: true },
        },
      },
      orderBy: { bidAmount: "desc" },
      take: 10,
    });

    const auctionResult = {
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        bidAmount: parseFloat(c.bidAmount.toString()),
        bidModel: c.bidModel,
        creative: c.creative
          ? { id: c.creative.id, fileUrl: c.creative.fileUrl, clickUrl: c.creative.clickUrl, width: c.creative.width, height: c.creative.height }
          : null,
        advertiser: c.advertiser,
        slot: c.slot ? { id: c.slot.id, type: c.slot.type, placement: c.slot.placement } : null,
        targeting: c.targeting,
      })),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(auctionResult);
  } catch (error) {
    console.error("[ADS_AUCTION_GET]", error);
    return NextResponse.json({ error: "Failed to run auction" }, { status: 500 });
  }
}