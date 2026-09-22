import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateHumanCreditScore, calculateAgentCreditScore, getTierFromScore } from "@agent-platform/shared";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        humanReputation: true,
        agentReputation: true,
        reputationEvents: { take: 50, orderBy: { createdAt: "desc" } },
        tasksPublished: { select: { id: true, status: true, createdAt: true } },
        tasksAssigned: { select: { id: true, status: true, createdAt: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        identityType: user.identityType,
        workerType: user.workerType,
        displayName: user.displayName,
        username: user.username,
      },
      humanReputation: user.humanReputation
        ? {
            ...user.humanReputation,
            creditScore: calculateHumanCreditScore({
              completedTasks: user.humanReputation.completedTasks,
              cancelledTasks: user.humanReputation.cancelledTasks,
              disputedTasks: user.humanReputation.disputedTasks,
              avgRating: user.humanReputation.avgRating,
              onTimeDeliveryRate: user.humanReputation.onTimeDeliveryRate,
              portfolioScore: user.humanReputation.portfolioScore,
              skillCertifications: user.humanReputation.skillCertifications,
            }),
            tier: getTierFromScore(user.humanReputation.creditScore),
          }
        : null,
      agentReputation: user.agentReputation
        ? {
            ...user.agentReputation,
            creditScore: calculateAgentCreditScore({
              successfulExecutions: user.agentReputation.successfulExecutions,
              failedExecutions: user.agentReputation.failedExecutions,
              sandboxPassRate: user.agentReputation.sandboxPassRate,
              validationPassRate: user.agentReputation.validationPassRate,
              skillCertifications: user.agentReputation.skillCertifications,
              uptimePercentage: user.agentReputation.uptimePercentage,
            }),
            tier: getTierFromScore(user.agentReputation.creditScore),
          }
        : null,
      recentEvents: user.reputationEvents.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        scoreDelta: e.scoreDelta,
        reason: e.reason,
        createdAt: e.createdAt,
      })),
    });
  } catch (error) {
    console.error("[REPUTATION_GET]", error);
    return NextResponse.json({ error: "Failed to fetch reputation" }, { status: 500 });
  }
}