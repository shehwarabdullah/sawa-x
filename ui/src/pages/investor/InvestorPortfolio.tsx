import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { queryContracts, exerciseChoice, TMPL } from '../../api/ledger';
import { useApp } from '../../context/AppContext';

export default function InvestorPortfolio() {
  const { addToast, triggerRefresh, refresh, partyId, partyName, hash } = useApp();

  const [tokens,     setTokens]     = useState<any[]>([]);
  const [yields,     setYields]     = useState<any[]>([]);
  const [registries, setRegistries] = useState<any[]>([]);
  const [projects,   setProjects]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!hash) return;
    setLoading(true);
    Promise.all([
      queryContracts('Investor', TMPL.SPVToken),
      queryContracts('Investor', TMPL.ClaimableYield),
      queryContracts('Investor', TMPL.SPVTokenRegistry),
      queryContracts('Investor', TMPL.ProjectSPV),
    ]).then(([toks, ylds, regs, projs]) => {
      // Filter to current investor's holdings
      setTokens(toks.filter(t => t.payload.owner === partyId));
      setYields(ylds.filter(y => y.payload.investor === partyId));
      setRegistries(regs);
      setProjects(projs);
    })
      .catch(e => addToast('error', e.message))
      .finally(() => setLoading(false));
  }, [refresh, partyId, hash]);

  const claimYield = async (contractId: string) => {
    try {
      await exerciseChoice('Investor', TMPL.ClaimableYield, contractId, 'Claim', {});
      addToast('success', `${partyName} yield claimed`);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  const totalTokens = tokens.reduce((s, t) => s + Number(t.payload.amount), 0);
  const totalYield  = yields.reduce((s, y) => s + Number(y.payload.amount), 0);

  return (
    <div>
      <PageHeader
        title={`My Portfolio — ${partyName}`}
        subtitle="SPV token holdings and claimable yield on Canton"
      />
      <div className="px-6 pb-6 space-y-6">

        {/* Investor indicator */}
        <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700
          rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center
            justify-center text-emerald-300 text-sm font-bold">
            {partyName.replace('Investor', 'I')}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{partyName}</p>
            <p className="text-xs text-slate-500 font-mono">{partyId.slice(0, 30)}…</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50
            border border-slate-700 rounded-lg px-3 py-2 w-fit">
            <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent
              rounded-full animate-spin" />
            Loading portfolio for {partyName}…
          </div>
        )}

        {/* Summary */}
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

        {/* Token Holdings */}
        {tokens.length > 0 && (
          <div className="card">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">
                Token Holdings ({tokens.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-800">
              {tokens.map(t => {
                const proj  = projects.find(p => p.payload.projectId === t.payload.projectId);
                const reg   = registries.find(r => r.payload.projectId === t.payload.projectId);
                const total = Number(reg?.payload.totalSupply ?? 0);
                const pct   = total > 0 ? (Number(t.payload.amount) / total) * 100 : 0;

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
                        <p className="text-xs text-slate-500">State</p>
                        <p className="text-xs text-white font-medium">
                          {proj?.payload.state ?? '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {totalTokens === 0 && !loading && (
          <div className="card p-10 text-center">
            <p className="text-slate-400 text-sm">{partyName} holds no tokens yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Invest in an open project under the Projects tab.
            </p>
          </div>
        )}

        {/* Claimable Yields */}
        {yields.length > 0 && (
          <div className="card">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">
                Claimable Yield ({yields.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-800">
              {yields.map(y => (
                <div key={y.contractId}
                  className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{y.payload.projectId}</p>
                    <p className="text-xs text-slate-500">Period ending {y.payload.periodEnd}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-emerald-400">
                      ${Number(y.payload.amount).toFixed(2)}
                    </p>
                    <button onClick={() => claimYield(y.contractId)} className="btn-primary">
                      <Zap size={14} /> Claim
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