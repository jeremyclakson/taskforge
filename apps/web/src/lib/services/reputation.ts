import { prisma } from "@/lib/prisma";
import {
  calculateHumanCreditScore,
  calculateAgentCreditScore,
  getTierFromScore,
} from "@agent-platform/shared";

export async function recalculateHumanReputations() {
  const users = await prisma.user.findMany({
    where: { workerType: { in: ["HUMAN", "BOTH"] } },
    include: {
      humanReputation: true,
      tasksPublished: { select: { status: true } },
      tasksAssigned: { select: { status: true } },
    },
  });

  const updates: { id: string; data: Record<string, unknown> }[] = [];

  for (const user of users) {
    const published = user.tasksPublished.length;
    const assigned = user.tasksAssigned.length;

    let completedTasks = 0;
    let cancelledTasks = 0;
    let disputedTasks = 0;

    for (const task of user.tasksAssigned) {
      if (task.status === "COMPLETED") completedTasks++;
      else if (task.status === "CANCELLED") cancelledTasks++;
      else if (task.status === "DISPUTED") disputedTasks++;
    }

    const humanRep = user.humanReputation;
    if (!humanRep) continue;

    const newScore = calculateHumanCreditScore({
      completedTasks: completedTasks + humanRep.completedTasks,
      cancelledTasks: cancelledTasks + humanRep.cancelledTasks,
      disputedTasks: disputedTasks + humanRep.disputedTasks,
      avgRating: humanRep.avgRating,
      onTimeDeliveryRate: humanRep.onTimeDeliveryRate,
      portfolioScore: humanRep.portfolioScore,
      skillCertifications: humanRep.skillCertifications,
    });

    updates.push({
      id: user.id,
      data: {
        creditScore: newScore,
        tier: getTierFromScore(newScore),
        completedTasks: completedTasks + humanRep.completedTasks,
        cancelledTasks: cancelledTasks + humanRep.cancelledTasks,
        disputedTasks: disputedTasks + humanRep.disputedTasks,
        lastCalculatedAt: new Date(),
      },
    });
  }

  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map((u) => prisma.humanReputation.update({ where: { userId: u.id }, data: u.data }))
    );
  }

  return { updated: updates.length };
}

export async function recalculateAgentReputations() {
  const users = await prisma.user.findMany({
    where: { workerType: { in: ["AGENT", "BOTH"] } },
    include: {
      agentReputation: true,
      tasksAssigned: { select: { status: true } },
    },
  });

  const updates: { id: string; data: Record<string, unknown> }[] = [];

  for (const user of users) {
    let successfulExecutions = 0;
    let failedExecutions = 0;

    for (const task of user.tasksAssigned) {
      if (task.status === "COMPLETED") successfulExecutions++;
      else if (task.status === "CANCELLED" || task.status === "DISPUTED") failedExecutions++;
    }

    const agentRep = user.agentReputation;
    if (!agentRep) continue;

    const newScore = calculateAgentCreditScore({
      successfulExecutions: successfulExecutions + agentRep.successfulExecutions,
      failedExecutions: failedExecutions + agentRep.failedExecutions,
      sandboxPassRate: agentRep.sandboxPassRate,
      validationPassRate: agentRep.validationPassRate,
      skillCertifications: agentRep.skillCertifications,
      uptimePercentage: agentRep.uptimePercentage,
    });

    updates.push({
      id: user.id,
      data: {
        creditScore: newScore,
        tier: getTierFromScore(newScore),
        successfulExecutions: successfulExecutions + agentRep.successfulExecutions,
        failedExecutions: failedExecutions + agentRep.failedExecutions,
        lastCalculatedAt: new Date(),
      },
    });
  }

  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map((u) => prisma.agentReputation.update({ where: { userId: u.id }, data: u.data }))
    );
  }

  return { updated: updates.length };
}

export async function recalculateAllReputations() {
  const [human, agent] = await Promise.all([
    recalculateHumanReputations(),
    recalculateAgentReputations(),
  ]);
  return { human, agent };
}