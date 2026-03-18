/**
 * Sawa-X — Daml JSON API client
 * Token and party IDs are built dynamically from the Canton node hash
 * stored in AppContext / localStorage.
 */

const BASE = '/v1';
export const PKG = '8f9512c74e51f99b504a767dc720ddf8be4c9e4496f54c5f4941043db19188c5';

// ─── Template IDs ─────────────────────────────────────────────────────────────
export const TMPL = {
  KYCRequest:        `${PKG}:Sawa.Identity.UserRole:KYCRequest`,
  UserRole:          `${PKG}:Sawa.Identity.UserRole:UserRole`,
  RegionalPortfolio: `${PKG}:Sawa.Portfolio.RegionalPortfolio:RegionalPortfolio`,
  ProjectSPV:        `${PKG}:Sawa.Asset.ProjectSPV:ProjectSPV`,
  SPVToken:          `${PKG}:Sawa.Token.SPVToken:SPVToken`,
  SPVTokenRegistry:  `${PKG}:Sawa.Token.SPVToken:SPVTokenRegistry`,
  InvestmentRequest: `${PKG}:Sawa.Investment.InvestmentRequest:InvestmentRequest`,
  AccessRequest:     `${PKG}:Sawa.Investment.AccessRequest:AccessRequest`,
  AccessApproval:    `${PKG}:Sawa.Investment.AccessRequest:AccessApproval`,
  ProductionReport:  `${PKG}:Sawa.Yield.ProductionReport:ProductionReport`,
  ClaimableYield:    `${PKG}:Sawa.Yield.ProductionReport:ClaimableYield`,
};

// ─── Token builder ────────────────────────────────────────────────────────────
function buildToken(hash: string): string {
  if (!hash) return 'no-hash';

  const parties = [
    `Admin::${hash}`,
    `Operator::${hash}`,
    `Investor1::${hash}`,
    `Investor2::${hash}`,
    `Investor3::${hash}`,
    `SPV_METALEX::${hash}`,
  ];

  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const payload = btoa(JSON.stringify({
    'https://daml.com/ledger-api': {
      ledgerId: 'sandbox',
      applicationId: 'sawa-x',
      actAs:  parties,
      readAs: parties,
    },
  })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${header}.${payload}.fake`;
}

// ─── Get hash from localStorage ───────────────────────────────────────────────
function getHash(): string {
  return localStorage.getItem('canton_node_hash') ?? '';
}

// ─── Core fetch ───────────────────────────────────────────────────────────────
async function ledgerFetch(path: string, body: unknown) {
  const token = buildToken(getHash());
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || (data.status !== undefined && data.status !== 200)) {
    throw new Error(data.errors?.[0] ?? `Ledger error ${res.status}`);
  }
  return data.result;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function queryContracts<T>(
  _party: string,
  templateId: string,
): Promise<Array<{ contractId: string; payload: T }>> {
  const result = await ledgerFetch('/query', { templateIds: [templateId] });
  return (result as any[]).map((c: any) => ({
    contractId: c.contractId,
    payload: c.payload as T,
  }));
}

export async function createContract(
  _party: string,
  templateId: string,
  payload: unknown,
): Promise<string> {
  const result = await ledgerFetch('/create', { templateId, payload });
  return (result as any).contractId as string;
}

export async function exerciseChoice(
  _party: string,
  templateId: string,
  contractId: string,
  choice: string,
  argument: unknown = {},
): Promise<unknown> {
  return ledgerFetch('/exercise', { templateId, contractId, choice, argument });
}

// ─── Fetch current node hash from ledger ─────────────────────────────────────
export async function fetchAndStoreHash(): Promise<string> {
  // Use a minimal token just to hit /v1/parties
  const minToken = buildToken(getHash()) !== 'no-hash'
    ? buildToken(getHash())
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake';

  const res = await fetch(`${BASE}/parties`, {
    headers: { 'Authorization': `Bearer ${minToken}` },
  });
  const data = await res.json();
  // Extract hash from first party identifier
  const first = data?.result?.[0]?.identifier ?? '';
  const match = first.match(/::([a-f0-9]{60,70})/);
  if (match) {
    const hash = match[1];
    localStorage.setItem('canton_node_hash', hash);
    return hash;
  }
  throw new Error('Could not detect Canton node hash from /v1/parties');
}