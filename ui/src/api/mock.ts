/**
 * In-memory mock store – mirrors the Daml contract model.
 * Used when the Canton sandbox is not running so the UI demo
 * works end-to-end in a browser-only environment.
 */
import {
  KYCRequest, UserRole, RegionalPortfolio, ProjectSPV,
  SPVTokenRegistry, InvestmentRequest, AccessRequest,
  AccessApproval, ProductionReport, ClaimableYield,
} from '../types';

let _seq = 1;
const cid = (prefix: string) => `${prefix}-${_seq++}`;

// ─── Store ────────────────────────────────────────────────────────────────────
export const store = {
  kycRequests:        [] as KYCRequest[],
  userRoles:          [] as UserRole[],
  portfolios:         [] as RegionalPortfolio[],
  projects:           [] as ProjectSPV[],
  registries:         [] as SPVTokenRegistry[],
  investmentRequests: [] as InvestmentRequest[],
  accessRequests:     [] as AccessRequest[],
  accessApprovals:    [] as AccessApproval[],
  productionReports:  [] as ProductionReport[],
  claimableYields:    [] as ClaimableYield[],
};

// ─── KYC ─────────────────────────────────────────────────────────────────────
export function submitKYCRequest(
  investor: string,
  admin: string,
  fullName: string,
  walletAddress: string,
  requestedRegions: string[],
): KYCRequest {
  const r: KYCRequest = {
    contractId: cid('kyc'),
    investor, admin, fullName, walletAddress, requestedRegions,
  };
  store.kycRequests.push(r);
  return r;
}

export function approveKYC(contractId: string): UserRole {
  const idx = store.kycRequests.findIndex(r => r.contractId === contractId);
  if (idx < 0) throw new Error('KYCRequest not found');
  const req = store.kycRequests[idx];
  store.kycRequests.splice(idx, 1);
  const role: UserRole = {
    contractId: cid('role'),
    admin: req.admin,
    investor: req.investor,
    walletAddress: req.walletAddress,
    fullName: req.fullName,
    authorizedRegions: req.requestedRegions,
    kycVerified: true,
  };
  store.userRoles.push(role);
  return role;
}

export function rejectKYC(contractId: string) {
  store.kycRequests = store.kycRequests.filter(r => r.contractId !== contractId);
}

// ─── Portfolio ────────────────────────────────────────────────────────────────
export function createPortfolio(
  admin: string,
  operator: string,
  region: string,
  portfolioName: string,
): RegionalPortfolio {
  const p: RegionalPortfolio = {
    contractId: cid('portfolio'),
    admin, operator, region, portfolioName,
    authorizedInvestors: [], projects: [], archived: false,
  };
  store.portfolios.push(p);
  return p;
}

