import { z } from 'zod';
import { AdSlotType, AdBidModel, ChainId, TokenSymbol } from '../constants/enums';

export const AdSlotSchema = z.object({
  id: z.string().cuid(),
  type: z.nativeEnum(AdSlotType),
  placement: z.string().max(100),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  targeting: z
    .object({
      chains: z.array(z.nativeEnum(ChainId)).optional(),
      categories: z.array(z.string()).optional(),
      skills: z.array(z.string()).optional(),
      regions: z.array(z.string()).optional(),
      minBudget: z.string().optional(),
      maxBudget: z.string().optional(),
      workerTypes: z.array(z.string()).optional(),
    })
    .optional(),
  pricing: z.object({
    model: z.nativeEnum(AdBidModel),
    floorPrice: z.string(),
    currency: z.nativeEnum(TokenSymbol),
    chainId: z.nativeEnum(ChainId),
  }),
  isActive: z.boolean().default(true),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AdSlot = z.infer<typeof AdSlotSchema>;

export const AdCampaignSchema = z.object({
  id: z.string().cuid(),
  advertiserId: z.string().cuid(),
  name: z.string().min(1).max(100),
  slotId: z.string().cuid(),
  creativeId: z.string().cuid().nullable(),
  bidModel: z.nativeEnum(AdBidModel),
  bidAmount: z.string(),
  dailyBudget: z.string().nullable(),
  totalBudget: z.string().nullable(),
  spentAmount: z.string().default('0'),
  targeting: z.record(z.unknown()).nullable(),
  status: z.enum(['draft', 'pending', 'active', 'paused', 'completed', 'rejected']).default('draft'),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
  approvedAt: z.date().nullable(),
  rejectedAt: z.date().nullable(),
  rejectionReason: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AdCampaign = z.infer<typeof AdCampaignSchema>;

export const AdCreativeSchema = z.object({
  id: z.string().cuid(),
  advertiserId: z.string().cuid(),
  name: z.string().min(1).max(100),
  type: z.enum(['image', 'video', 'html', 'native']),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fileUrl: z.string().url(),
  clickUrl: z.string().url(),
  impressionTracker: z.string().url().nullable(),
  clickTracker: z.string().url().nullable(),
  altText: z.string().max(200).nullable(),
  metadata: z.record(z.unknown()).nullable(),
  isApproved: z.boolean().default(false),
  approvedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AdCreative = z.infer<typeof AdCreativeSchema>;

export const AdImpressionSchema = z.object({
  id: z.string().cuid(),
  campaignId: z.string().cuid(),
  slotId: z.string().cuid(),
  creativeId: z.string().cuid(),
  userId: z.string().cuid().nullable(),
  sessionId: z.string().nullable(),
  ipHash: z.string().max(64),
  userAgent: z.string().max(500),
  referrer: z.string().url().nullable(),
  price: z.string(),
  currency: z.nativeEnum(TokenSymbol),
  chainId: z.nativeEnum(ChainId),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.date(),
});

export type AdImpression = z.infer<typeof AdImpressionSchema>;

export const AdClickSchema = z.object({
  id: z.string().cuid(),
  impressionId: z.string().cuid(),
  campaignId: z.string().cuid(),
  slotId: z.string().cuid(),
  creativeId: z.string().cuid(),
  userId: z.string().cuid().nullable(),
  sessionId: z.string().nullable(),
  ipHash: z.string().max(64),
  userAgent: z.string().max(500),
  referrer: z.string().url().nullable(),
  isValid: z.boolean().default(true),
  invalidReason: z.string().nullable(),
  createdAt: z.date(),
});

export type AdClick = z.infer<typeof AdClickSchema>;

export const AdSlotCreateSchema = AdSlotSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AdSlotCreate = z.infer<typeof AdSlotCreateSchema>;

export const AdCampaignCreateSchema = AdCampaignSchema.omit({
  id: true,
  spentAmount: true,
  status: true,
  approvedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
});

export type AdCampaignCreate = z.infer<typeof AdCampaignCreateSchema>;