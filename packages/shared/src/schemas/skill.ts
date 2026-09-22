import { z } from 'zod';
import { ChainId, TokenSymbol } from '../constants/enums';

export const SkillManifestSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-z][a-z0-9-]*$/),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[a-z0-9.-]+)?$/),
  description: z.string().min(10).max(2000),
  author: z.string().max(100),
  license: z.enum(['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Proprietary']),
  repository: z.string().url().optional(),
  homepage: z.string().url().optional(),
  keywords: z.array(z.string()).max(10).default([]),
  category: z.string().max(50),
  entrypoint: z.string().max(200),
  runtime: z.enum(['nodejs:20', 'python:3.11', 'wasm', 'docker']),
  sandbox: z.enum(['e2b', 'modal', 'firecracker', 'isolated-vm']).optional(),
  inputSchema: z.record(z.unknown()),
  outputSchema: z.record(z.unknown()),
  dependencies: z.record(z.string()).default({}),
  devDependencies: z.record(z.string()).default({}),
  pricing: z
    .object({
      model: z.enum(['free', 'per_call', 'per_token', 'subscription']),
      amount: z.string().optional(),
      token: z.nativeEnum(TokenSymbol).optional(),
      chainId: z.nativeEnum(ChainId).optional(),
    })
    .optional(),
  royalties: z
    .object({
      authorBps: z.number().int().min(0).max(10000).default(1000),
      platformBps: z.number().int().min(0).max(10000).default(500),
    })
    .optional(),
  requirements: z
    .object({
      minMemoryMb: z.number().int().positive().optional(),
      minCpu: z.string().optional(),
      gpuRequired: z.boolean().default(false),
      networkAccess: z.boolean().default(false),
      maxExecutionTimeSec: z.number().int().positive().max(86400).default(300),
    })
    .optional(),
  testCases: z
    .array(
      z.object({
        name: z.string(),
        input: z.unknown(),
        expectedOutput: z.unknown(),
        description: z.string().optional(),
      })
    )
    .default([]),
  readme: z.string().optional(),
  changelog: z.string().optional(),
});

export type SkillManifest = z.infer<typeof SkillManifestSchema>;

export const SkillPackageSchema = z.object({
  id: z.string().cuid(),
  manifest: SkillManifestSchema,
  authorId: z.string().cuid(),
  packageUrl: z.string().url(),
  packageHash: z.string().max(128),
  packageSize: z.number().int().positive(),
  status: z.enum(['pending', 'approved', 'rejected', 'deprecated', 'removed']).default('pending'),
  downloadCount: z.number().int().default(0),
  rating: z.number().min(0).max(5).default(0),
  ratingCount: z.number().int().default(0),
  totalRevenueUsd: z.string().default('0'),
  approvedAt: z.date().nullable(),
  rejectedAt: z.date().nullable(),
  rejectionReason: z.string().nullable(),
  deprecatedAt: z.date().nullable(),
  deprecationReason: z.string().nullable(),
  securityScanStatus: z.enum(['pending', 'passed', 'failed', 'warning']).default('pending'),
  securityScanResult: z.record(z.unknown()).nullable(),
  scannedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SkillPackage = z.infer<typeof SkillPackageSchema>;

export const SkillVersionSchema = z.object({
  id: z.string().cuid(),
  skillId: z.string().cuid(),
  version: z.string(),
  manifest: SkillManifestSchema,
  packageUrl: z.string().url(),
  packageHash: z.string().max(128),
  packageSize: z.number().int().positive(),
  changelog: z.string().optional(),
  isLatest: z.boolean().default(false),
  createdAt: z.date(),
});

export type SkillVersion = z.infer<typeof SkillVersionSchema>;

export const SkillInvocationSchema = z.object({
  id: z.string().cuid(),
  skillId: z.string().cuid(),
  skillVersionId: z.string().cuid(),
  callerId: z.string().cuid(),
  taskId: z.string().cuid().nullable(),
  input: z.unknown(),
  output: z.unknown().nullable(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'timeout']).default('pending'),
  executionTimeMs: z.number().int().nullable(),
  memoryUsedMb: z.number().int().nullable(),
  costUsd: z.string().nullable(),
  error: z.string().nullable(),
  logs: z.array(z.string()).default([]),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
});

export type SkillInvocation = z.infer<typeof SkillInvocationSchema>;

export const SkillReviewSchema = z.object({
  id: z.string().cuid(),
  skillId: z.string().cuid(),
  userId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  isVerifiedPurchase: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SkillReview = z.infer<typeof SkillReviewSchema>;

export const SkillCreateSchema = SkillManifestSchema.extend({
  packageUrl: z.string().url(),
  packageHash: z.string().max(128),
  packageSize: z.number().int().positive(),
});

export type SkillCreate = z.infer<typeof SkillCreateSchema>;