export function addInvestorToPortfolio(contractId: string, investor: string): RegionalPortfolio {
  const p = store.portfolios.find(p => p.contractId === contractId);
  if (!p) throw new Error('Portfolio not found');
  if (!p.authorizedInvestors.includes(investor)) p.authorizedInvestors.push(investor);
  return p;
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export function createProject(payload: Omit<ProjectSPV, 'contractId'>): ProjectSPV {
  const p: ProjectSPV = { contractId: cid('spv'), ...payload };
  store.projects.push(p);

  // Auto-create registry
  const reg: SPVTokenRegistry = {
    contractId: cid('registry'),
    operator: payload.operator,
    spvParty: payload.spvParty,
    projectId: payload.projectId,
    totalSupply: 0,
    holdings: [],
  };
  store.registries.push(reg);

  return p;
}

function transitionProject(contractId: string, from: ProjectSPV['state'], to: ProjectSPV['state']): ProjectSPV {
  const p = store.projects.find(p => p.contractId === contractId);
  if (!p) throw new Error('Project not found');
  if (p.state !== from) throw new Error(`Expected state ${from}, got ${p.state}`);
  p.state = to;
  return p;
}

export const proposeProject   = (id: string) => transitionProject(id, 'Draft',       'Proposed');
export const approveProject   = (id: string) => transitionProject(id, 'Proposed',    'Approved');
export const rejectProject    = (id: string) => transitionProject(id, 'Proposed',    'Draft');
export const openFunding      = (id: string) => transitionProject(id, 'Approved',    'FundingOpen');
export const closeFunding     = (id: string) => transitionProject(id, 'FundingOpen', 'Funded');
export const makeOperational  = (id: string) => transitionProject(id, 'Funded',      'Operational');

// ─── Access ───────────────────────────────────────────────────────────────────
export function requestAccess(
  investor: string, admin: string,
  investorName: string, region: string, purpose: string,
): AccessRequest {
  const r: AccessRequest = {
    contractId: cid('access-req'),
    investor, admin, investorName, region, purpose,
  };
  store.accessRequests.push(r);
  return r;
}

export function approveAccess(contractId: string): AccessApproval {
  const idx = store.accessRequests.findIndex(r => r.contractId === contractId);
  if (idx < 0) throw new Error('AccessRequest not found');
  const req = store.accessRequests[idx];
  store.accessRequests.splice(idx, 1);
  const a: AccessApproval = {
    contractId: cid('access-approval'),
    investor: req.investor,
    admin: req.admin,
    region: req.region,
    grantedAt: new Date().toISOString(),
  };
  store.accessApprovals.push(a);
  return a;
}

export function rejectAccess(contractId: string) {
  store.accessRequests = store.accessRequests.filter(r => r.contractId !== contractId);
}

// ─── Investment ───────────────────────────────────────────────────────────────
export function submitInvestmentRequest(payload: Omit<InvestmentRequest, 'contractId'>): InvestmentRequest {
  const r: InvestmentRequest = { contractId: cid('inv-req'), ...payload };
  store.investmentRequests.push(r);
  return r;
}

export function acceptInvestment(contractId: string): void {
  const idx = store.investmentRequests.findIndex(r => r.contractId === contractId);
  if (idx < 0) throw new Error('InvestmentRequest not found');
  const req = store.investmentRequests[idx];
  store.investmentRequests.splice(idx, 1);

  // Update registry
  const reg = store.registries.find(r => r.projectId === req.projectId);
  if (reg) {
    reg.totalSupply += req.requestedTokens;
    const h = reg.holdings.find(([p]) => p === req.investor);
    if (h) h[1] += req.requestedTokens;
    else reg.holdings.push([req.investor, req.requestedTokens]);
  }

  // Update project funding
  const proj = store.projects.find(p => p.projectId === req.projectId);
  if (proj) proj.fundingRaised += req.usdcxAmount;
}

// ─── Production / Yield ───────────────────────────────────────────────────────
export function submitProductionReport(payload: Omit<ProductionReport, 'contractId'>): ProductionReport {
  const r: ProductionReport = { contractId: cid('report'), ...payload };
  store.productionReports.push(r);
  return r;
}

export function allocateYield(reportContractId: string, investorParty: string): ClaimableYield {
  const report = store.productionReports.find(r => r.contractId === reportContractId);
  if (!report) throw new Error('Report not found');
  if (report.distributed) throw new Error('Already distributed');

  const reg = store.registries.find(r => r.projectId === report.projectId);
  if (!reg || reg.totalSupply === 0) throw new Error('No registry / supply');

  const investorBal = reg.holdings.find(([p]) => p === investorParty)?.[1] ?? 0;
  if (investorBal === 0) throw new Error('Investor holds no tokens');

  const yieldAmt = (investorBal / reg.totalSupply) * report.revenueGenerated;
  report.distributed = true;

  const y: ClaimableYield = {
    contractId: cid('yield'),
    operator: report.operator,
    investor: investorParty,
    spvParty: report.spvParty,
    projectId: report.projectId,
    amount: yieldAmt,
    periodEnd: report.periodEnd,
  };
  store.claimableYields.push(y);
  return y;
}

export function claimYield(contractId: string): void {
  store.claimableYields = store.claimableYields.filter(y => y.contractId !== contractId);
}
