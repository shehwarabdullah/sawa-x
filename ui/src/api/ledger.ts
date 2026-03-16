const BASE = '/v1';

const PKG = 'ead4f13f863d82bbf7377e7618f522c9a0159a3e3c336840e51d7810ec0b77da';

const SANDBOX_TOKEN = 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJodHRwczovL2RhbWwuY29tL2xlZGdlci1hcGkiOiB7ImxlZGdlcklkIjogInNhbmRib3giLCAiYXBwbGljYXRpb25JZCI6ICJzYXdhLXgiLCAiYWN0QXMiOiBbIkFkbWluOjoxMjIwZThkNjUwODFhY2UwMmU1ZjBhNjc4MTE1MWY3OTkwZmZhYjQzMTE0ZGVhMjU2MzM0ZTE5Yjg3Y2ZiOGI1MmYzMSIsICJPcGVyYXRvcjo6MTIyMGU4ZDY1MDgxYWNlMDJlNWYwYTY3ODExNTFmNzk5MGZmYWI0MzExNGRlYTI1NjMzNGUxOWI4N2NmYjhiNTJmMzEiLCAiSW52ZXN0b3I6OjEyMjBlOGQ2NTA4MWFjZTAyZTVmMGE2NzgxMTUxZjc5OTBmZmFiNDMxMTRkZWEyNTYzMzRlMTliODdjZmI4YjUyZjMxIiwgIlNQVl9NRVRBTEVYOjoxMjIwZThkNjUwODFhY2UwMmU1ZjBhNjc4MTE1MWY3OTkwZmZhYjQzMTE0ZGVhMjU2MzM0ZTE5Yjg3Y2ZiOGI1MmYzMSJdLCAicmVhZEFzIjogWyJBZG1pbjo6MTIyMGU4ZDY1MDgxYWNlMDJlNWYwYTY3ODExNTFmNzk5MGZmYWI0MzExNGRlYTI1NjMzNGUxOWI4N2NmYjhiNTJmMzEiLCAiT3BlcmF0b3I6OjEyMjBlOGQ2NTA4MWFjZTAyZTVmMGE2NzgxMTUxZjc5OTBmZmFiNDMxMTRkZWEyNTYzMzRlMTliODdjZmI4YjUyZjMxIiwgIkludmVzdG9yOjoxMjIwZThkNjUwODFhY2UwMmU1ZjBhNjc4MTE1MWY3OTkwZmZhYjQzMTE0ZGVhMjU2MzM0ZTE5Yjg3Y2ZiOGI1MmYzMSIsICJTUFZfTUVUQUxFWDo6MTIyMGU4ZDY1MDgxYWNlMDJlNWYwYTY3ODExNTFmNzk5MGZmYWI0MzExNGRlYTI1NjMzNGUxOWI4N2NmYjhiNTJmMzEiXX19.fake';

export const TMPL = {
  KYCRequest:        `${PKG}:Sawa.Identity.UserRole:KYCRequest`,
  UserRole:          `${PKG}:Sawa.Identity.UserRole:UserRole`,
  SPVIdentity:       `${PKG}:Sawa.Identity.UserRole:SPVIdentity`,
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

async function ledgerFetch(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SANDBOX_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || (data.status !== undefined && data.status !== 200)) {
    throw new Error(data.errors?.[0] ?? `Ledger error ${res.status}`);
  }
  return data.result;
}

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
  const result = await ledgerFetch('/exercise', {
    templateId,
    contractId,
    choice,
    argument,
  });
  return result;
}