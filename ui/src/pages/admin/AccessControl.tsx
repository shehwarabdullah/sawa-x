import React, { useEffect, useState } from 'react';
import { api } from '../../api/backend';
import { DamlContract, PortfolioAccess, ProjectSPV } from '../../types';
import { Plus, RefreshCw } from 'lucide-react';

export default function AccessControl() {
  const [access, setAccess] = useState<DamlContract<PortfolioAccess>[]>([]);
  const [projects, setProjects] = useState<DamlContract<ProjectSPV>[]>([]);
  const [investor, setInvestor] = useState('Investor1');
  const [region, setRegion] = useState('South Africa');
  const [selProjects, setSelProjects] = useState<string[]>([]);

  const load = async () => {
    try { setAccess(await api.getPortfolioAccess()); setProjects(await api.getProjects()); } catch {}
  };
  useEffect(() => { load(); }, []);

  const grant = async () => { await api.grantAccess(investor, region, selProjects); setSelProjects([]); load(); };
  const toggleProject = (pid: string) => setSelProjects(prev => prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Manage Access</h1>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-white font-medium mb-3">Grant Project Access</h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <select value={investor} onChange={e => setInvestor(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
            <option value="Investor1">Investor1</option><option value="Investor2">Investor2</option><option value="Investor3">Investor3</option>
          </select>
          <input value={region} onChange={e => setRegion(e.target.value)} placeholder="Region" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          <button onClick={grant} disabled={selProjects.length === 0} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1 justify-center">
            <Plus size={14} /> Grant Access
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {projects.map(p => (
            <button key={p.payload.projectId} onClick={() => toggleProject(p.payload.projectId)}
              className={`px-3 py-1.5 rounded-lg text-sm border ${selProjects.includes(p.payload.projectId) ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
              {p.payload.projectId}
            </button>
          ))}
        </div>
      </div>
      <h3 className="text-white font-medium mb-3">Current Access</h3>
      <div className="space-y-2">
        {access.map((a) => (
          <div key={a.contractId} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div><span className="text-white font-medium">{a.payload.investor.split('::')[0]}</span><span className="text-gray-500 mx-2">→</span><span className="text-gray-400">{a.payload.region}</span></div>
            <div className="flex gap-1">{a.payload.projectIds.map(pid => <span key={pid} className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">{pid}</span>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
