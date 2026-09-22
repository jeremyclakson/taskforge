import { z } from 'zod';
import { WorkerType, ChainId, TokenSymbol } from '../constants/enums';

export const TokenSpecSchema = z.object({
  chainId: z.nativeEnum(ChainId),
  symbol: z.nativeEnum(TokenSymbol),
  address: z.string().optional(),
  decimals: z.number().int().positive(),
});

export type TokenSpec = z.infer<typeof TokenSpecSchema>;

export const ValidationCriterionSchema = z.object({
  type: z.enum(['schema', 'test', 'human_review', 'agent_verify']),
  description: z.string(),
  weight: z.number().min(0).max(1).default(1),
  params: z.record(z.unknown()).optional(),
});

export type ValidationCriterion = z.infer<typeof ValidationCriterionSchema>;

export const ExecutionConfigSchema = z.object({
  runtime: z.enum(['nodejs:20', 'python:3.11', 'docker', 'wasm']).optional(),
  sandbox: z.enum(['e2b', 'modal', 'firecracker', 'gvisor', 'isolated-vm']).optional(),
  timeoutSec: z.number().int().positive().max(86400).default(300),
  resources: z
    .object({
      cpu: z.string().optional(),
      memory: z.string().optional(),
      storage: z.string().optional(),
    })
    .optional(),
  envVars: z.record(z.string()).optional(),
  entrypoint: z.string().optional(),
  deliverableFormat: z.enum(['github_pr', 'zip', 'figma', 'notion', 'custom', 'api_response']).optional(),
  reviewChecklist: z.array(z.string()).optional(),
});

export type ExecutionConfig = z.infer<typeof ExecutionConfigSchema>;

export const PricingModelSchema = z.object({
  model: z.enum(['fixed', 'per_token', 'per_step', 'per_hour', 'milestone']),
  amount: z.string(),
  token: TokenSpecSchema,
  milestones: z
    .array(
      z.object({
        name: z.string(),
        amount: z.string(),
        criteria: z.string(),
      })
    )
    .optional(),
});

export type PricingModel = z.infer<typeof PricingModelSchema>;

export const InputOutputSchemaSchema = z.object({
  type: z.enum(['json', 'file', 'url', 'text', 'binary']),
  schema: z.record(z.unknown()).optional(),
  example: z.unknown().optional(),
  maxSizeBytes: z.number().int().positive().optional(),
  mimeTypes: z.array(z.string()).optional(),
});

export type InputOutputSchema = z.infer<typeof InputOutputSchemaSchema>;

export const TaskSpecSchema = z.object({
  protocolVersion: z.literal('1.0'),
  taskType: z.string().min(1).max(100),
  category: z.string().optional(),
  tags: z.array(z.string()).max(20).default([]),
  workerType: z.nativeEnum(WorkerType).default(WorkerType.BOTH),
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(50000),
  inputSchema: InputOutputSchemaSchema,
  outputSchema: InputOutputSchemaSchema,
  execution: ExecutionConfigSchema,
  validation: z.object({
    type: z.enum(['auto', 'manual', 'hybrid']),
    criteria: z.array(ValidationCriterionSchema).min(1),
    autoApproveThreshold: z.number().min(0).max(1).default(0.8),
  }),
  pricing: PricingModelSchema,
  deadline: z.string().datetime().optional(),
  estimatedDurationHours: z.number().int().positive().optional(),
  requiredSkills: z.array(z.string()).max(10).default([]),
  minReputationScore: z.number().int().min(0).max(1000).default(0),
  allowAgent: z.boolean().default(true),
  allowHuman: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export type TaskSpec = z.infer<typeof TaskSpecSchema>;

export const TaskSpecCreateSchema = TaskSpecSchema.omit({ protocolVersion: true });

export type TaskSpecCreate = z.infer<typeof TaskSpecCreateSchema>;

export function createTaskSpecDefaults(): Partial<TaskSpec> {
  return {
    protocolVersion: '1.0' as const,
    workerType: WorkerType.BOTH,
    allowAgent: true,
    allowHuman: true,
    tags: [],
    requiredSkills: [],
    minReputationScore: 0,
    validation: {
      type: 'hybrid',
      criteria: [],
      autoApproveThreshold: 0.8,
    },
  };
}