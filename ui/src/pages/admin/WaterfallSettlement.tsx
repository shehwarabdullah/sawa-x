import React, { useEffect, useState } from 'react';
import { api } from '../../api/backend';
import { DamlContract, ProjectSPV } from '../../types';
import { RefreshCw, Plus, DollarSign, ArrowRight, CheckCircle } from 'lucide-react';

const phaseColors: Record<string, string> = {
  CapitalRecovery: 'bg-yellow-500/20 text-yellow-400',
  PreferredReturn: 'bg-blue-500/20 text-blue-400',
  CatchUpFlip: 'bg-green-500/20 text-green-400',
};

export default function WaterfallSettlement() {
  const [waterfalls, setWaterfalls] = useState<any[]>([]);
  const [projects, setProjects] = useState<DamlContract<ProjectSPV>[]>([]);
  const [operatorTokens, setOperatorTokens] = useState<any[]>([]);
  const [devFees, setDevFees] = useState<any[]>([]);
  const [selProject, setSelProject] = useState('');
  const [selInvestor, setSelInvestor] = useState('Investor1');
  const [revenue, setRevenue] = useState(5000);
  const [feedback, setFeedback] = useState('');

  const load = async () => {
    try {
      const p = await api.getProjects();
      setProjects(p);
      setWaterfalls(await api.getWaterfall());
      setOperatorTokens(await api.getOperatorTokens());
      setDevFees(await api.getDevFees());
      if (p.length > 0 && !selProject) setSelProject(p[0].payload.projectId);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const createWaterfall = async () => {
    const proj = projects.find(p => p.payload.projectId === selProject);
    if (!proj) return;
    await api.createWaterfall({
      investorName: selInvestor,
      projectId: selProject,
      totalInvested: 10000,
      devFeePct: Number(proj.payload.devFeePct || 5),
      mgmtFeePct: Number(proj.payload.mgmtFeePct || 1),
      annualOMCost: Number(proj.payload.annualOMCost || 0),
      debtServiceAnnual: 0,
      hurdleIRRPct: Number(proj.payload.investorHurdleIRR || 12),
      preFlipInvestorPct: 80,
      postFlipInvestorPct: 20,
      postFlipOperatorPct: 80,
    });
    setFeedback('Waterfall created'); load();
    setTimeout(() => setFeedback(''), 3000);
  };

  const settle = async (contractId: string) => {
    await api.settleRevenue(contractId, revenue, new Date().toISOString().split('T')[0]);
    setFeedback('Revenue settled'); load();
    setTimeout(() => setFeedback(''), 3000);
  };

  const mintOperatorToken = async () => {
    await api.mintOperatorToken({ projectId: selProject, tokenClass: 'ClassB', ownershipPct: 40, vestingMilestone: 'COD' });
    setFeedback('Operator token minted'); load();
    setTimeout(() => setFeedback(''), 3000);
  };

  const vestToken = async (cid: string) => {
    await api.vestOperatorToken(cid);
    setFeedback('Token vested'); load();
    setTimeout(() => setFeedback(''), 3000);
  };

  const disburseDevFee = async () => {
    const proj = projects.find(p => p.payload.projectId === selProject);
    if (!proj) return;
    await api.disburseDevFee(selProject, Number(proj.payload.totalCapEx), Number(proj.payload.devFeePct));
    setFeedback('Dev fee disbursed'); load();
    setTimeout(() => setFeedback(''), 3000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Waterfall Settlement</h1>
          <p className="text-gray-500 text-sm">Revenue distribution, carry structure, dev fees</p>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
      </div>

      {feedback && (
        <div className="bg-green-500/10 text-green-400 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm">
          <CheckCircle size={14} /> {feedback}
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Project</label>
            <select value={selProject} onChange={e => setSelProject(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
              {projects.map(p => <option key={p.payload.projectId} value={p.payload.projectId}>{p.payload.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Investor</label>
            <select value={selInvestor} onChange={e => setSelInvestor(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
              <option value="Investor1">Investor1</option><option value="Investor2">Investor2</option><option value="Investor3">Investor3</option>
            </select>
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Revenue ($)</label>
            <input type="number" value={revenue} onChange={e => setRevenue(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div className="flex items-end">
            <button onClick={createWaterfall} className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 justify-center">
              <Plus size={14} /> Create Waterfall
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={mintOperatorToken} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-lg text-xs">Mint Operator Token (ClassB)</button>
          <button onClick={disburseDevFee} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-1.5 rounded-lg text-xs">Disburse Dev Fee</button>
        </div>
      </div>

      {/* Active Waterfalls */}
      <h3 className="text-white font-medium mb-3">Active Waterfalls</h3>
      {waterfalls.length === 0 ? (
        <p className="text-gray-500 text-sm mb-6">No waterfalls created yet</p>
      ) : (
        <div className="space-y-4 mb-6">
          {waterfalls.map((w: any) => {
            const p = w.payload;
            const totalDist = Number(p.totalReturnedToInvestor) + Number(p.totalReturnedToOperator);
            return (
              <div key={w.contractId} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-white font-medium">{p.projectId} — {p.investor.split('::')[0]}</div>
                    <span className={`px-2 py-0.5 rounded text-xs ${phaseColors[p.phase] || 'bg-gray-700 text-gray-300'}`}>{p.phase}</span>
                  </div>
                  <button onClick={() => settle(w.contractId)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs flex items-center gap-1">
                    <DollarSign size={12} /> Settle ${revenue.toLocaleString()}
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-3 text-sm">
                  <div><span className="text-gray-500 text-xs">Invested</span><div className="text-white">${Number(p.totalInvested).toLocaleString()}</div></div>
                  <div><span className="text-gray-500 text-xs">To Investor</span><div className="text-green-400">${Number(p.totalReturnedToInvestor).toLocaleString()}</div></div>
                  <div><span className="text-gray-500 text-xs">To Operator</span><div className="text-purple-400">${Number(p.totalReturnedToOperator).toLocaleString()}</div></div>
                  <div><span className="text-gray-500 text-xs">Mgmt Fees</span><div className="text-yellow-400">${Number(p.mgmtFeeCollected).toLocaleString()}</div></div>
                  <div><span className="text-gray-500 text-xs">Est. IRR</span><div className="text-white">{Number(p.currentIRRPct).toFixed(1)}%</div></div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Waterfall: O&M (${Number(p.omDeducted).toLocaleString()}) <ArrowRight size={10} className="inline" /> Mgmt ({p.mgmtFeePct}%) <ArrowRight size={10} className="inline" /> Debt (${Number(p.debtDeducted).toLocaleString()}) <ArrowRight size={10} className="inline" /> Distribution ({p.phase}) | Epochs: {p.epochCount}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Operator Tokens */}
      <h3 className="text-white font-medium mb-3">Operator Tokens (Performance Carry)</h3>
      {operatorTokens.length === 0 ? (
        <p className="text-gray-500 text-sm mb-6">No operator tokens minted</p>
      ) : (
        <div className="space-y-2 mb-6">
          {operatorTokens.map((t: any) => (
            <div key={t.contractId} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 text-xs font-bold">{t.payload.tokenClass === 'ClassB' ? 'B' : 'P'}</div>
                <div>
                  <div className="text-white text-sm">{t.payload.projectId} — {t.payload.tokenClass} ({t.payload.ownershipPct}%)</div>
                  <div className="text-gray-500 text-xs">Milestone: {t.payload.vestingMilestone}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs ${t.payload.vested ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {t.payload.vested ? 'Vested' : 'Unvested'}
                </span>
                {!t.payload.vested && (
                  <button onClick={() => vestToken(t.contractId)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs">Vest</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dev Fees */}
      <h3 className="text-white font-medium mb-3">Dev Fee Disbursements</h3>
      {devFees.length === 0 ? (
        <p className="text-gray-500 text-sm">No dev fees disbursed yet</p>
      ) : (
        <div className="space-y-2">
          {devFees.map((d: any) => (
            <div key={d.contractId} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-white text-sm">{d.payload.projectId}</div>
                <div className="text-gray-500 text-xs">{d.payload.devFeePct}% of ${Number(d.payload.totalCapEx).toLocaleString()} CapEx</div>
              </div>
              <div className="text-green-400 font-medium">${Number(d.payload.devFeeAmount).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
