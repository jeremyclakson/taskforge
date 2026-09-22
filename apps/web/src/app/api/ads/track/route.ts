import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const impressionSchema = z.object({
  campaignId: z.string().cuid(),
  slotId: z.string().cuid(),
  creativeId: z.string().cuid(),
  userId: z.string().cuid().optional(),
  sessionId: z.string().optional(),
  ipHash: z.string().max(64),
  userAgent: z.string().max(500).optional(),
  referrer: z.string().url().optional(),
  price: z.string(),
  currency: z.string(),
  chainId: z.number().int().positive(),
});

const clickSchema = impressionSchema.extend({
  impressionId: z.string().cuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type === "impression") {
      return handleImpression(req, session?.user?.id);
    } else if (type === "click") {
      return handleClick(req, session?.user?.id);
    }

    return NextResponse.json({ error: "Missing type parameter" }, { status: 400 });
  } catch (error) {
    console.error("[ADS_TRACK_POST]", error);
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}

async function handleImpression(req: NextRequest, userId?: string) {
  const body = await req.json();
  const parsed = impressionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { campaignId, slotId, creativeId, ipHash, userAgent, referrer, price, currency, chainId, sessionId } = parsed.data;

  const impression = await prisma.adImpression.create({
    data: {
      campaignId,
      slotId,
      creativeId,
      userId: userId || null,
      sessionId: sessionId || null,
      ipHash,
      userAgent,
      referrer,
      price: parseFloat(price),
      currency,
      chainId,
    },
  });

  return NextResponse.json({ impressionId: impression.id });
}

async function handleClick(req: NextRequest, userId?: string) {
  const body = await req.json();
  const parsed = clickSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { impressionId, campaignId, slotId, creativeId, ipHash, userAgent, referrer, sessionId } = parsed.data;

  const impression = await prisma.adImpression.findUnique({ where: { id: impressionId } });
  if (!impression) {
    return NextResponse.json({ error: "Impression not found" }, { status: 404 });
  }

  const click = await prisma.adClick.create({
    data: {
      impressionId,
      campaignId,
      slotId,
      creativeId,
      userId: userId || null,
      sessionId: sessionId || null,
      ipHash,
      userAgent,
      referrer,
    },
  });

  return NextResponse.json({ clickId: click.id });
}