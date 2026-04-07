const BASE = '/api';
async function get(path: string) { return (await fetch(`${BASE}${path}`)).json(); }
async function post(path: string, body: Record<string, unknown>) {
  return (await fetch(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).json();
}

export const api = {
  init: () => get('/init'),
  health: () => get('/health'),

  // KYC
  getKYCStatus: (investorName: string) => get(`/kyc-status?investor=${investorName}`),
  submitKYCFull: (data: Record<string, unknown>) => post('/submit-kyc-full', data),
  getKYCFull: () => get('/kyc-full'),
  approveKYCByName: (investorName: string) => post('/approve-kyc-by-name', { investorName }),
  rejectKYCByName: (investorName: string) => post('/reject-kyc-by-name', { investorName }),
  getUserRoles: () => get('/user-roles'),

  // Portfolios & Regions
  getPortfolios: () => get('/portfolios'),
  getRegions: () => get('/regions'),
  getMyRegions: (investor: string) => get(`/my-regions?investor=${investor}`),
  createPortfolio: (region: string, description: string) => post('/create-portfolio', { region, description }),
  allocateInvestorPortfolio: (contractId: string, investorName: string) => post('/allocate-investor-portfolio', { contractId, investorName }),

  // SPV
  getSPVProposals: () => get('/spv-proposals'),
  createSPV: (data: Record<string, unknown>) => post('/create-spv', data),
  approveSPV: (contractId: string) => post('/approve-spv', { contractId }),

  // Projects
  getProjects: (investor?: string) => get(`/projects${investor ? `?investor=${investor}` : ''}`),
  moveLifecycle: (contractId: string, action: string) => post('/move-lifecycle', { contractId, action }),

  // Tranches
  getTranches: (projectId?: string, investor?: string) => {
    const p = new URLSearchParams();
    if (projectId) p.set('projectId', projectId);
    if (investor) p.set('investor', investor);
    return get(`/tranches?${p}`);
  },
  createTranche: (data: Record<string, unknown>) => post('/create-tranche', data),
  invest: (contractId: string, investorName: string, amount: number) => post('/invest', { contractId, investorName, amount }),
  completeTranche: (contractId: string, investorName: string) => post('/complete-tranche', { contractId, investorName }),
  moveTrancheLifecycle: (contractId: string, action: string) => post('/move-tranche-lifecycle', { contractId, action }),

  // Investments & Tokens
  getInvestments: (investor?: string) => get(`/investments${investor ? `?investor=${investor}` : ''}`),
  getTokens: (investor?: string) => get(`/tokens${investor ? `?investor=${investor}` : ''}`),

  // Access
  getPortfolioAccess: (investor?: string) => get(`/portfolio-access${investor ? `?investor=${investor}` : ''}`),
  grantAccess: (investorName: string, region: string, projectIds: string[]) => post('/grant-access', { investorName, region, projectIds }),

  // Production
  getProduction: (projectId?: string) => get(`/production${projectId ? `?projectId=${projectId}` : ''}`),
  updateProduction: (data: Record<string, unknown>) => post('/update-production', data),

  // VDR
  getVDR: (projectId?: string) => get(`/vdr${projectId ? `?projectId=${projectId}` : ''}`),
  createVDR: (data: Record<string, unknown>) => post('/create-vdr', data),
  approveVDR: (contractId: string) => post('/approve-vdr', { contractId }),

  // Waterfall
  getWaterfall: (projectId?: string, investor?: string) => {
    const p = new URLSearchParams();
    if (projectId) p.set('projectId', projectId);
    if (investor) p.set('investor', investor);
    return get(`/waterfall?${p}`);
  },
  createWaterfall: (data: Record<string, unknown>) => post('/create-waterfall', data),
  settleRevenue: (contractId: string, grossRevenue: number, settlementDate: string) => post('/settle-revenue', { contractId, grossRevenue, settlementDate }),

  // Operator Tokens & Fees
  getOperatorTokens: () => get('/operator-tokens'),
  mintOperatorToken: (data: Record<string, unknown>) => post('/mint-operator-token', data),
  vestOperatorToken: (contractId: string) => post('/vest-operator-token', { contractId }),
  getDevFees: () => get('/dev-fees'),
  disburseDevFee: (projectId: string, totalCapEx: number, devFeePct: number) => post('/disburse-dev-fee', { projectId, totalCapEx, devFeePct }),

  // Yield Claims
  getYieldClaims: (investor?: string, projectId?: string) => {
    const p = new URLSearchParams();
    if (investor) p.set('investor', investor);
    if (projectId) p.set('projectId', projectId);
    return get(`/yield-claims?${p}`);
  },
  createYieldClaim: (investorName: string, projectId: string, claimableAmount: number) =>
    post('/create-yield-claim', { investorName, projectId, claimableAmount }),
  claimYield: (contractId: string, investorName: string) =>
    post('/claim-yield', { contractId, investorName }),

  // Financial Summary (computed)
  getFinancialSummary: (projectId?: string) => get(`/financial-summary${projectId ? `?projectId=${projectId}` : ''}`),
};
