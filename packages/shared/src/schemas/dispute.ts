import { z } from 'zod';
import { DisputeStatus } from '../constants/enums';

export const DisputeSchema = z.object({
  id: z.string().cuid(),
  taskId: z.string().cuid(),
  initiatorId: z.string().cuid(),
  respondentId: z.string().cuid(),
  reason: z.string().min(10).max(5000),
  evidence: z
    .array(
      z.object({
        type: z.enum(['text', 'image', 'file', 'link', 'chat_log', 'code_diff']),
        url: z.string().url().optional(),
        content: z.string().optional(),
        description: z.string().max(500).optional(),
      })
    )
    .default([]),
  status: z.nativeEnum(DisputeStatus).default(DisputeStatus.OPEN),
  resolution: z.string().nullable(),
  resolvedBy: z.string().cuid().nullable(),
  resolvedAt: z.date().nullable(),
  arbitratorIds: z.array(z.string().cuid()).default([]),
  arbitratorVotes: z
    .array(
      z.object({
        arbitratorId: z.string().cuid(),
        vote: z.enum(['initiator', 'respondent', 'split']),
        reasoning: z.string().max(2000).optional(),
        votedAt: z.date(),
      })
    )
    .default([]),
  escrowId: z.string().cuid().nullable(),
  arbitrationFee: z.string().default('0'),
  feePaidBy: z.string().cuid().nullable(),
  appealable: z.boolean().default(true),
  appealedAt: z.date().nullable(),
  appealReason: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Dispute = z.infer<typeof DisputeSchema>;

export const ArbitratorSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  specialties: z.array(z.string()).default([]),
  languages: z.array(z.string()).default(['en']),
  stakeAmount: z.string().default('0'),
  totalCases: z.number().int().default(0),
  correctVotes: z.number().int().default(0),
  accuracyRate: z.number().min(0).max(1).default(0),
  avgResolutionTimeHours: z.number().default(0),
  isActive: z.boolean().default(true),
  isVerified: z.boolean().default(false),
  verifiedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Arbitrator = z.infer<typeof ArbitratorSchema>;

export const DisputeCreateSchema = z.object({
  taskId: z.string().cuid(),
  reason: z.string().min(10).max(5000),
  evidence: z
    .array(
      z.object({
        type: z.enum(['text', 'image', 'file', 'link', 'chat_log', 'code_diff']),
        url: z.string().url().optional(),
        content: z.string().optional(),
        description: z.string().max(500).optional(),
      })
    )
    .default([]),
});

export type DisputeCreate = z.infer<typeof DisputeCreateSchema>;

export const ArbitratorVoteSchema = z.object({
  disputeId: z.string().cuid(),
  vote: z.enum(['initiator', 'respondent', 'split']),
  reasoning: z.string().max(2000).optional(),
});

export type ArbitratorVote = z.infer<typeof ArbitratorVoteSchema>;