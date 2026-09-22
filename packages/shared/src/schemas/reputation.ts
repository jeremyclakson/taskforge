import { z } from 'zod';
import { WorkerType } from '../constants/enums';

export const HumanReputationSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  completedTasks: z.number().int().default(0),
  cancelledTasks: z.number().int().default(0),
  disputedTasks: z.number().int().default(0),
  totalEarnedUsd: z.string().default('0'),
  avgRating: z.number().min(0).max(5).default(0),
  ratingCount: z.number().int().default(0),
  onTimeDeliveryRate: z.number().min(0).max(1).default(1),
  responseTimeHours: z.number().min(0).default(0),
  portfolioScore: z.number().min(0).default(0),
  githubStars: z.number().int().default(0),
  githubContributions: z.number().int().default(0),
  skillCertifications: z.number().int().default(0),
  creditScore: z.number().int().min(0).max(1000).default(100),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']).default('bronze'),
  lastCalculatedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type HumanReputation = z.infer<typeof HumanReputationSchema>;

export const AgentReputationSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  successfulExecutions: z.number().int().default(0),
  failedExecutions: z.number().int().default(0),
  totalEarnedUsd: z.string().default('0'),
  avgExecutionTimeMs: z.number().int().default(0),
  sandboxPassRate: z.number().min(0).max(1).default(1),
  validationPassRate: z.number().min(0).max(1).default(1),
  skillCertifications: z.number().int().default(0),
  uniqueSkills: z.number().int().default(0),
  uptimePercentage: z.number().min(0).max(100).default(100),
  creditScore: z.number().int().min(0).max(1000).default(100),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']).default('bronze'),
  lastCalculatedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AgentReputation = z.infer<typeof AgentReputationSchema>;

export const ReputationEventSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  workerType: z.nativeEnum(WorkerType),
  eventType: z.enum([
    'task_completed',
    'task_cancelled',
    'task_disputed',
    'positive_review',
    'negative_review',
    'skill_certified',
    'skill_revoked',
    'portfolio_updated',
    'github_sync',
    'uptime_check',
    'execution_success',
    'execution_failed',
    'validation_passed',
    'validation_failed',
    'penalty_applied',
    'bonus_awarded',
  ]),
  scoreDelta: z.number().int(),
  reason: z.string().max(500),
  relatedTaskId: z.string().cuid().nullable(),
  relatedSkillId: z.string().cuid().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.date(),
});

export type ReputationEvent = z.infer<typeof ReputationEventSchema>;

export const SkillCertificationSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  skillId: z.string().cuid(),
  skillName: z.string().max(100),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  score: z.number().min(0).max(100),
  certifiedBy: z.enum(['platform', 'third_party', 'community']),
  certificateUrl: z.string().url().nullable(),
  expiresAt: z.date().nullable(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SkillCertification = z.infer<typeof SkillCertificationSchema>;

export const CreditTierConfig = {
  bronze: { min: 0, max: 299, feeDiscount: 0, priorityBoost: 0 },
  silver: { min: 300, max: 499, feeDiscount: 0.05, priorityBoost: 10 },
  gold: { min: 500, max: 699, feeDiscount: 0.1, priorityBoost: 25 },
  platinum: { min: 700, max: 899, feeDiscount: 0.2, priorityBoost: 50 },
  diamond: { min: 900, max: 1000, feeDiscount: 0.3, priorityBoost: 100 },
} as const;

export function getTierFromScore(score: number): keyof typeof CreditTierConfig {
  if (score >= 900) return 'diamond';
  if (score >= 700) return 'platinum';
  if (score >= 500) return 'gold';
  if (score >= 300) return 'silver';
  return 'bronze';
}

export function calculateHumanCreditScore(data: {
  completedTasks: number;
  cancelledTasks: number;
  disputedTasks: number;
  avgRating: number;
  onTimeDeliveryRate: number;
  portfolioScore: number;
  skillCertifications: number;
}): number {
  const weights = {
    completionRate: 0.3,
    rating: 0.25,
    onTimeDelivery: 0.2,
    portfolio: 0.15,
    certifications: 0.1,
  };

  const totalTasks = data.completedTasks + data.cancelledTasks + data.disputedTasks;
  const completionRate = totalTasks > 0 ? data.completedTasks / totalTasks : 1;
  const disputeRate = totalTasks > 0 ? data.disputedTasks / totalTasks : 0;

  let score = 100;

  score += completionRate * 300 * weights.completionRate;
  score += (data.avgRating / 5) * 300 * weights.rating;
  score += data.onTimeDeliveryRate * 200 * weights.onTimeDelivery;
  score += Math.min(data.portfolioScore / 100, 1) * 150 * weights.portfolio;
  score += Math.min(data.skillCertifications * 10, 100) * weights.certifications;

  score -= disputeRate * 200;
  score -= data.cancelledTasks * 5;

  return Math.max(0, Math.min(1000, Math.round(score)));
}

export function calculateAgentCreditScore(data: {
  successfulExecutions: number;
  failedExecutions: number;
  sandboxPassRate: number;
  validationPassRate: number;
  skillCertifications: number;
  uptimePercentage: number;
}): number {
  const totalExecutions = data.successfulExecutions + data.failedExecutions;
  const successRate = totalExecutions > 0 ? data.successfulExecutions / totalExecutions : 1;

  let score = 100;

  score += successRate * 400 * 0.4;
  score += data.sandboxPassRate * 200 * 0.2;
  score += data.validationPassRate * 200 * 0.2;
  score += Math.min(data.skillCertifications * 15, 150) * 0.1;
  score += (data.uptimePercentage / 100) * 100 * 0.1;

  score -= data.failedExecutions * 10;

  return Math.max(0, Math.min(1000, Math.round(score)));
}