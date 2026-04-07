import React, { useEffect, useState } from 'react';
import { api } from '../../api/backend';
import { RefreshCw, DollarSign, TrendingUp, Coins, BarChart3, ArrowDown } from 'lucide-react';

const phaseColors: Record<string, string> = {
  CapitalRecovery: 'text-yellow-400', PreferredReturn: 'text-blue-400', CatchUpFlip: 'text-green-400', 'Not Started': 'text-gray-400'
};

export default function OperatorFinancials() {
  const [projects, setProjects] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selProject, setSelProject] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const p = await api.getProjects();
      setProjects(p);
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

  useEffect(() => { load(); }, []);

  if (loading || !summary) return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Financial Dashboard</h1>
      <p className="text-gray-500">{loading ? 'Loading...' : 'No projects found'}</p>
    </div>
  );

  const s = summary;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Dashboard</h1>
          <p className="text-gray-500 text-sm">Dev fees, management fees, carry structure, waterfall position</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selProject} onChange={e => switchProject(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
            {projects.map((p: any) => <option key={p.payload.projectId} value={p.payload.projectId}>{p.payload.name}</option>)}
          </select>
          <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
        </div>
      </div>

      {/* Top-Level Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-green-400 mb-2"><DollarSign size={18} /> Dev Fee</div>
          <div className="text-2xl font-bold text-white">${s.devFeeDisbursed?.toLocaleString() || '0'}</div>
          <div className="text-gray-500 text-xs">{s.devFeePct}% of ${s.totalCapEx?.toLocaleString()} CapEx</div>
          <div className="text-gray-600 text-xs">Target: ${s.devFeeAmount?.toLocaleString()}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-blue-400 mb-2"><BarChart3 size={18} /> Mgmt Fees</div>
          <div className="text-2xl font-bold text-white">${s.totalMgmtFees?.toLocaleString() || '0'}</div>
          <div className="text-gray-500 text-xs">{s.mgmtFeePct}% of gross revenue (top of waterfall)</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-purple-400 mb-2"><Coins size={18} /> Carry Received</div>
          <div className="text-2xl font-bold text-white">${s.totalReturnedToOperator?.toLocaleString() || '0'}</div>
          <div className="text-gray-500 text-xs">From waterfall distributions</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-yellow-400 mb-2"><TrendingUp size={18} /> Revenue</div>
          <div className="text-2xl font-bold text-white">${s.totalRevenue?.toLocaleString() || '0'}</div>
          <div className="text-gray-500 text-xs">{s.totalEnergy?.toLocaleString()} kWh produced</div>
        </div>
      </div>

      {/* Equity Structure */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Equity Structure</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-purple-400">Operator (Class B)</span>
                <span className="text-white">{s.operatorEquityPct}%</span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${s.operatorEquityPct}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-400">Investor (Class A)</span>
                <span className="text-white">{s.investorEquityPct}%</span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: `${s.investorEquityPct}%` }} /></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div><span className="text-gray-500 text-xs">Operator Equity Value</span><div className="text-purple-400">${s.operatorEquityValue?.toLocaleString()}</div></div>
            <div><span className="text-gray-500 text-xs">Investor Token Value</span><div className="text-green-400">${s.investorTokensValue?.toLocaleString()}</div></div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Funding</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Total CapEx</span><span className="text-white">${s.totalCapEx?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Total Debt</span><span className="text-white">${(s.totalDebt || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Funding Target</span><span className="text-white font-medium">${s.fundingTarget?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Total Funded</span><span className="text-green-400">${s.totalFunded?.toLocaleString()}</span></div>
            <div className="w-full h-2 bg-gray-800 rounded-full mt-1"><div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(s.fundingPct || 0, 100)}%` }} /></div>
            <div className="text-gray-500 text-xs text-right">{(s.fundingPct || 0).toFixed(1)}% funded</div>
          </div>
        </div>
      </div>

      {/* Waterfall Levels */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h3 className="text-white font-semibold mb-4">Settlement Waterfall</h3>
        <div className="space-y-1">
          {(s.waterfallLevels || []).map((l: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-8">
                {i > 0 && <ArrowDown size={14} className="text-gray-600 mx-auto" />}
              </div>
              <div className={`flex-1 flex items-center justify-between p-3 rounded-lg border ${
                l.phase === 'Active' ? 'bg-green-500/10 border-green-800' : l.phase === 'Cleared' ? 'bg-blue-500/10 border-blue-800' : 'bg-gray-800/50 border-gray-700'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center text-xs text-white font-bold">{l.level}</span>
                  <div>
                    <span className="text-white text-sm">{l.name}</span>
                    {l.annual ? <span className="text-gray-500 text-xs ml-2">${l.annual.toLocaleString()}/yr</span> : null}
                    {l.pct ? <span className="text-gray-500 text-xs ml-2">{l.pct}%</span> : null}
                    {l.split ? <span className="text-gray-500 text-xs ml-2">{l.split}</span> : null}
                  </div>
                </div>
                {l.phase && <span className={`text-xs px-2 py-0.5 rounded ${l.phase === 'Active' ? 'bg-green-500/20 text-green-400' : l.phase === 'Cleared' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>{l.phase}</span>}
                {l.collected != null && <span className="text-gray-400 text-xs">${l.collected.toLocaleString()} collected</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-6 text-sm">
          <span className="text-gray-400">Current Phase: <span className={phaseColors[s.currentPhase] || 'text-gray-300'}>{s.currentPhase}</span></span>
          <span className="text-gray-400">IRR: <span className="text-white">{s.currentIRR?.toFixed(1)}%</span> / {s.hurdleIRR}% hurdle</span>
        </div>
      </div>

      {/* Operator Tokens */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Performance Carry Tokens</h3>
        {(s.operatorTokens || []).length === 0 ? (
          <p className="text-gray-500 text-sm">No operator tokens minted yet. Admin mints Class B tokens at milestones (COD, 6mo uptime, etc.).</p>
        ) : (
          <div className="space-y-2">
            {s.operatorTokens.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 text-xs font-bold">{t.tokenClass === 'ClassB' ? 'B' : 'P'}</div>
                  <div>
                    <span className="text-white text-sm">{t.tokenClass} — {t.ownershipPct}%</span>
                    <div className="text-gray-500 text-xs">Milestone: {t.milestone}</div>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${t.vested ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {t.vested ? 'Vested' : 'Unvested'}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 bg-gray-800/30 rounded-lg p-3 text-xs text-gray-500">
          <strong className="text-gray-400">Carry Logic:</strong> Phase 1: 100% to investor (capital recovery) → Phase 2: 80/20 until {s.hurdleIRR}% IRR → Phase 3: Flip to {s.operatorEquityPct}% operator / {s.investorEquityPct}% investor
        </div>
      </div>
    </div>
  );
}
