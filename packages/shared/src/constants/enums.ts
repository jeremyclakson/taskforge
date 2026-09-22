export enum WorkerType {
  HUMAN = 'HUMAN',
  AGENT = 'AGENT',
  BOTH = 'BOTH',
}

export enum IdentityType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
  AGENT_OPERATOR = 'AGENT_OPERATOR',
}

export enum TaskStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

export enum BidStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  ESCROW_LOCK = 'ESCROW_LOCK',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  ESCROW_REFUND = 'ESCROW_REFUND',
  PLATFORM_FEE = 'PLATFORM_FEE',
  AD_PAYMENT = 'AD_PAYMENT',
  SKILL_ROYALTY = 'SKILL_ROYALTY',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  REVERTED = 'REVERTED',
}

export enum AdSlotType {
  TASK_TOP = 'TASK_TOP',
  HOME_BANNER = 'HOME_BANNER',
  AGENT_RECOMMEND = 'AGENT_RECOMMEND',
  CATEGORY_TOP = 'CATEGORY_TOP',
  SEARCH_AD = 'SEARCH_AD',
}

export enum AdBidModel {
  CPC = 'CPC',
  CPM = 'CPM',
  CPA = 'CPA',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  EVIDENCE_SUBMISSION = 'EVIDENCE_SUBMISSION',
  ARBITRATION = 'ARBITRATION',
  RESOLVED = 'RESOLVED',
  APPEALED = 'APPEALED',
}

export enum ChainId {
  ETHEREUM = 1,
  BASE = 8453,
  ARBITRUM = 42161,
  OPTIMISM = 10,
  POLYGON = 137,
  SOLANA = 'solana',
  TRON = 'tron',
}

export enum TokenSymbol {
  USDC = 'USDC',
  USDT = 'USDT',
  ETH = 'ETH',
  SOL = 'SOL',
  TRX = 'TRX',
}

export const SUPPORTED_CHAINS = [
  ChainId.ETHEREUM,
  ChainId.BASE,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.POLYGON,
] as const;

export const STABLECOINS = [TokenSymbol.USDC, TokenSymbol.USDT] as const;

export const NATIVE_TOKENS: Record<ChainId, TokenSymbol> = {
  [ChainId.ETHEREUM]: TokenSymbol.ETH,
  [ChainId.BASE]: TokenSymbol.ETH,
  [ChainId.ARBITRUM]: TokenSymbol.ETH,
  [ChainId.OPTIMISM]: TokenSymbol.ETH,
  [ChainId.POLYGON]: TokenSymbol.ETH,
  [ChainId.SOLANA]: TokenSymbol.SOL,
  [ChainId.TRON]: TokenSymbol.TRX,
};

export const TASK_CATEGORIES = [
  'code-generation',
  'bug-fix',
  'code-review',
  'refactoring',
  'testing',
  'devops',
  'data-extraction',
  'data-analysis',
  'ml-training',
  'ui-design',
  'ux-research',
  'video-editing',
  'graphic-design',
  'translation',
  'content-writing',
  'technical-writing',
  'smart-contract',
  'security-audit',
] as const;

export const SKILL_CATEGORIES = [
  'development',
  'data',
  'design',
  'content',
  'blockchain',
  'ai-ml',
  'devops',
  'testing',
] as const;