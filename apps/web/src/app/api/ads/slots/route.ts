import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { AdSlotType, AdBidModel, ChainId, TokenSymbol } from "@agent-platform/shared";

const createSlotSchema = z.object({
  type: z.nativeEnum(AdSlotType),
  placement: z.string().max(100),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  targeting: z
    .object({
      chains: z.array(z.nativeEnum(ChainId)).optional(),
      categories: z.array(z.string()).optional(),
      skills: z.array(z.string()).optional(),
      workerTypes: z.array(z.string()).optional(),
    })
    .optional(),
  pricing: z.object({
    model: z.nativeEnum(AdBidModel),
    floorPrice: z.string(),
    currency: z.nativeEnum(TokenSymbol),
    chainId: z.nativeEnum(ChainId),
  }),
});

export async function GET() {
  try {
    const slots = await prisma.adSlot.findMany({
      orderBy: { createdAt: "desc" },
      include: { campaigns: { select: { id: true, name: true, advertiserId: true, status: true, bidAmount: true } } },
    });
    return NextResponse.json(slots);
  } catch (error) {
    console.error("[ADS_SLOTS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSlotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const slot = await prisma.adSlot.create({
      data: parsed.data as any,
    });

    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    console.error("[ADS_SLOTS_POST]", error);
    return NextResponse.json({ error: "Failed to create slot" }, { status: 500 });
  }
}