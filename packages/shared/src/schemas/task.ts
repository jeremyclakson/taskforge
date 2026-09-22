import { z } from 'zod';
import { TaskStatus, BidStatus } from '../constants/enums';
import { TaskSpecSchema, TaskSpec } from './task-spec';

export const TaskSchema = z.object({
  id: z.string().cuid(),
  publisherId: z.string().cuid(),
  spec: TaskSpecSchema,
  status: z.nativeEnum(TaskStatus).default(TaskStatus.DRAFT),
  budget: z.string(),
  currency: z.string().default('USDC'),
  chainId: z.number().int().positive(),
  tokenAddress: z.string().nullable(),
  escrowAddress: z.string().nullable(),
  escrowTxHash: z.string().nullable(),
  escrowBlockNumber: z.number().int().positive().nullable(),
  acceptedBidId: z.string().cuid().nullable(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  cancelledAt: z.date().nullable(),
  cancelReason: z.string().nullable(),
  disputeId: z.string().cuid().nullable(),
  viewCount: z.number().int().default(0),
  applicationCount: z.number().int().default(0),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Task = z.infer<typeof TaskSchema>;

export const TaskWithRelationsSchema = TaskSchema.extend({
  publisher: z.object({
    id: z.string().cuid(),
    username: z.string().nullable(),
    displayName: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    identityType: z.string(),
    reputationScore: z.number().int().default(0),
  }).optional(),
  acceptedBid: z.object({
    id: z.string().cuid(),
    agentId: z.string().cuid(),
    price: z.string(),
    agent: z.object({
      id: z.string().cuid(),
      username: z.string().nullable(),
      displayName: z.string().nullable(),
      avatarUrl: z.string().nullable(),
      reputationScore: z.number().int().default(0),
    }).optional(),
  }).nullable(),
  bids: z.array(z.object({
    id: z.string().cuid(),
    agentId: z.string().cuid(),
    price: z.string(),
    status: z.nativeEnum(BidStatus),
    agent: z.object({
      id: z.string().cuid(),
      username: z.string().nullable(),
      displayName: z.string().nullable(),
      avatarUrl: z.string().nullable(),
      reputationScore: z.number().int().default(0),
    }).optional(),
  })).default([]),
  reviews: z.array(z.object({
    id: z.string().cuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().nullable(),
    createdAt: z.date(),
  })).default([]),
});

export type TaskWithRelations = z.infer<typeof TaskWithRelationsSchema>;

export const TaskCreateSchema = z.object({
  spec: TaskSpecSchema.omit({ protocolVersion: true }),
  budget: z.string(),
  currency: z.string().default('USDC'),
  chainId: z.number().int().positive(),
  tokenAddress: z.string().nullable(),
});

export type TaskCreate = z.infer<typeof TaskCreateSchema>;

export const TaskUpdateSchema = TaskCreateSchema.partial().extend({
  status: z.nativeEnum(TaskStatus).optional(),
  acceptedBidId: z.string().cuid().nullable().optional(),
  escrowAddress: z.string().nullable().optional(),
  escrowTxHash: z.string().nullable().optional(),
  escrowBlockNumber: z.number().int().positive().nullable().optional(),
  startedAt: z.date().nullable().optional(),
  completedAt: z.date().nullable().optional(),
  cancelledAt: z.date().nullable().optional(),
  cancelReason: z.string().nullable().optional(),
  disputeId: z.string().cuid().nullable().optional(),
});

export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;

export const BidSchema = z.object({
  id: z.string().cuid(),
  taskId: z.string().cuid(),
  agentId: z.string().cuid(),
  price: z.string(),
  currency: z.string().default('USDC'),
  proposal: z.string().max(10000).optional(),
  estimatedDays: z.number().int().positive().optional(),
  status: z.nativeEnum(BidStatus).default(BidStatus.PENDING),
  rejectionReason: z.string().nullable(),
  withdrawnAt: z.date().nullable(),
  acceptedAt: z.date().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Bid = z.infer<typeof BidSchema>;

export const BidCreateSchema = z.object({
  taskId: z.string().cuid(),
  price: z.string(),
  currency: z.string().default('USDC'),
  proposal: z.string().max(10000).optional(),
  estimatedDays: z.number().int().positive().optional(),
});

export type BidCreate = z.infer<typeof BidCreateSchema>;

export const BidUpdateSchema = BidCreateSchema.partial().extend({
  status: z.nativeEnum(BidStatus).optional(),
  rejectionReason: z.string().nullable().optional(),
  withdrawnAt: z.date().nullable().optional(),
  acceptedAt: z.date().nullable().optional(),
});

export type BidUpdate = z.infer<typeof BidUpdateSchema>;

export const TaskMilestoneSchema = z.object({
  id: z.string().cuid(),
  taskId: z.string().cuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  amount: z.string(),
  currency: z.string().default('USDC'),
  criteria: z.string(),
  status: z.enum(['pending', 'in_progress', 'submitted', 'approved', 'rejected', 'paid']).default('pending'),
  submissionUrl: z.string().url().nullable(),
  submissionNotes: z.string().nullable(),
  approvedAt: z.date().nullable(),
  paidAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TaskMilestone = z.infer<typeof TaskMilestoneSchema>;