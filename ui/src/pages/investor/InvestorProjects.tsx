import React, { useEffect, useState } from 'react';
import { Lock, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { SPVStateBadge } from '../../components/Badge';
import { queryContracts, createContract, exerciseChoice, TMPL } from '../../api/ledger';
import { useApp, fullPartyId } from '../../context/AppContext';

export default function InvestorProjects() {
  const { addToast, triggerRefresh, refresh, partyId, partyName, hash } = useApp();

  const OPERATOR_PARTY = fullPartyId('Operator', hash);
  const SPV_PARTY      = fullPartyId('SPV_METALEX', hash);

  const [myApproval,  setMyApproval]  = useState<any | null>(null);
  const [projects,    setProjects]    = useState<any[]>([]);
  const [portfolios,  setPortfolios]  = useState<any[]>([]);
  const [registries,  setRegistries]  = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showInvest,  setShowInvest]  = useState<any | null>(null);
  const [invForm,     setInvForm]     = useState({ tokens: '10000', usdcx: '10000' });

  useEffect(() => {
    if (!hash) return;
    setLoading(true);
    Promise.all([
      queryContracts('Investor', TMPL.AccessApproval),
      queryContracts('Investor', TMPL.ProjectSPV),
      queryContracts('Investor', TMPL.RegionalPortfolio),
      queryContracts('Investor', TMPL.SPVTokenRegistry),
    ]).then(([approvals, projs, ports, regs]) => {
      setMyApproval(approvals.find(a => a.payload.investor === partyId) ?? null);
      setProjects(projs);
      setPortfolios(ports);
      setRegistries(regs);
    })
      .catch(e => addToast('error', e.message))
      .finally(() => setLoading(false));
  }, [refresh, partyId, hash]);

  // Projects visible to this investor:
  // 1. Investor must have AccessApproval
  // 2. Project must be in a portfolio where this investor is authorized
  // 3. Project state must be FundingOpen, Funded, or Operational
  const visibleProjects = (() => {
    if (!myApproval) return [];

    // Find portfolios where this investor is authorized
    const myPortfolios = portfolios.filter(p =>
      p.payload.authorizedInvestors?.includes(partyId)
    );

    // Get all project IDs in those portfolios
    const authorizedProjectIds = new Set(
      myPortfolios.flatMap((p: any) => p.payload.projects ?? [])
    );

    return projects.filter(p =>
      authorizedProjectIds.has(p.payload.projectId) &&
      ['FundingOpen', 'Funded', 'Operational'].includes(p.payload.state)
    );
  })();

  const handleInvest = async (p: any) => {
    try {
      const reqCid = await createContract('Investor', TMPL.InvestmentRequest, {
        investor:        partyId,
        operator:        OPERATOR_PARTY,
        spvParty:        SPV_PARTY,
        projectId:       p.payload.projectId,
        tokenSymbol:     p.payload.tokenSymbol,
        usdcxHoldingCid: `holding-${partyName}-${Date.now()}`,
        requestedTokens: invForm.tokens,
        usdcxAmount:     invForm.usdcx,
      });

      const reg = registries.find(r => r.payload.projectId === p.payload.projectId);
      if (!reg) throw new Error('Token registry not found');

      await exerciseChoice('Operator', TMPL.InvestmentRequest, reqCid, 'Accept', {
        registryCid: reg.contractId,
        projectCid:  p.contractId,
      });

      addToast('success',
        `${partyName} invested ${invForm.tokens} ${p.payload.tokenSymbol} tokens`
      );
      setShowInvest(null);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title={`Projects — ${partyName}`} subtitle="View available investment opportunities" />
        <div className="px-6">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50
            border border-slate-700 rounded-lg px-3 py-2 w-fit">
            <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent
              rounded-full animate-spin" />
            Loading ledger state for {partyName}…
          </div>
        </div>
      </div>
    );
  }

  if (!myApproval) {
    return (
      <div>
        <PageHeader title={`Projects — ${partyName}`} subtitle="View available investment opportunities" />
        <div className="px-6 pb-6 space-y-4">
          {/* Investor indicator */}
          <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700
            rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center
              justify-center text-slate-300 text-sm font-bold">
              {partyName.replace('Investor', 'I')}
            </div>
            <p className="text-sm text-slate-300">Acting as <strong>{partyName}</strong></p>
          </div>
          <div className="card p-12 text-center">
            <Lock size={40} className="mx-auto text-slate-700 mb-4" />
            <p className="text-white font-medium mb-1">Access Required for {partyName}</p>
            <p className="text-sm text-slate-400 mb-2">
              No AccessApproval found on ledger for this investor.
            </p>
            <p className="text-xs text-slate-500">
              Go to <strong className="text-slate-300">Request Access</strong>,
              submit KYC and access request, then ask Admin to approve.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Projects — ${partyName}`}
        subtitle={`Region: ${myApproval.payload.region} · ${visibleProjects.length} project(s) available`}
      />
      <div className="px-6 pb-6 space-y-4">

        {/* Investor + access banner */}
        <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-800/40
          rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center
            justify-center text-emerald-300 text-sm font-bold">
            {partyName.replace('Investor', 'I')}
          </div>
          <div>
            <p className="text-sm text-emerald-300 font-medium">
              🔓 {partyName} — Access Granted
            </p>
            <p className="text-xs text-slate-400">
              Region: {myApproval.payload.region}
            </p>
          </div>
        </div>

        {visibleProjects.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-slate-400 text-sm">
              No open projects in your authorized portfolios yet.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Projects appear here once: (1) Admin creates a portfolio for your region,
              (2) Admin adds you as investor, (3) Operator opens funding.
            </p>
          </div>
        ) : visibleProjects.map(p => {
          const reg   = registries.find(r => r.payload.projectId === p.payload.projectId);
          const myBal = (reg?.payload.holdings ?? [])
            .find((h: any) => h._1 === partyId)?._2 ?? 0;
          const pct   = Number(p.payload.fundingTarget) > 0
            ? (Number(p.payload.fundingRaised) / Number(p.payload.fundingTarget)) * 100 : 0;

          return (
            <div key={p.contractId} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-bold text-white">{p.payload.projectName}</h3>
                    <SPVStateBadge state={p.payload.state} />
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      ['Capacity',     `${p.payload.capacityMW} MW`],
                      ['PPA Tariff',   `$${p.payload.ppaTariff}/kWh`],
                      ['Token Symbol', p.payload.tokenSymbol],
                      ['Token Price',  `$${p.payload.tokenPrice}`],
                      ['Tranche',      p.payload.trancheNumber?.Some ?? p.payload.trancheNumber ?? '—'],
                      ['Region',       p.payload.region],
                    ].map(([k, v]) => (
                      <div key={k as string} className="bg-slate-800/50 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-500">{k}</p>
                        <p className="text-xs text-white font-medium">{v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Funding Progress</span>
                      <span>
                        ${Number(p.payload.fundingRaised).toLocaleString()} /
                        ${Number(p.payload.fundingTarget).toLocaleString()} ({Math.round(pct)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400
                        rounded-full transition-all"
                        style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>

                  {reg && (
                    <div className="text-xs text-slate-500">
                      Total Supply:
                      <span className="text-slate-300 ml-1">
                        {Number(reg.payload.totalSupply).toLocaleString()} {p.payload.tokenSymbol}
                      </span>
                      {Number(myBal) > 0 && (
                        <span className="ml-4 text-emerald-400 font-medium">
                          {partyName} Holdings: {Number(myBal).toLocaleString()} tokens
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {p.payload.state === 'FundingOpen' && (
                  <button onClick={() => setShowInvest(p)} className="btn-primary flex-shrink-0">
                    <TrendingUp size={14} /> Invest
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showInvest && (
        <Modal title={`${partyName} — Invest in ${showInvest.payload.projectName}`}
          onClose={() => setShowInvest(null)}>
          <div className="space-y-4">
            <div className="bg-slate-800/60 rounded-xl p-3 text-xs text-slate-400 space-y-1">
              <p>Investor: <span className="text-emerald-300">{partyName}</span></p>
              <p>Token: <span className="text-white">{showInvest.payload.tokenSymbol}</span>
                @ ${showInvest.payload.tokenPrice} each</p>
              <p>Remaining: <span className="text-emerald-400">
                ${(Number(showInvest.payload.fundingTarget) -
                  Number(showInvest.payload.fundingRaised)).toLocaleString()}
              </span></p>
            </div>
            <div>
              <label className="label">Tokens to Purchase</label>
              <input className="input" type="number" value={invForm.tokens}
                onChange={e => setInvForm(f => ({ ...f, tokens: e.target.value, usdcx: e.target.value }))} />
            </div>
            <div>
              <label className="label">USDCx Amount</label>
              <input className="input" type="number" value={invForm.usdcx}
                onChange={e => setInvForm(f => ({ ...f, usdcx: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button className="btn-secondary" onClick={() => setShowInvest(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => handleInvest(showInvest)}>
                Confirm — {partyName}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}