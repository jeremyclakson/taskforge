import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balances = await prisma.walletBalance.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json(balances);
  } catch (error) {
    console.error("[WALLET_BALANCES_GET]", error);
    return NextResponse.json({ error: "Failed to fetch balances" }, { status: 500 });
  }
}