import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/backend';
import { RefreshCw, Lock, DollarSign, CheckCircle, AlertCircle, AlertTriangle, UserCheck, ChevronDown, ChevronRight } from 'lucide-react';

const statusColors: Record<string, string> = {
  Active: 'bg-green-500/20 text-green-400', Completed: 'bg-gray-500/20 text-gray-400',
  TrancheAllocated: 'bg-yellow-500/20 text-yellow-400', TrancheFunded: 'bg-green-500/20 text-green-400',
  TrancheConstruction: 'bg-blue-500/20 text-blue-400', TrancheOperational: 'bg-purple-500/20 text-purple-400',
  TrancheClosed: 'bg-gray-500/20 text-gray-400',
};

const statusLabels: Record<string, string> = {
  TrancheAllocated: 'Open for Investment', TrancheFunded: 'Funded', TrancheConstruction: 'Construction', TrancheOperational: 'Operational', TrancheClosed: 'Closed',
};

export default function InvestorProjects() {
  const { partyName, kycStatus } = useApp();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [tranches, setTranches] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [investAmounts, setInvestAmounts] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { type: 'success' | 'error'; msg: string }>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([api.getProjects(partyName), api.getTranches(undefined, partyName)]);
      setProjects(p); setTranches(t);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { if (kycStatus === 'approved') load(); }, [partyName, kycStatus]);

  const showFb = (id: string, type: 'success' | 'error', msg: string) => {
    setFeedback(prev => ({ ...prev, [id]: { type, msg } }));
    setTimeout(() => setFeedback(prev => { const n = { ...prev }; delete n[id]; return n; }), 4000);
  };

  const invest = async (t: any) => {
    const amt = Number(investAmounts[t.contractId] || 0);
    const rem = Number(t.payload.trancheSize) - Number(t.payload.investedAmount);
    if (amt <= 0) { showFb(t.contractId, 'error', 'Enter a positive amount'); return; }
    if (amt > rem) { showFb(t.contractId, 'error', `Max: $${rem.toLocaleString()}`); return; }
    try {
      const r = await api.invest(t.contractId, partyName, amt);
      if (r.error) showFb(t.contractId, 'error', r.error);
      else { showFb(t.contractId, 'success', `Invested $${amt.toLocaleString()}`); setInvestAmounts(prev => ({ ...prev, [t.contractId]: '' })); }
      load();
    } catch (e: any) { showFb(t.contractId, 'error', e.message); }
  };

  const done = async (t: any) => {
    if (Number(t.payload.investedAmount) === 0) { showFb(t.contractId, 'error', 'Invest something first'); return; }
    try {
      const r = await api.completeTranche(t.contractId, partyName);
      if (r.error) showFb(t.contractId, 'error', r.error);
      else showFb(t.contractId, 'success', 'Tranche completed! Token minted.');
      load();
    } catch (e: any) { showFb(t.contractId, 'error', e.message); }
  };

  // KYC Gate
  if (kycStatus !== 'approved') return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Projects</h1>
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-8 max-w-lg">
        <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />
        <h2 className="text-white text-lg font-semibold mb-2">KYC Required</h2>
        <p className="text-gray-400 mb-4">Complete KYC verification to access projects.</p>
        {(kycStatus === 'none' || kycStatus === 'rejected') && (
          <button onClick={() => navigate('/investor/kyc')} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm flex items-center gap-2"><UserCheck size={16} /> Submit KYC</button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Projects</h1>
          <p className="text-gray-500 text-sm">Projects in your allocated regions with tranches shown below each project</p>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
      </div>

      {loading ? <p className="text-gray-500">Loading...</p> :
       projects.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Lock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">No Projects Available</h3>
          <p className="text-gray-500 text-sm">Admin must first allocate you to a regional portfolio, then grant project access.</p>
          <p className="text-gray-600 text-xs mt-2">Sequence: Regional Portfolio → Project Access → Tranche Allocation</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p: any) => {
            const projTranches = tranches.filter((t: any) => t.payload.projectId === p.payload.projectId);
            const isExpanded = expanded[p.payload.projectId] !== false; // default expanded
            const funded = Number(p.payload.totalCapitalFunded || 0);
            const allocated = Number(p.payload.totalCapitalAllocated || 0);

            return (
              <div key={p.contractId} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {/* Project Header */}
                <div className="p-5 cursor-pointer" onClick={() => setExpanded(prev => ({ ...prev, [p.payload.projectId]: !isExpanded }))}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}</div>
                      <div>
                        <div className="text-white font-semibold text-lg">{p.payload.name}</div>
                        <div className="text-gray-500 text-sm">{p.payload.projectId} · {p.payload.region}</div>
                        <p className="text-gray-400 text-sm mt-1">{p.payload.description}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[p.payload.status] || 'bg-gray-700 text-gray-300'}`}>{p.payload.status}</span>
                  </div>

                  <div className="grid grid-cols-5 gap-4 mt-4 text-sm ml-7">
                    <div><span className="text-gray-500 text-xs">Capital Allocated</span><div className="text-white">${allocated.toLocaleString()}</div></div>
                    <div><span className="text-gray-500 text-xs">Capital Funded</span><div className="text-green-400">${funded.toLocaleString()}</div></div>
                    <div><span className="text-gray-500 text-xs">Tranches</span><div className="text-white">{p.payload.trancheCount || 0}</div></div>
                    <div><span className="text-gray-500 text-xs">PPA Tariff</span><div className="text-white">${Number(p.payload.ppaTariff).toFixed(2)}/kWh</div></div>
                    <div><span className="text-gray-500 text-xs">Yield</span><div className="text-green-400">{(Number(p.payload.yieldRate) * 100).toFixed(1)}%</div></div>
                  </div>
                </div>

                {/* Tranches Sub-Section */}
                {isExpanded && (
                  <div className="border-t border-gray-800 bg-gray-950/50 p-4">
                    <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 ml-2">Tranches</h4>
                    {projTranches.length === 0 ? (
                      <p className="text-gray-600 text-sm ml-2">No tranches allocated to you for this project yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {projTranches.map((t: any) => {
                          const size = Number(t.payload.trancheSize);
                          const invested = Number(t.payload.investedAmount);
                          const remaining = size - invested;
                          const pct = size > 0 ? (invested / size) * 100 : 0;
                          const isActive = t.payload.status === 'TrancheAllocated';
                          const fb = feedback[t.contractId];

                          return (
                            <div key={t.contractId} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-300 font-bold text-xs">T{t.payload.trancheIndex}</span>
                                  </div>
                                  <div>
                                    <div className="text-white text-sm font-medium">Tranche #{t.payload.trancheIndex}</div>
                                    <div className="text-gray-500 text-xs">${size.toLocaleString()} tranche</div>
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs ${statusColors[t.payload.status] || ''}`}>
                                  {statusLabels[t.payload.status] || t.payload.status}
                                </span>
                              </div>

                              {/* Progress */}
                              <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-gray-400">Invested: <span className="text-green-400">${invested.toLocaleString()}</span></span>
                                  <span className="text-gray-500">${remaining.toLocaleString()} remaining</span>
                                </div>
                                <div className="w-full h-2 bg-gray-800 rounded-full">
                                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                              </div>

                              {/* Invest controls */}
                              {isActive && (
                                <div className="flex gap-2 items-end">
                                  <div className="flex-1 relative">
                                    <DollarSign size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input type="number" value={investAmounts[t.contractId] || ''}
                                      onChange={e => setInvestAmounts(prev => ({ ...prev, [t.contractId]: e.target.value }))}
                                      placeholder={`Max ${remaining.toLocaleString()}`} max={remaining}
                                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-white text-sm focus:border-green-500 outline-none" />
                                  </div>
                                  <button onClick={() => invest(t)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-medium">Invest</button>
                                  <button onClick={() => done(t)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-medium">Done</button>
                                </div>
                              )}

                              {fb && (
                                <div className={`mt-2 flex items-center gap-1 text-xs rounded p-2 ${fb.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                  {fb.type === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />} {fb.msg}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
