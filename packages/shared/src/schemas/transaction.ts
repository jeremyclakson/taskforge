import { z } from 'zod';
import { TransactionType, TransactionStatus, ChainId, TokenSymbol } from '../constants/enums';

export const TokenPriceSchema = z.object({
  id: z.string().cuid(),
  chainId: z.nativeEnum(ChainId),
  tokenSymbol: z.nativeEnum(TokenSymbol),
  tokenAddress: z.string().nullable(),
  priceUsd: z.string(),
  source: z.string().max(50),
  timestamp: z.date(),
});

export type TokenPrice = z.infer<typeof TokenPriceSchema>;

export const TransactionSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  type: z.nativeEnum(TransactionType),
  status: z.nativeEnum(TransactionStatus).default(TransactionStatus.PENDING),
  chainId: z.nativeEnum(ChainId),
  tokenSymbol: z.nativeEnum(TokenSymbol),
  tokenAddress: z.string().nullable(),
  amountRaw: z.string(),
  decimals: z.number().int().positive(),
  amountUsd: z.string().nullable(),
  txHash: z.string().nullable(),
  blockNumber: z.number().int().positive().nullable(),
  fromAddress: z.string().nullable(),
  toAddress: z.string().nullable(),
  relatedTaskId: z.string().cuid().nullable(),
  relatedBidId: z.string().cuid().nullable(),
  relatedAdSlotId: z.string().cuid().nullable(),
  relatedDisputeId: z.string().cuid().nullable(),
  feeRaw: z.string().nullable(),
  feeUsd: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  confirmedAt: z.date().nullable(),
  failedAt: z.date().nullable(),
  failureReason: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export const WalletBalanceSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  chainId: z.nativeEnum(ChainId),
  tokenSymbol: z.nativeEnum(TokenSymbol),
  tokenAddress: z.string().nullable(),
  balanceRaw: z.string().default('0'),
  decimals: z.number().int().positive(),
  lockedRaw: z.string().default('0'),
  updatedAt: z.date(),
});

export type WalletBalance = z.infer<typeof WalletBalanceSchema>;

export const EscrowSchema = z.object({
  id: z.string().cuid(),
  taskId: z.string().cuid(),
  contractAddress: z.string(),
  chainId: z.nativeEnum(ChainId),
  tokenAddress: z.string(),
  amountRaw: z.string(),
  decimals: z.number().int().positive(),
  publisherAddress: z.string(),
  workerAddress: z.string().nullable(),
  arbiterAddress: z.string().nullable(),
  status: z.enum(['funded', 'released', 'refunded', 'disputed', 'expired']).default('funded'),
  fundedTxHash: z.string(),
  fundedBlockNumber: z.number().int().positive(),
  releasedTxHash: z.string().nullable(),
  refundedTxHash: z.string().nullable(),
  disputedAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Escrow = z.infer<typeof EscrowSchema>;

export const TransactionCreateSchema = z.object({
  userId: z.string().cuid(),
  type: z.nativeEnum(TransactionType),
  chainId: z.nativeEnum(ChainId),
  tokenSymbol: z.nativeEnum(TokenSymbol),
  tokenAddress: z.string().nullable(),
  amountRaw: z.string(),
  decimals: z.number().int().positive(),
  fromAddress: z.string().nullable(),
  toAddress: z.string().nullable(),
  relatedTaskId: z.string().cuid().nullable(),
  relatedBidId: z.string().cuid().nullable(),
  relatedAdSlotId: z.string().cuid().nullable(),
  relatedDisputeId: z.string().cuid().nullable(),
});

export type TransactionCreate = z.infer<typeof TransactionCreateSchema>;