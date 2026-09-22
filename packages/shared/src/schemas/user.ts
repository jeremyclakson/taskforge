import { z } from 'zod';
import { IdentityType, WorkerType } from '../constants/enums';

export const WalletSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  chainId: z.number().int().positive(),
  address: z.string().min(1).max(100),
  isPrimary: z.boolean().default(false),
  label: z.string().max(50).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Wallet = z.infer<typeof WalletSchema>;

export const CompanyInfoSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  name: z.string().min(1).max(200),
  registrationNumber: z.string().max(100).optional(),
  taxId: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
  verified: z.boolean().default(false),
  verifiedAt: z.date().optional(),
  verifiedBy: z.string().cuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CompanyInfo = z.infer<typeof CompanyInfoSchema>;

export const AgentProfileSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  apiKeyHash: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  webhookSecret: z.string().optional(),
  skills: z.array(z.string()).default([]),
  runtime: z.string().optional(),
  sandbox: z.string().optional(),
  isActive: z.boolean().default(true),
  lastHeartbeat: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AgentProfile = z.infer<typeof AgentProfileSchema>;

export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email().max(255),
  emailVerified: z.date().nullable(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/).nullable(),
  displayName: z.string().min(1).max(100).nullable(),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().max(500).nullable(),
  identityType: z.nativeEnum(IdentityType).default(IdentityType.INDIVIDUAL),
  workerType: z.nativeEnum(WorkerType).default(WorkerType.HUMAN),
  githubId: z.string().nullable(),
  githubUsername: z.string().nullable(),
  githubAccessToken: z.string().nullable(),
  wallets: z.array(WalletSchema).default([]),
  companyInfo: CompanyInfoSchema.nullable(),
  agentProfile: AgentProfileSchema.nullable(),
  isActive: z.boolean().default(true),
  isBanned: z.boolean().default(false),
  banReason: z.string().nullable(),
  lastLoginAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const UserPublicSchema = UserSchema.omit({
  email: true,
  githubAccessToken: true,
  wallets: true,
  companyInfo: true,
  agentProfile: true,
  isBanned: true,
  banReason: true,
  lastLoginAt: true,
}).extend({
  wallets: z.array(WalletSchema.omit({ userId: true })).default([]),
  companyInfo: CompanyInfoSchema.omit({ userId: true }).nullable(),
  agentProfile: AgentProfileSchema.omit({ userId: true, apiKeyHash: true, webhookSecret: true }).nullable(),
});

export type UserPublic = z.infer<typeof UserPublicSchema>;

export const SessionSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  sessionToken: z.string().min(32).max(255),
  expires: z.date(),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().max(500).optional(),
  createdAt: z.date(),
});

export type Session = z.infer<typeof SessionSchema>;

export const VerificationTokenSchema = z.object({
  id: z.string().cuid(),
  identifier: z.string().max(255),
  token: z.string().min(32).max(255),
  expires: z.date(),
  type: z.enum(['email', 'wallet', 'password_reset']),
  createdAt: z.date(),
});

export type VerificationToken = z.infer<typeof VerificationTokenSchema>;