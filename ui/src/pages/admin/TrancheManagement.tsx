import React, { useEffect, useState } from 'react';
import { api } from '../../api/backend';
import { Plus, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

const statusColors: Record<string, string> = {
  TrancheAllocated: 'bg-yellow-500/20 text-yellow-400', TrancheFunded: 'bg-green-500/20 text-green-400',
  TrancheConstruction: 'bg-blue-500/20 text-blue-400', TrancheOperational: 'bg-purple-500/20 text-purple-400', TrancheClosed: 'bg-gray-500/20 text-gray-400',
};

export default function TrancheManagement() {
  const [projects, setProjects] = useState<any[]>([]);
  const [tranches, setTranches] = useState<any[]>([]);
  const [selProject, setSelProject] = useState('');
  const [selInvestor, setSelInvestor] = useState('Investor1');
  const [trancheSize, setTrancheSize] = useState(10000);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const load = async () => {
    try {
      const [p, t] = await Promise.all([api.getProjects(), api.getTranches()]);
      setProjects(p); setTranches(t);
      if (p.length > 0 && !selProject) setSelProject(p[0].payload.projectId);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const proj = projects.find((p: any) => p.payload.projectId === selProject);
  const projTranches = tranches.filter((t: any) => t.payload.projectId === selProject);
  const nextIndex = projTranches.length;

  const create = async () => {
    if (!proj || trancheSize <= 0) return;
    setFeedback(null);
    const result = await api.createTranche({
      projectId: proj.payload.projectId, projectName: proj.payload.name,
      trancheIndex: nextIndex, trancheSize, investorName: selInvestor, region: proj.payload.region
    });
    if (result.error) setFeedback({ type: 'error', msg: result.error });
    else setFeedback({ type: 'success', msg: `Tranche #${nextIndex} created ($${trancheSize.toLocaleString()}) for ${selInvestor}` });
    load();
    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Tranche Management</h1>
          <p className="text-gray-500 text-sm">Create tranches with dynamic sizes. Validation: KYC → Region → Project → Single Active</p>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Project</label>
            <select value={selProject} onChange={e => setSelProject(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
              {projects.map((p: any) => <option key={p.payload.projectId} value={p.payload.projectId}>{p.payload.name} ({p.payload.region})</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Investor</label>
            <select value={selInvestor} onChange={e => setSelInvestor(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
              <option value="Investor1">Investor1</option><option value="Investor2">Investor2</option><option value="Investor3">Investor3</option>
            </select>
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Tranche Size ($)</label>
            <input type="number" value={trancheSize} onChange={e => setTrancheSize(Number(e.target.value))} min={1}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div className="flex items-end">
            <button onClick={create} className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 justify-center">
              <Plus size={14} /> Create Tranche #{nextIndex}
            </button>
          </div>
        </div>

        {proj && (
          <div className="flex gap-6 text-sm">
            <span className="text-gray-400">Region: <span className="text-white">{proj.payload.region}</span></span>
            <span className="text-gray-400">Allocated: <span className="text-white">${Number(proj.payload.totalCapitalAllocated || 0).toLocaleString()}</span></span>
            <span className="text-gray-400">Funded: <span className="text-green-400">${Number(proj.payload.totalCapitalFunded || 0).toLocaleString()}</span></span>
            <span className="text-gray-400">Tranches: <span className="text-white">{proj.payload.trancheCount || 0}</span></span>
          </div>
        )}

        {feedback && (
          <div className={`mt-3 flex items-center gap-2 text-sm rounded-lg p-3 ${feedback.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {feedback.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {feedback.msg}
          </div>
        )}
      </div>

      <h3 className="text-white font-medium mb-3">Tranches for {proj?.payload.name || 'selected project'} ({projTranches.length})</h3>
      {projTranches.length === 0 ? <p className="text-gray-500 text-sm">No tranches created yet</p> : (
        <div className="space-y-2">
          {projTranches.map((t: any) => (
            <div key={t.contractId} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center"><span className="text-gray-300 font-bold text-sm">T{t.payload.trancheIndex}</span></div>
                <div>
                  <div className="text-white text-sm font-medium">{t.payload.investor.split('::')[0]} · ${Number(t.payload.trancheSize).toLocaleString()}</div>
                  <div className="text-gray-500 text-xs">{t.payload.region}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-white text-sm">${Number(t.payload.investedAmount).toLocaleString()} / ${Number(t.payload.trancheSize).toLocaleString()}</div>
                  <div className="w-24 h-1.5 bg-gray-800 rounded-full mt-1">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${(Number(t.payload.investedAmount) / Number(t.payload.trancheSize)) * 100}%` }} />
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${statusColors[t.payload.status] || 'bg-gray-700 text-gray-300'}`}>{t.payload.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
