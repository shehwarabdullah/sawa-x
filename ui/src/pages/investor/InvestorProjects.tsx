import React, { useEffect, useState } from 'react';
import { Lock, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { SPVStateBadge } from '../../components/Badge';
import { queryContracts, createContract, exerciseChoice, TMPL } from '../../api/ledger';
import { useApp } from '../../context/AppContext';

const INVESTOR_PARTY = 'Investor::1220e8d65081ace02e5f0a6781151f7990ffab43114dea256334e19b87cfb8b52f31';
const OPERATOR_PARTY = 'Operator::1220e8d65081ace02e5f0a6781151f7990ffab43114dea256334e19b87cfb8b52f31';
const SPV_PARTY      = 'SPV_METALEX::1220e8d65081ace02e5f0a6781151f7990ffab43114dea256334e19b87cfb8b52f31';

export default function InvestorProjects() {
  const { addToast, triggerRefresh, refresh } = useApp();

  const [myApproval,  setMyApproval]  = useState<any | null>(null);
  const [projects,    setProjects]    = useState<any[]>([]);
  const [registries,  setRegistries]  = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showInvest,  setShowInvest]  = useState<any | null>(null);
  const [invForm,     setInvForm]     = useState({ tokens: '10000', usdcx: '10000' });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      queryContracts('Investor', TMPL.AccessApproval),
      queryContracts('Investor', TMPL.ProjectSPV),
      queryContracts('Investor', TMPL.SPVTokenRegistry),
    ]).then(([approvals, projs, regs]) => {
      setMyApproval(approvals.find(a => a.payload.investor === INVESTOR_PARTY) ?? null);
      setProjects(projs);
      setRegistries(regs);
    })
      .catch(e => addToast('error', e.message))
      .finally(() => setLoading(false));
  }, [refresh]);

  const visibleProjects = myApproval
    ? projects.filter(p =>
        p.payload.region === myApproval.payload.region &&
        ['FundingOpen', 'Funded', 'Operational'].includes(p.payload.state)
      )
    : [];

  const handleInvest = async (p: any) => {
    try {
      // Create investment request
      const reqCid = await createContract('Investor', TMPL.InvestmentRequest, {
        investor:        INVESTOR_PARTY,
        operator:        OPERATOR_PARTY,
        spvParty:        SPV_PARTY,
        projectId:       p.payload.projectId,
        tokenSymbol:     p.payload.tokenSymbol,
        usdcxHoldingCid: `holding-${Date.now()}`,
        requestedTokens: invForm.tokens,
        usdcxAmount:     invForm.usdcx,
      });

      // Find registry
      const reg = registries.find(r => r.payload.projectId === p.payload.projectId);
      if (!reg) throw new Error('Token registry not found for project');

      // Operator accepts immediately (demo auto-accept)
      await exerciseChoice('Operator', TMPL.InvestmentRequest, reqCid, 'Accept', {
        registryCid: reg.contractId,
        projectCid:  p.contractId,
      });

      addToast('success', `Invested ${invForm.tokens} ${p.payload.tokenSymbol} tokens on ledger`);
      setShowInvest(null);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Projects" subtitle="View available investment opportunities" />
        <div className="px-6">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50
            border border-slate-700 rounded-lg px-3 py-2 w-fit">
            <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent
              rounded-full animate-spin" />
            Loading from Canton ledger…
          </div>
        </div>
      </div>
    );
  }

  if (!myApproval) {
    return (
      <div>
        <PageHeader title="Projects" subtitle="View available investment opportunities" />
        <div className="px-6 pb-6">
          <div className="card p-12 text-center">
            <Lock size={40} className="mx-auto text-slate-700 mb-4" />
            <p className="text-white font-medium mb-1">Access Required</p>
            <p className="text-sm text-slate-400 mb-4">
              No AccessApproval contract found on ledger for your party.
            </p>
            <p className="text-xs text-slate-500">
              Go to <strong className="text-slate-300">Request Access</strong> tab,
              submit a request, then ask Admin to approve it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`Viewing projects in region: ${myApproval.payload.region}`}
      />
      <div className="px-6 pb-6 space-y-4">

        {/* Access proof banner */}
        <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-800/40
          rounded-xl px-4 py-3">
          <span className="text-emerald-400 text-lg">🔓</span>
          <div>
            <p className="text-sm text-emerald-300 font-medium">
              Access Granted on Canton Ledger
            </p>
            <p className="text-xs text-slate-400">
              Region: {myApproval.payload.region} ·
              cid: {myApproval.contractId.slice(0, 24)}…
            </p>
          </div>
        </div>

        {visibleProjects.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-slate-400 text-sm">
              No open projects in {myApproval.payload.region} yet.
            </p>
          </div>
        ) : visibleProjects.map(p => {
          const reg    = registries.find(r => r.payload.projectId === p.payload.projectId);
         const myBal = (reg?.payload.holdings ?? [])
  .find((h: any) => h._1 === INVESTOR_PARTY)?._2 ?? 0;
          const pct    = Number(p.payload.fundingTarget) > 0
            ? (Number(p.payload.fundingRaised) / Number(p.payload.fundingTarget)) * 100
            : 0;

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
                      <div key={k} className="bg-slate-800/50 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-500">{k}</p>
                        <p className="text-xs text-white font-medium">{v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Funding bar */}
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
                        <span className="ml-4 text-emerald-400">
                          My Holdings: {Number(myBal).toLocaleString()} tokens
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

      {/* Invest Modal */}
      {showInvest && (
        <Modal title={`Invest in ${showInvest.payload.projectName}`}
          onClose={() => setShowInvest(null)}>
          <div className="space-y-4">
            <div className="bg-slate-800/60 rounded-xl p-3 text-xs text-slate-400 space-y-1">
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
              <p className="text-xs text-slate-500 mt-1">
                Creates InvestmentRequest → auto-accepted by Operator on ledger
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button className="btn-secondary" onClick={() => setShowInvest(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => handleInvest(showInvest)}>
                Confirm on Ledger
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
