// ─── Party / Role ────────────────────────────────────────────────────────────
export type Role = 'admin' | 'operator' | 'investor';

export interface Party {
  id: string;      // Canton party-id (base64 string)
  displayName: string;
  role: Role;
}

// ─── Contract payloads (mirror Daml templates) ───────────────────────────────
export type SPVState =
  | 'Draft'
  | 'Proposed'
  | 'Approved'
  | 'FundingOpen'
  | 'Funded'
  | 'Operational';

export interface UserRole {
  contractId: string;
  admin: string;
  investor: string;
  walletAddress: string;
  fullName: string;
  authorizedRegions: string[];
  kycVerified: boolean;
}

export interface KYCRequest {
  contractId: string;
  investor: string;
  admin: string;
  fullName: string;
  walletAddress: string;
  requestedRegions: string[];
}

export interface RegionalPortfolio {
  contractId: string;
  admin: string;
  operator: string;
  region: string;
  portfolioName: string;
  authorizedInvestors: string[];
  projects: string[];
  archived: boolean;
}

export interface ProjectSPV {
  contractId: string;
  operator: string;
  admin: string;
  spvParty: string;
  projectId: string;
  projectName: string;
  region: string;
  trancheNumber: number | null;
  capacityMW: number;
  ppaTariff: number;
  fundingTarget: number;
  fundingRaised: number;
  state: SPVState;
  tokenSymbol: string;
  tokenPrice: number;
}

export interface SPVToken {
  contractId: string;
  operator: string;
  owner: string;
  spvParty: string;
  projectId: string;
  symbol: string;
  amount: number;
}

export interface SPVTokenRegistry {
  contractId: string;
  operator: string;
  spvParty: string;
  projectId: string;
  totalSupply: number;
  holdings: Array<[string, number]>;
}

export interface InvestmentRequest {
  contractId: string;
  investor: string;
  operator: string;
  spvParty: string;
  projectId: string;
  tokenSymbol: string;
  usdcxHoldingCid: string;
  requestedTokens: number;
  usdcxAmount: number;
}

export interface AccessRequest {
  contractId: string;
  investor: string;
  admin: string;
  investorName: string;
  region: string;
  purpose: string;
}

export interface AccessApproval {
  contractId: string;
  investor: string;
  admin: string;
  region: string;
  grantedAt: string;
}

export interface ProductionReport {
  contractId: string;
  operator: string;
  spvParty: string;
  projectId: string;
  periodStart: string;
  periodEnd: string;
  kWhProduced: number;
  revenueGenerated: number;
  distributed: boolean;
}

export interface ClaimableYield {
  contractId: string;
  operator: string;
  investor: string;
  spvParty: string;
  projectId: string;
  amount: number;
  periodEnd: string;
}

// ─── Ledger API helpers ──────────────────────────────────────────────────────
export interface LedgerContract<T> {
  contractId: string;
  payload: T;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
