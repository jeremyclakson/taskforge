import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addWalletSchema = z.object({
  chainId: z.number().int().positive(),
  address: z.string().min(1).max(100),
  isPrimary: z.boolean().default(false),
  label: z.string().max(50).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wallets = await prisma.wallet.findMany({
      where: { userId: session.user.id },
      orderBy: { isPrimary: "desc" },
    });

    const balances = await prisma.walletBalance.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ wallets, balances });
  } catch (error) {
    console.error("[WALLET_GET]", error);
    return NextResponse.json({ error: "Failed to fetch wallets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = addWalletSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { chainId, address, isPrimary, label } = parsed.data;

    const existing = await prisma.wallet.findFirst({
      where: {
        userId: session.user.id,
        chainId,
        address: { equals: address, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const wallet = await prisma.wallet.create({
      data: {
        userId: session.user.id,
        chainId,
        address,
        isPrimary,
        label,
      },
    });

    return NextResponse.json(wallet, { status: 201 });
  } catch (error) {
    console.error("[WALLET_POST]", error);
    return NextResponse.json({ error: "Failed to add wallet" }, { status: 500 });
  }
}