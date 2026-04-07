import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/backend';
import { RefreshCw, ArrowDown, Lock, TrendingUp } from 'lucide-react';

const phaseLabels: Record<string, string> = {
  CapitalRecovery: 'Capital Recovery — 100% to you', PreferredReturn: 'Preferred Return — 80% to you',
  CatchUpFlip: 'Sponsor Flip — Operator takes majority', 'Not Started': 'Not Started'
};
const phaseColors: Record<string, string> = {
  CapitalRecovery: 'bg-yellow-500/20 text-yellow-400 border-yellow-800', PreferredReturn: 'bg-blue-500/20 text-blue-400 border-blue-800',
  CatchUpFlip: 'bg-purple-500/20 text-purple-400 border-purple-800', 'Not Started': 'bg-gray-700 text-gray-400 border-gray-700'
};

export default function InvestorWaterfall() {
  const { partyName, kycStatus } = useApp();
  const [projects, setProjects] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [waterfalls, setWaterfalls] = useState<any[]>([]);
  const [selProject, setSelProject] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const p = await api.getProjects(partyName);
      setProjects(p);
      const wf = await api.getWaterfall(undefined, partyName);
      setWaterfalls(wf);
      if (p.length > 0) {
        const pid = selProject || p[0].payload.projectId;
        setSelProject(pid);
        setSummary(await api.getFinancialSummary(pid));
      }
    } catch {}
    setLoading(false);
  };

  const switchProject = async (pid: string) => {
    setSelProject(pid);
    try { setSummary(await api.getFinancialSummary(pid)); } catch {}
  };

  useEffect(() => { if (kycStatus === 'approved') load(); }, [partyName, kycStatus]);

  if (kycStatus !== 'approved') return (
    <div><h1 className="text-2xl font-bold text-white mb-6">Revenue Waterfall</h1>
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-8 max-w-lg">
        <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-4" /><p className="text-gray-400">Complete KYC to view waterfall.</p>
      </div></div>
  );

  const s = summary || {};
  const myWaterfalls = waterfalls.filter((w: any) => w.payload.projectId === selProject);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue Waterfall</h1>
          <p className="text-gray-500 text-sm">How project revenue flows to you through the settlement waterfall</p>
        </div>
        <div className="flex items-center gap-3">
          {projects.length > 1 && (
            <select value={selProject} onChange={e => switchProject(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
              {projects.map((p: any) => <option key={p.payload.projectId} value={p.payload.projectId}>{p.payload.name}</option>)}
            </select>
          )}
          <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
        </div>
      </div>

      {loading ? <p className="text-gray-500">Loading...</p> : !s.projectId ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">No Waterfall Data</h3>
          <p className="text-gray-500 text-sm">Waterfall settlement begins once the project generates revenue.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Phase Banner */}
          <div className={`rounded-xl p-6 border ${phaseColors[s.currentPhase] || phaseColors['Not Started']}`}>
            <div className="text-sm opacity-75 mb-1">Current Settlement Phase</div>
            <div className="text-xl font-bold">{phaseLabels[s.currentPhase] || s.currentPhase}</div>
            <div className="flex gap-6 mt-3 text-sm">
              <span>Your IRR: <strong>{s.currentIRR?.toFixed(1)}%</strong></span>
              <span>Hurdle: <strong>{s.hurdleIRR}%</strong></span>
              <span>Your Share: <strong>{s.investorEquityPct}%</strong></span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-gray-500 text-xs">Total Invested</div>
              <div className="text-2xl font-bold text-white">${s.totalFunded?.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-gray-500 text-xs">Total Returned to You</div>
              <div className="text-2xl font-bold text-green-400">${s.totalReturnedToInvestor?.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-gray-500 text-xs">Your Ownership</div>
              <div className="text-2xl font-bold text-white">{s.investorOwnershipPct?.toFixed(0) || '0'}%</div>
              <div className="text-gray-500 text-xs">Class A Tokens</div>
            </div>
          </div>

          {/* Waterfall Visual */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">How Revenue Flows</h3>
            <div className="space-y-1">
              {(s.waterfallLevels || []).map((l: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 flex justify-center">
                    {i > 0 && <ArrowDown size={14} className="text-gray-600" />}
                  </div>
                  <div className={`flex-1 p-3 rounded-lg border ${
                    l.phase === 'Active' ? 'bg-green-500/10 border-green-800' : l.phase === 'Cleared' ? 'bg-blue-500/10 border-blue-800' : 'bg-gray-800/50 border-gray-700'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-white text-sm font-medium">Level {l.level}: {l.name}</span>
                        {l.pct != null && <span className="text-gray-500 text-xs ml-2">({l.pct}%)</span>}
                        {l.split && <span className="text-gray-500 text-xs ml-2">{l.split}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {l.collected != null && <span className="text-gray-400 text-xs">${l.collected.toLocaleString()}</span>}
                        {l.phase && <span className={`text-xs px-2 py-0.5 rounded ${l.phase === 'Active' ? 'bg-green-500/20 text-green-400' : l.phase === 'Cleared' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>{l.phase}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-gray-800/30 rounded-lg p-3 text-xs text-gray-500">
              Revenue passes through each level sequentially. Once your IRR reaches {s.hurdleIRR}%, the split "flips" — the operator receives the majority share for the remainder of the project life.
            </div>
          </div>

          {/* My Settlement History */}
          {myWaterfalls.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3">Your Settlement State</h3>
              {myWaterfalls.map((w: any) => (
                <div key={w.contractId} className="space-y-2 text-sm">
                  <div className="grid grid-cols-4 gap-4">
                    <div><span className="text-gray-500 text-xs">Invested</span><div className="text-white">${Number(w.payload.totalInvested).toLocaleString()}</div></div>
                    <div><span className="text-gray-500 text-xs">Returned</span><div className="text-green-400">${Number(w.payload.totalReturnedToInvestor).toLocaleString()}</div></div>
                    <div><span className="text-gray-500 text-xs">IRR</span><div className="text-white">{Number(w.payload.currentIRRPct).toFixed(1)}%</div></div>
                    <div><span className="text-gray-500 text-xs">Epochs</span><div className="text-white">{w.payload.epochCount}</div></div>
                  </div>
                  {w.payload.lastSettlementDate && (
                    <div className="text-gray-500 text-xs">Last settlement: {w.payload.lastSettlementDate}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
