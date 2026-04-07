export type RoleType = 'Admin' | 'Operator' | 'Investor';

export interface PartyInfo {
  name: string;
  display: string;
  identifier: string;
}

export interface DamlContract<T> {
  contractId: string;
  payload: T;
  templateId: string;
}

export interface UserRole {
  admin: string;
  party: string;
  fullName: string;
  role: string;
  walletAddress: string;
  kycStatus: string;
  approvedRegions: string[];
}

export interface KYCRequest {
  investor: string;
  admin: string;
  fullName: string;
  walletAddress: string;
  requestedRegions: string[];
}

export interface RegionalPortfolio {
  admin: string;
  region: string;
  description: string;
  allocatedInvestors: string[];
}

export interface SPVProposal {
  operator: string;
  admin: string;
  projectId: string;
  name: string;
  description: string;
  region: string;
  totalFunding: string;
  trancheSize: string;
  ppaTariff: string;
  yieldRate: string;
  durationYears: string;
}

export interface ProjectSPV {
  admin: string;
  operator: string;
  projectId: string;
  name: string;
  description: string;
  region: string;
  totalFunding: string;
  trancheSize: string;
  numberOfTranches: string;
  currentTrancheIndex: string;
  totalFunded: string;
  status: string;
  ppaTariff: string;
  yieldRate: string;
  durationYears: string;
}

export interface Tranche {
  admin: string;
  operator: string;
  investor: string;
  projectId: string;
  projectName: string;
  trancheIndex: string;
  trancheSize: string;
  investedAmount: string;
  status: string;
}

export interface CompletedInvestment {
  admin: string;
  investor: string;
  operator: string;
  projectId: string;
  projectName: string;
  trancheIndex: string;
  amount: string;
}

export interface SPVToken {
  admin: string;
  investor: string;
  projectId: string;
  projectName: string;
  trancheIndex: string;
  tokenAmount: string;
  yieldRate: string;
}

export interface PortfolioAccess {
  admin: string;
  investor: string;
  region: string;
  projectIds: string[];
}
