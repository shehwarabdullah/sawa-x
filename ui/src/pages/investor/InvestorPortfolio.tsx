import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { queryContracts, exerciseChoice, TMPL } from '../../api/ledger';
import { useApp } from '../../context/AppContext';

const INVESTOR_PARTY = 'Investor::1220e8d65081ace02e5f0a6781151f7990ffab43114dea256334e19b87cfb8b52f31';

export default function InvestorPortfolio() {
  const { addToast, triggerRefresh, refresh } = useApp();

  const [tokens,     setTokens]     = useState<any[]>([]);
  const [yields,     setYields]     = useState<any[]>([]);
  const [registries, setRegistries] = useState<any[]>([]);
  const [projects,   setProjects]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      queryContracts('Investor', TMPL.SPVToken),
      queryContracts('Investor', TMPL.ClaimableYield),
      queryContracts('Investor', TMPL.SPVTokenRegistry),
      queryContracts('Investor', TMPL.ProjectSPV),
    ]).then(([toks, ylds, regs, projs]) => {
      setTokens(toks.filter(t => t.payload.owner === INVESTOR_PARTY));
      setYields(ylds.filter(y => y.payload.investor === INVESTOR_PARTY));
      setRegistries(regs);
      setProjects(projs);
    })
      .catch(e => addToast('error', e.message))
      .finally(() => setLoading(false));
  }, [refresh]);

  const claimYield = async (contractId: string) => {
    try {
      await exerciseChoice('Investor', TMPL.ClaimableYield, contractId, 'Claim', {});
      addToast('success', 'Yield claimed — CIP-56 USDCx transfer triggered in production');
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  const totalTokens = tokens.reduce((s, t) => s + Number(t.payload.amount), 0);
  const totalYield  = yields.reduce((s, y) => s + Number(y.payload.amount), 0);

  return (
    <div>
      <PageHeader title="My Portfolio" subtitle="SPV token holdings and claimable yield on Canton" />
      <div className="px-6 pb-6 space-y-6">

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50
            border border-slate-700 rounded-lg px-3 py-2 w-fit">
            <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent
              rounded-full animate-spin" />
            Loading from Canton ledger…
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <p className="label">Total Tokens Held</p>
            <p className="text-2xl font-bold text-white">{totalTokens.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">
              Across {tokens.length} SPV token contract(s)
            </p>
          </div>
          <div className="card p-4">
            <p className="label">Claimable Yield</p>
            <p className="text-2xl font-bold text-emerald-400">${totalYield.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">USDCx equivalent</p>
          </div>
        </div>

        {tokens.length > 0 && (
          <div className="card">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">
                Token Holdings ({tokens.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-800">
              {tokens.map(t => {
                const proj    = projects.find(p => p.payload.projectId === t.payload.projectId);
                const reg     = registries.find(r => r.payload.projectId === t.payload.projectId);
                const total   = Number(reg?.payload.totalSupply ?? 0);
                const pct     = total > 0 ? (Number(t.payload.amount) / total) * 100 : 0;

                return (
                  <div key={t.contractId} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {proj?.payload.projectName ?? t.payload.projectId}
                        </p>
                        <p className="text-xs text-slate-500">
                          {t.payload.projectId} · {proj?.payload.region}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">
                          {Number(t.payload.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">{t.payload.symbol} tokens</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-500">Token Value</p>
                        <p className="text-xs text-white font-medium">
                          ${(Number(proj?.payload.tokenPrice ?? 1) *
                            Number(t.payload.amount)).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-500">% of Pool</p>
                        <p className="text-xs text-white font-medium">{pct.toFixed(2)}%</p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                        <p className="text-xs text-slate-500">Project State</p>
                        <p className="text-xs text-white font-medium">
                          {proj?.payload.state ?? '—'}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-2 font-mono">
                      SPVToken cid: {t.contractId.slice(0, 24)}…
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {totalTokens === 0 && !loading && (
          <div className="card p-10 text-center">
            <p className="text-slate-400 text-sm">No token holdings on ledger yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Invest in an open project under the Projects tab.
            </p>
          </div>
        )}

        {yields.length > 0 && (
          <div className="card">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">
                Claimable Yield ({yields.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-800">
              {yields.map(y => (
                <div key={y.contractId} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{y.payload.projectId}</p>
                    <p className="text-xs text-slate-500">Period ending {y.payload.periodEnd}</p>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">
                      cid: {y.contractId.slice(0, 24)}…
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-emerald-400">
                      ${Number(y.payload.amount).toFixed(2)}
                    </p>
                    <button onClick={() => claimYield(y.contractId)} className="btn-primary">
                      <Zap size={14} /> Claim USDCx
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}