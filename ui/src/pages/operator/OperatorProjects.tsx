import React, { useEffect, useState } from 'react';
import { api } from '../../api/backend';
import { RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

const trancheActions: Record<string, { label: string; action: string; color: string }> = {
  TrancheFunded: { label: 'Start Construction', action: 'MoveToConstruction', color: 'bg-blue-600' },
  TrancheConstruction: { label: 'Go Operational', action: 'MoveToOperational', color: 'bg-purple-600' },
  TrancheOperational: { label: 'Close Tranche', action: 'CloseTranche', color: 'bg-gray-600' },
};
const statusColors: Record<string, string> = {
  Active: 'bg-green-500/20 text-green-400', Completed: 'bg-gray-500/20 text-gray-400',
  TrancheAllocated: 'bg-yellow-500/20 text-yellow-400', TrancheFunded: 'bg-green-500/20 text-green-400',
  TrancheConstruction: 'bg-blue-500/20 text-blue-400', TrancheOperational: 'bg-purple-500/20 text-purple-400', TrancheClosed: 'bg-gray-500/20 text-gray-400',
};

export default function OperatorProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [tranches, setTranches] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = () => { Promise.all([api.getProjects(), api.getTranches()]).then(([p, t]) => { setProjects(p); setTranches(t); }).catch(() => {}); };
  useEffect(() => { load(); }, []);

  const doTrancheAction = async (cid: string, action: string) => {
    await api.moveTrancheLifecycle(cid, action);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects & Tranche Lifecycle</h1>
          <p className="text-gray-500 text-sm">Manage lifecycle per tranche: Funded → Construction → Operational</p>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center"><p className="text-gray-400">No projects yet.</p></div>
      ) : (
        <div className="space-y-4">
          {projects.map((p: any) => {
            const pt = tranches.filter((t: any) => t.payload.projectId === p.payload.projectId);
            const isExp = expanded[p.payload.projectId] !== false;
            const funded = Number(p.payload.totalCapitalFunded || 0);
            const allocated = Number(p.payload.totalCapitalAllocated || 0);

            return (
              <div key={p.contractId} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-5 cursor-pointer" onClick={() => setExpanded(prev => ({ ...prev, [p.payload.projectId]: !isExp }))}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{isExp ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}</div>
                      <div>
                        <div className="text-white font-semibold text-lg">{p.payload.name}</div>
                        <div className="text-gray-500 text-sm">{p.payload.projectId} · {p.payload.region}</div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${statusColors[p.payload.status] || 'bg-gray-700 text-gray-300'}`}>{p.payload.status}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-3 text-sm ml-7">
                    <div><span className="text-gray-500 text-xs">Allocated</span><div className="text-white">${allocated.toLocaleString()}</div></div>
                    <div><span className="text-gray-500 text-xs">Funded</span><div className="text-green-400">${funded.toLocaleString()}</div></div>
                    <div><span className="text-gray-500 text-xs">Tranches</span><div className="text-white">{p.payload.trancheCount || 0}</div></div>
                    <div><span className="text-gray-500 text-xs">CapEx</span><div className="text-white">${Number(p.payload.totalCapEx || 0).toLocaleString()}</div></div>
                  </div>
                </div>

                {isExp && (
                  <div className="border-t border-gray-800 bg-gray-950/50 p-4">
                    <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Tranche Lifecycle</h4>
                    {pt.length === 0 ? <p className="text-gray-600 text-sm">No tranches created. Admin creates tranches from Tranche Management.</p> : (
                      <div className="space-y-2">
                        {pt.map((t: any) => {
                          const act = trancheActions[t.payload.status];
                          return (
                            <div key={t.contractId} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center"><span className="text-gray-300 font-bold text-xs">T{t.payload.trancheIndex}</span></div>
                                <div>
                                  <div className="text-white text-sm">{t.payload.investor.split('::')[0]} · ${Number(t.payload.trancheSize).toLocaleString()}</div>
                                  <div className="text-gray-500 text-xs">Invested: ${Number(t.payload.investedAmount).toLocaleString()}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-xs ${statusColors[t.payload.status] || ''}`}>{t.payload.status}</span>
                                {act && <button onClick={() => doTrancheAction(t.contractId, act.action)} className={`${act.color} text-white px-3 py-1.5 rounded-lg text-xs`}>{act.label}</button>}
                              </div>
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
