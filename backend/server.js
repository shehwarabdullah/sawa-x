/**
 * Sawa-X Backend v2
 * 
 * Validation: Regional Portfolio → Project Access → Tranche Access
 * Dynamic tranche sizes, tranche-level lifecycle
 * Auto-discovers package hash + party identifiers
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { execSync } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const PORT = process.env.PORT || 3001;
const DAML_API = process.env.DAML_API || 'http://localhost:7575';

// ─── Party & Package Discovery ──────────────
let PARTIES = {};
let CANTON_HASH = '';
let PKG = '';

function discoverParties() {
  try {
    const output = execSync('daml ledger list-parties --host localhost --port 6865 2>/dev/null', { encoding: 'utf8', timeout: 10000 });
    for (const line of output.split('\n')) {
      const m = line.match(/'(\w+)::([\da-f]+)'/);
      if (m) { PARTIES[m[1]] = `${m[1]}::${m[2]}`; if (!CANTON_HASH) CANTON_HASH = m[2]; }
    }
    if (Object.keys(PARTIES).length > 0) { console.log(`  ✓ Discovered ${Object.keys(PARTIES).length} parties`); return true; }
  } catch {}
  return false;
}

function discoverPackageHash() {
  try {
    let darPath = '.daml/dist/sawa-x-demo-0.0.1.dar';
    try { execSync(`test -f ${darPath}`); } catch { darPath = '../.daml/dist/sawa-x-demo-0.0.1.dar'; }
    const output = execSync(`daml damlc inspect ${darPath} 2>/dev/null | head -5`, { encoding: 'utf8', timeout: 15000 });
    const m = output.match(/package ([a-f0-9]{64})/);
    if (m) { PKG = m[1]; console.log(`  ✓ Package hash: ${PKG.slice(0, 16)}...`); return true; }
  } catch {}
  try {
    const output2 = execSync(`curl -s ${DAML_API}/v1/packages -H "Authorization: Bearer ${allPartiesToken()}" 2>/dev/null`, { encoding: 'utf8', timeout: 10000 });
    const data = JSON.parse(output2);
    if (data.result?.length > 0) { PKG = data.result[data.result.length - 1]; console.log(`  ✓ Package hash (API): ${PKG.slice(0, 16)}...`); return true; }
  } catch {}
  return false;
}

function buildJWT(names) {
  const parties = names.map(n => PARTIES[n] || n);
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ 'https://daml.com/ledger-api': { ledgerId: 'sandbox', applicationId: 'sawa-x', actAs: parties, readAs: parties } })).toString('base64url');
  return `${h}.${p}.fake`;
}
function allPartiesToken() { return buildJWT(Object.keys(PARTIES)); }
function partyToken(n) { return buildJWT([n]); }
function resolveParty(n) { return PARTIES[n] || n; }

function T(mod, ent) { return PKG ? `${PKG}:${mod}:${ent}` : `${mod}:${ent}`; }

const TEMPLATES = {
  get KYCRequest()         { return T('Sawa.Identity.UserRole', 'KYCRequest'); },
  get UserRole()           { return T('Sawa.Identity.UserRole', 'UserRole'); },
  get RejectedKYC()        { return T('Sawa.Identity.UserRole', 'RejectedKYC'); },
  get RegionalPortfolio()  { return T('Sawa.Portfolio.RegionalPortfolio', 'RegionalPortfolio'); },
  get SPVProposal()        { return T('Sawa.Asset.ProjectSPV', 'SPVProposal'); },
  get ProjectSPV()         { return T('Sawa.Asset.ProjectSPV', 'ProjectSPV'); },
  get Tranche()            { return T('Sawa.Asset.Tranche', 'Tranche'); },
  get CompletedInvestment(){ return T('Sawa.Investment.Investment', 'CompletedInvestment'); },
  get SPVToken()           { return T('Sawa.Token.SPVToken', 'SPVToken'); },
  get ProductionReport()   { return T('Sawa.Yield.ProductionReport', 'ProductionReport'); },
  get ClaimYield()         { return T('Sawa.Yield.ClaimYield', 'ClaimYield'); },
  get PortfolioAccess()    { return T('Sawa.Access.PortfolioAccess', 'PortfolioAccess'); },
  get ProjectRegistry()    { return T('Sawa.Registry.ProjectRegistry', 'ProjectRegistry'); },
  get WaterfallState()     { return T('Sawa.Settlement.WaterfallSettlement', 'WaterfallState'); },
  get OperatorToken()      { return T('Sawa.Settlement.WaterfallSettlement', 'OperatorToken'); },
  get DevFeeDisbursement() { return T('Sawa.Settlement.WaterfallSettlement', 'DevFeeDisbursement'); },
};

async function damlQuery(tid, filter = {}, token) {
  const res = await fetch(`${DAML_API}/v1/query`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token || allPartiesToken()}` }, body: JSON.stringify({ templateIds: [tid], query: filter }) });
  return (await res.json()).result || [];
}
async function damlCreate(tid, payload, token) {
  const res = await fetch(`${DAML_API}/v1/create`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ templateId: tid, payload }) });
  return res.json();
}
async function damlExercise(tid, cid, choice, arg, token) {
  const res = await fetch(`${DAML_API}/v1/exercise`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ templateId: tid, contractId: cid, choice, argument: arg }) });
  return res.json();
}

// ─── Off-Chain KYC Store ────────────────────
const KYC_STORE = {};

function requireKYC(name) { return KYC_STORE[name]?.status === 'approved'; }

async function checkOnChainKYC(name) {
  try {
    const roles = await damlQuery(TEMPLATES.UserRole);
    const full = resolveParty(name);
    if (roles.find(r => r.payload.party === full && r.payload.kycStatus === 'KYCApproved')) {
      KYC_STORE[name] = { status: 'approved', fullName: '', nationality: '', idType: 'passport', idNumber: '', idCardBase64: '', selfieBase64: '', submittedAt: new Date(), reviewedAt: new Date() };
      return 'approved';
    }
  } catch {}
  return 'none';
}

// ─── Validation Helpers ─────────────────────
// Sequence: Region → Project → Tranche

async function getInvestorRegions(investorName) {
  const portfolios = await damlQuery(TEMPLATES.RegionalPortfolio);
  const full = resolveParty(investorName);
  return portfolios.filter(p => (p.payload.allocatedInvestors || []).includes(full)).map(p => p.payload.region);
}

async function getInvestorProjectIds(investorName) {
  const access = await damlQuery(TEMPLATES.PortfolioAccess);
  const full = resolveParty(investorName);
  const ids = new Set();
  access.forEach(a => { if (a.payload.investor === full) (a.payload.projectIds || []).forEach(id => ids.add(id)); });
  return [...ids];
}

// ─── API Routes ─────────────────────────────

app.get('/api/health', (req, res) => res.json({ status: 'ok', parties: Object.keys(PARTIES), packageHash: PKG.slice(0, 16) }));
app.get('/api/init', (req, res) => {
  res.json({ parties: Object.entries(PARTIES).map(([n, f]) => ({ name: n, display: n, identifier: f })), ready: Object.keys(PARTIES).length > 0 });
});

// ─── KYC (no wallet, no regions) ────────────
app.get('/api/kyc-status', (req, res) => {
  const e = KYC_STORE[req.query.investor];
  if (!e) return checkOnChainKYC(req.query.investor).then(s => res.json({ status: s })).catch(() => res.json({ status: 'none' }));
  res.json({ status: e.status });
});

app.post('/api/submit-kyc-full', async (req, res) => {
  try {
    const { investorName, fullName, nationality, idType, idNumber, idCardBase64, selfieBase64 } = req.body;
    if (!investorName || !fullName || !idNumber) return res.json({ error: 'Missing required fields' });
    if (!idCardBase64 || !selfieBase64) return res.json({ error: 'ID card and selfie are required' });

    KYC_STORE[investorName] = { status: 'pending', fullName, nationality: nationality || '', idType: idType || 'passport', idNumber, idCardBase64, selfieBase64, submittedAt: new Date(), reviewedAt: null };

    const result = await damlCreate(TEMPLATES.KYCRequest, {
      investor: resolveParty(investorName), admin: resolveParty('Admin'),
      fullName, walletAddress: '', requestedRegions: []
    }, partyToken(investorName));

    if (result.errors) return res.json({ error: result.errors.join(', ') });
    console.log(`  📋 KYC submitted: ${investorName}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/kyc-full', (req, res) => {
  res.json(Object.entries(KYC_STORE).map(([name, d]) => ({
    investorName: name, fullName: d.fullName, nationality: d.nationality, idType: d.idType, idNumber: d.idNumber,
    status: d.status, hasDocuments: !!(d.idCardBase64 || d.selfieBase64),
    idCardBase64: d.idCardBase64 || null, selfieBase64: d.selfieBase64 || null
  })));
});

app.post('/api/approve-kyc-by-name', async (req, res) => {
  try {
    const { investorName } = req.body;
    const e = KYC_STORE[investorName];
    if (!e) return res.json({ error: 'KYC not found' });
    const token = partyToken('Admin');
    const requests = await damlQuery(TEMPLATES.KYCRequest);
    const match = requests.find(r => r.payload.investor === resolveParty(investorName));
    if (match) await damlExercise(TEMPLATES.KYCRequest, match.contractId, 'ApproveKYC', {}, token);
    else await damlCreate(TEMPLATES.UserRole, { admin: resolveParty('Admin'), party: resolveParty(investorName), fullName: e.fullName, role: 'Investor', walletAddress: '', kycStatus: 'KYCApproved', approvedRegions: [] }, token);
    KYC_STORE[investorName].status = 'approved';
    KYC_STORE[investorName].reviewedAt = new Date();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/reject-kyc-by-name', async (req, res) => {
  try {
    const { investorName } = req.body;
    if (!KYC_STORE[investorName]) return res.json({ error: 'KYC not found' });
    const requests = await damlQuery(TEMPLATES.KYCRequest);
    const match = requests.find(r => r.payload.investor === resolveParty(investorName));
    if (match) await damlExercise(TEMPLATES.KYCRequest, match.contractId, 'RejectKYC', {}, partyToken('Admin'));
    KYC_STORE[investorName].status = 'rejected';
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/user-roles', async (req, res) => { try { res.json(await damlQuery(TEMPLATES.UserRole)); } catch (e) { res.status(500).json({ error: e.message }); } });

// ─── Regional Portfolios ───────────────────
app.get('/api/portfolios', async (req, res) => { try { res.json(await damlQuery(TEMPLATES.RegionalPortfolio)); } catch (e) { res.status(500).json({ error: e.message }); } });

// Get regions available (for SPV creation dropdown)
app.get('/api/regions', async (req, res) => {
  try {
    const portfolios = await damlQuery(TEMPLATES.RegionalPortfolio);
    res.json(portfolios.map(p => ({ region: p.payload.region, description: p.payload.description, investorCount: (p.payload.allocatedInvestors || []).length })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get investor's allocated regions
app.get('/api/my-regions', async (req, res) => {
  try {
    const { investor } = req.query;
    if (!investor) return res.json([]);
    const regions = await getInvestorRegions(investor);
    const portfolios = await damlQuery(TEMPLATES.RegionalPortfolio);
    const full = resolveParty(investor);
    const myPortfolios = portfolios.filter(p => (p.payload.allocatedInvestors || []).includes(full));
    res.json(myPortfolios);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/create-portfolio', async (req, res) => {
  try { res.json(await damlCreate(TEMPLATES.RegionalPortfolio, { admin: resolveParty('Admin'), region: req.body.region, description: req.body.description, allocatedInvestors: [] }, partyToken('Admin'))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/allocate-investor-portfolio', async (req, res) => {
  try { res.json(await damlExercise(TEMPLATES.RegionalPortfolio, req.body.contractId, 'AllocateInvestor', { investor: resolveParty(req.body.investorName) }, partyToken('Admin'))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── SPV Projects (no trancheSize/totalFunding) ─
app.get('/api/spv-proposals', async (req, res) => { try { res.json(await damlQuery(TEMPLATES.SPVProposal)); } catch (e) { res.status(500).json({ error: e.message }); } });

app.post('/api/create-spv', async (req, res) => {
  try {
    const d = req.body;
    res.json(await damlCreate(TEMPLATES.SPVProposal, {
      operator: resolveParty('Operator'), admin: resolveParty('Admin'),
      projectId: d.projectId, name: d.name, description: d.description, region: d.region,
      ppaTariff: String(d.ppaTariff), yieldRate: String(d.yieldRate), durationYears: String(d.durationYears),
      capacityMW: String(d.capacityMW || 0), offTakerName: d.offTakerName || '',
      tariffEscalatorPct: String(d.tariffEscalatorPct || 0), totalCapEx: String(d.totalCapEx || 0),
      totalDebt: String(d.totalDebt || 0), devFeePct: String(d.devFeePct || 5),
      mgmtFeePct: String(d.mgmtFeePct || 1), operatorEquityPct: String(d.operatorEquityPct || 40),
      investorHurdleIRR: String(d.investorHurdleIRR || 12), annualOMCost: String(d.annualOMCost || 0)
    }, partyToken('Operator')));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/approve-spv', async (req, res) => {
  try { res.json(await damlExercise(TEMPLATES.SPVProposal, req.body.contractId, 'ApproveSPV', {}, partyToken('Admin'))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Projects — filtered by region → project access
app.get('/api/projects', async (req, res) => {
  try {
    const { investor } = req.query;
    let results = await damlQuery(TEMPLATES.ProjectSPV);
    if (investor) {
      if (!requireKYC(investor)) return res.json([]);
      // Step 1: Check regional portfolio access
      const myRegions = await getInvestorRegions(investor);
      if (myRegions.length === 0) return res.json([]);
      // Step 2: Filter by region
      results = results.filter(r => myRegions.includes(r.payload.region));
      // Step 3: Filter by explicit project access
      const allowedIds = await getInvestorProjectIds(investor);
      results = results.filter(r => allowedIds.includes(r.payload.projectId));
    }
    res.json(results);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/move-lifecycle', async (req, res) => {
  try { res.json(await damlExercise(TEMPLATES.ProjectSPV, req.body.contractId, req.body.action, {}, partyToken('Operator'))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Tranches (dynamic size, linked to project) ─

app.get('/api/tranches', async (req, res) => {
  try {
    const { projectId, investor } = req.query;
    let results = await damlQuery(TEMPLATES.Tranche);
    if (projectId) results = results.filter(r => r.payload.projectId === projectId);
    if (investor) {
      if (!requireKYC(investor)) return res.json([]);
      const full = resolveParty(investor);
      results = results.filter(r => r.payload.investor === full);
    }
    res.json(results);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create tranche with dynamic size — validates: KYC → Region → Project → Single active
app.post('/api/create-tranche', async (req, res) => {
  try {
    const { projectId, projectName, trancheIndex, trancheSize, investorName, region } = req.body;

    // Validate KYC
    if (!requireKYC(investorName)) return res.json({ error: `${investorName} has not completed KYC` });

    // Validate regional access
    const investorRegions = await getInvestorRegions(investorName);
    if (!investorRegions.includes(region)) return res.json({ error: `${investorName} does not have access to region: ${region}` });

    // Validate project access
    const projectIds = await getInvestorProjectIds(investorName);
    if (!projectIds.includes(projectId)) return res.json({ error: `${investorName} does not have access to project: ${projectId}` });

    // Single active investor check
    const existing = await damlQuery(TEMPLATES.Tranche);
    const active = existing.filter(t => t.payload.projectId === projectId && t.payload.status === 'TrancheAllocated');
    if (active.length > 0) return res.json({ error: `Project already has an active tranche (T${active[0].payload.trancheIndex}). One investor at a time.` });

    // Create tranche
    const result = await damlCreate(TEMPLATES.Tranche, {
      admin: resolveParty('Admin'), operator: resolveParty('Operator'), investor: resolveParty(investorName),
      projectId, projectName, region,
      trancheIndex: String(trancheIndex), trancheSize: String(trancheSize),
      investedAmount: "0.0", status: "TrancheAllocated"
    }, partyToken('Admin'));

    // Update project totalCapitalAllocated
    const projects = await damlQuery(TEMPLATES.ProjectSPV);
    const proj = projects.find(p => p.payload.projectId === projectId);
    if (proj) {
      await damlExercise(TEMPLATES.ProjectSPV, proj.contractId, 'RecordTrancheCreated', { trancheSize: String(trancheSize) }, partyToken('Admin'));
    }

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/invest', async (req, res) => {
  try {
    const { contractId, investorName, amount } = req.body;
    if (!requireKYC(investorName)) return res.json({ error: 'KYC not approved' });
    res.json(await damlExercise(TEMPLATES.Tranche, contractId, 'Invest', { amount: String(amount) }, partyToken(investorName)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/complete-tranche', async (req, res) => {
  try {
    const { contractId, investorName } = req.body;
    if (!requireKYC(investorName)) return res.json({ error: 'KYC not approved' });

    // Get tranche info before completing
    const tranches = await damlQuery(TEMPLATES.Tranche);
    const tranche = tranches.find(t => t.contractId === contractId);

    const result = await damlExercise(TEMPLATES.Tranche, contractId, 'CompleteTranche', {}, partyToken(investorName));

    // Update project funded total
    if (tranche) {
      const projects = await damlQuery(TEMPLATES.ProjectSPV);
      const proj = projects.find(p => p.payload.projectId === tranche.payload.projectId);
      if (proj) {
        await damlExercise(TEMPLATES.ProjectSPV, proj.contractId, 'RecordTrancheFunded', { amount: tranche.payload.investedAmount }, partyToken('Admin'));
      }
    }

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Tranche lifecycle (operator moves individual tranches)
app.post('/api/move-tranche-lifecycle', async (req, res) => {
  try {
    const { contractId, action } = req.body;
    res.json(await damlExercise(TEMPLATES.Tranche, contractId, action, {}, partyToken('Operator')));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Investments & Tokens ───────────────────
app.get('/api/investments', async (req, res) => {
  try { let r = await damlQuery(TEMPLATES.CompletedInvestment); if (req.query.investor) { const f = resolveParty(req.query.investor); r = r.filter(x => x.payload.investor === f); } res.json(r); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/tokens', async (req, res) => {
  try { let r = await damlQuery(TEMPLATES.SPVToken); if (req.query.investor) { const f = resolveParty(req.query.investor); r = r.filter(x => x.payload.investor === f); } res.json(r); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Access Control ─────────────────────────
app.get('/api/portfolio-access', async (req, res) => {
  try { let r = await damlQuery(TEMPLATES.PortfolioAccess); if (req.query.investor) { const f = resolveParty(req.query.investor); r = r.filter(x => x.payload.investor === f); } res.json(r); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/grant-access', async (req, res) => {
  try { res.json(await damlCreate(TEMPLATES.PortfolioAccess, { admin: resolveParty('Admin'), investor: resolveParty(req.body.investorName), region: req.body.region, projectIds: req.body.projectIds || [] }, partyToken('Admin'))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Production ─────────────────────────────
app.get('/api/production', async (req, res) => {
  try { let r = await damlQuery(TEMPLATES.ProductionReport); if (req.query.projectId) r = r.filter(x => x.payload.projectId === req.query.projectId); res.json(r); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/update-production', async (req, res) => {
  try {
    const { projectId, reportDate, energyProducedKWh, revenueGenerated, observers } = req.body;
    res.json(await damlCreate(TEMPLATES.ProductionReport, {
      admin: resolveParty('Admin'), operator: resolveParty('Operator'), projectId, reportDate,
      energyProducedKWh: String(energyProducedKWh), revenueGenerated: String(revenueGenerated),
      observers: (observers || []).map(resolveParty)
    }, partyToken('Operator')));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── VDR ────────────────────────────────────
app.get('/api/vdr', async (req, res) => { try { let r = await damlQuery(TEMPLATES.ProjectRegistry); if (req.query.projectId) r = r.filter(x => x.payload.projectId === req.query.projectId); res.json(r); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/create-vdr', async (req, res) => { try { const d = req.body; res.json(await damlCreate(TEMPLATES.ProjectRegistry, { admin: resolveParty('Admin'), operator: resolveParty('Operator'), projectId: d.projectId, offTakerName: d.offTakerName || '', offTakerCreditRating: d.offTakerCreditRating || '', tariffCentsPerKWh: String(d.tariffCentsPerKWh || 0), tariffEscalatorPct: String(d.tariffEscalatorPct || 0), minGuaranteedCapacityMW: String(d.minGuaranteedCapacityMW || 0), liquidatedDamagesPerMW: String(d.liquidatedDamagesPerMW || 0), deemedEnergyEnabled: d.deemedEnergyEnabled || false, ppaTermYears: String(d.ppaTermYears || 25), capacityMW: String(d.capacityMW || 0), epcContractor: d.epcContractor || '', epcMilestones: d.epcMilestones || '', annualOMCost: String(d.annualOMCost || 0), siteRightsVerified: d.siteRightsVerified || false, gridConnectionApproved: d.gridConnectionApproved || false, totalCapEx: String(d.totalCapEx || 0), totalDebt: String(d.totalDebt || 0), taxEquity: String(d.taxEquity || 0), devFeePct: String(d.devFeePct || 5), mgmtFeePct: String(d.mgmtFeePct || 1), operatorEquityPct: String(d.operatorEquityPct || 40), investorHurdleIRR: String(d.investorHurdleIRR || 12), vdrComplete: false, approvedByAdmin: false }, partyToken('Operator'))); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/approve-vdr', async (req, res) => { try { res.json(await damlExercise(TEMPLATES.ProjectRegistry, req.body.contractId, 'ApproveVDR', {}, partyToken('Admin'))); } catch (e) { res.status(500).json({ error: e.message }); } });

// ─── Waterfall ──────────────────────────────
app.get('/api/waterfall', async (req, res) => { try { let r = await damlQuery(TEMPLATES.WaterfallState); if (req.query.projectId) r = r.filter(x => x.payload.projectId === req.query.projectId); if (req.query.investor) { const f = resolveParty(req.query.investor); r = r.filter(x => x.payload.investor === f); } res.json(r); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/create-waterfall', async (req, res) => { try { const d = req.body; res.json(await damlCreate(TEMPLATES.WaterfallState, { admin: resolveParty('Admin'), operator: resolveParty('Operator'), investor: resolveParty(d.investorName), projectId: d.projectId, totalInvested: String(d.totalInvested || 0), totalReturnedToInvestor: "0.0", totalReturnedToOperator: "0.0", devFeePct: String(d.devFeePct || 5), devFeeCollected: "0.0", mgmtFeePct: String(d.mgmtFeePct || 1), mgmtFeeCollected: "0.0", annualOMCost: String(d.annualOMCost || 0), omDeducted: "0.0", debtServiceAnnual: String(d.debtServiceAnnual || 0), debtDeducted: "0.0", hurdleIRRPct: String(d.hurdleIRRPct || 12), currentIRRPct: "0.0", preFlipInvestorPct: String(d.preFlipInvestorPct || 80), postFlipInvestorPct: String(d.postFlipInvestorPct || 20), postFlipOperatorPct: String(d.postFlipOperatorPct || 80), phase: "CapitalRecovery", epochCount: "0", lastSettlementDate: "" }, partyToken('Admin'))); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/settle-revenue', async (req, res) => { try { res.json(await damlExercise(TEMPLATES.WaterfallState, req.body.contractId, 'SettleRevenue', { grossRevenue: String(req.body.grossRevenue), settlementDate: req.body.settlementDate || new Date().toISOString().split('T')[0] }, partyToken('Admin'))); } catch (e) { res.status(500).json({ error: e.message }); } });

// ─── Operator Tokens & Fees ─────────────────
app.get('/api/operator-tokens', async (req, res) => { try { res.json(await damlQuery(TEMPLATES.OperatorToken)); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/mint-operator-token', async (req, res) => { try { res.json(await damlCreate(TEMPLATES.OperatorToken, { admin: resolveParty('Admin'), operator: resolveParty('Operator'), projectId: req.body.projectId, tokenClass: req.body.tokenClass || 'ClassB', ownershipPct: String(req.body.ownershipPct || 40), vestingMilestone: req.body.vestingMilestone || 'COD', vested: false, mintedAt: new Date().toISOString().split('T')[0] }, partyToken('Admin'))); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/vest-operator-token', async (req, res) => { try { res.json(await damlExercise(TEMPLATES.OperatorToken, req.body.contractId, 'VestToken', {}, partyToken('Admin'))); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get('/api/dev-fees', async (req, res) => { try { res.json(await damlQuery(TEMPLATES.DevFeeDisbursement)); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post('/api/disburse-dev-fee', async (req, res) => { try { const amt = (Number(req.body.totalCapEx) * Number(req.body.devFeePct)) / 100; res.json(await damlCreate(TEMPLATES.DevFeeDisbursement, { admin: resolveParty('Admin'), operator: resolveParty('Operator'), projectId: req.body.projectId, totalCapEx: String(req.body.totalCapEx), devFeePct: String(req.body.devFeePct), devFeeAmount: String(amt), disbursedAt: new Date().toISOString().split('T')[0] }, partyToken('Admin'))); } catch (e) { res.status(500).json({ error: e.message }); } });

// ─── Yield Claims ───────────────────────────
app.get('/api/yield-claims', async (req, res) => {
  try {
    let r = await damlQuery(TEMPLATES.ClaimYield);
    if (req.query.investor) { const f = resolveParty(req.query.investor); r = r.filter(x => x.payload.investor === f); }
    if (req.query.projectId) r = r.filter(x => x.payload.projectId === req.query.projectId);
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Admin creates a yield claim for an investor (based on production/waterfall)
app.post('/api/create-yield-claim', async (req, res) => {
  try {
    const { investorName, projectId, claimableAmount } = req.body;
    res.json(await damlCreate(TEMPLATES.ClaimYield, {
      admin: resolveParty('Admin'),
      investor: resolveParty(investorName),
      operator: resolveParty('Operator'),
      projectId,
      claimableAmount: String(claimableAmount),
      claimed: false
    }, partyToken('Admin')));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Investor claims their yield
app.post('/api/claim-yield', async (req, res) => {
  try {
    const { contractId, investorName } = req.body;
    if (!requireKYC(investorName)) return res.json({ error: 'KYC not approved' });
    res.json(await damlExercise(TEMPLATES.ClaimYield, contractId, 'Claim', {}, partyToken(investorName)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Financial Summary (computed off-chain) ─
app.get('/api/financial-summary', async (req, res) => {
  try {
    const { projectId } = req.query;
    const projects = await damlQuery(TEMPLATES.ProjectSPV);
    const proj = projectId ? projects.find(p => p.payload.projectId === projectId) : projects[0];
    if (!proj) return res.json({ error: 'No project found' });

    const p = proj.payload;
    const capEx = Number(p.totalCapEx || 0);
    const debt = Number(p.totalDebt || 0);
    const opEquity = Number(p.operatorEquityPct || 40) / 100;
    const devFeePct = Number(p.devFeePct || 5);
    const mgmtFeePct = Number(p.mgmtFeePct || 1);
    const hurdleIRR = Number(p.investorHurdleIRR || 12);
    const funded = Number(p.totalCapitalFunded || 0);

    const fundingTarget = debt > 0 ? (capEx - debt) / (1 - opEquity) : capEx / (1 - opEquity);
    const devFeeAmount = capEx * devFeePct / 100;
    const devFeeCollected = Number(p.devFeeCollected || 0);
    const investorTokensValue = funded;
    const operatorEquityValue = funded > 0 ? (funded * opEquity / (1 - opEquity)) : 0;
    const investorOwnershipPct = funded > 0 ? ((1 - opEquity) * 100) : 0;

    // Get waterfall states for this project
    const waterfalls = await damlQuery(TEMPLATES.WaterfallState);
    const projWaterfalls = waterfalls.filter(w => w.payload.projectId === p.projectId);
    const totalReturnedInv = projWaterfalls.reduce((s, w) => s + Number(w.payload.totalReturnedToInvestor), 0);
    const totalReturnedOp = projWaterfalls.reduce((s, w) => s + Number(w.payload.totalReturnedToOperator), 0);
    const totalMgmtFees = projWaterfalls.reduce((s, w) => s + Number(w.payload.mgmtFeeCollected), 0);
    const currentPhase = projWaterfalls.length > 0 ? projWaterfalls[0].payload.phase : 'Not Started';
    const currentIRR = projWaterfalls.length > 0 ? Number(projWaterfalls[0].payload.currentIRRPct) : 0;

    // Get operator tokens
    const opTokens = await damlQuery(TEMPLATES.OperatorToken);
    const projOpTokens = opTokens.filter(t => t.payload.projectId === p.projectId);

    // Get dev fees
    const devFees = await damlQuery(TEMPLATES.DevFeeDisbursement);
    const projDevFees = devFees.filter(d => d.payload.projectId === p.projectId);
    const totalDevFeeDisbursed = projDevFees.reduce((s, d) => s + Number(d.payload.devFeeAmount), 0);

    // Production revenue
    const production = await damlQuery(TEMPLATES.ProductionReport);
    const projProduction = production.filter(r => r.payload.projectId === p.projectId);
    const totalRevenue = projProduction.reduce((s, r) => s + Number(r.payload.revenueGenerated), 0);
    const totalEnergy = projProduction.reduce((s, r) => s + Number(r.payload.energyProducedKWh), 0);

    res.json({
      projectId: p.projectId,
      projectName: p.name,
      // CapEx & Funding
      totalCapEx: capEx,
      totalDebt: debt,
      fundingTarget,
      totalFunded: funded,
      fundingPct: fundingTarget > 0 ? (funded / fundingTarget * 100) : 0,
      // Dev Fee
      devFeePct,
      devFeeAmount,
      devFeeCollected,
      devFeeDisbursed: totalDevFeeDisbursed,
      // Mgmt Fee
      mgmtFeePct,
      totalMgmtFees,
      // Equity Structure
      operatorEquityPct: opEquity * 100,
      investorEquityPct: (1 - opEquity) * 100,
      operatorEquityValue,
      investorTokensValue,
      investorOwnershipPct,
      // Waterfall
      currentPhase,
      hurdleIRR,
      currentIRR,
      totalReturnedToInvestor: totalReturnedInv,
      totalReturnedToOperator: totalReturnedOp,
      // Waterfall levels
      waterfallLevels: [
        { level: 1, name: 'OpEx / O&M', annual: Number(p.annualOMCost || 0) },
        { level: 2, name: 'Debt Service', annual: Number(p.totalDebt || 0) * 0.06 },
        { level: 3, name: 'Mgmt Fee', pct: mgmtFeePct, collected: totalMgmtFees },
        { level: 4, name: 'Investor Preferred', pct: hurdleIRR, phase: currentIRR < hurdleIRR ? 'Active' : 'Cleared' },
        { level: 5, name: 'Sponsor Flip', split: `${opEquity * 100}% Op / ${(1-opEquity)*100}% Inv`, phase: currentIRR >= hurdleIRR ? 'Active' : 'Pending' },
      ],
      // Operator Tokens
      operatorTokens: projOpTokens.map(t => ({ tokenClass: t.payload.tokenClass, ownershipPct: t.payload.ownershipPct, milestone: t.payload.vestingMilestone, vested: t.payload.vested })),
      // Production
      totalRevenue,
      totalEnergy,
      productionReports: projProduction.length,
      // Computed
      annualOMCost: Number(p.annualOMCost || 0),
      ppaTariff: Number(p.ppaTariff || 0),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Startup ────────────────────────────────
async function start() {
  console.log('\n  🔆 Sawa-X Backend v2');
  console.log('  ─────────────────────');
  let ok = false;
  for (let i = 0; i < 5; i++) { ok = discoverParties(); if (ok) break; console.log(`  Retrying... (${i+1}/5)`); await new Promise(r => setTimeout(r, 3000)); }
  discoverPackageHash();
  app.listen(PORT, () => {
    console.log(`  Listening:  http://localhost:${PORT}`);
    console.log(`  Package:    ${PKG ? PKG.slice(0, 20) + '...' : 'NOT FOUND'}`);
    console.log(`  Parties:    ${Object.keys(PARTIES).join(', ') || 'none'}`);
    console.log('  ─────────────────────\n');
  });
}
start();
