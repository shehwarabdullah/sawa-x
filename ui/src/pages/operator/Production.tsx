import React, { useEffect, useState } from 'react';
import { api } from '../../api/backend';
import { DamlContract, ProjectSPV } from '../../types';
import { Send, RefreshCw, BarChart3 } from 'lucide-react';

export default function Production() {
  const [projects, setProjects] = useState<DamlContract<ProjectSPV>[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [selProject, setSelProject] = useState('');
  const [energy, setEnergy] = useState(1500);
  const [revenue, setRevenue] = useState(180);

  const load = async () => {
    const p = await api.getProjects(); setProjects(p); setReports(await api.getProduction());
    if (p.length > 0 && !selProject) setSelProject(p[0].payload.projectId);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    await api.updateProduction({ projectId: selProject, reportDate: new Date().toISOString().split('T')[0], energyProducedKWh: energy, revenueGenerated: revenue, observers: [] });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Production Reports</h1>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 max-w-xl">
        <h3 className="text-white font-medium mb-3">Submit Production Data</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <select value={selProject} onChange={e => setSelProject(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm col-span-2">
            {projects.map(p => <option key={p.payload.projectId} value={p.payload.projectId}>{p.payload.name}</option>)}
          </select>
          <div><label className="text-gray-500 text-xs">Energy (kWh)</label><input type="number" value={energy} onChange={e => setEnergy(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
          <div><label className="text-gray-500 text-xs">Revenue ($)</label><input type="number" value={revenue} onChange={e => setRevenue(Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
        </div>
        <button onClick={submit} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"><Send size={14} /> Submit</button>
      </div>
      <h3 className="text-white font-medium mb-3">Recent Reports</h3>
      <div className="space-y-2">
        {reports.map((r: any, i: number) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3"><BarChart3 size={16} className="text-green-400" /><span className="text-white text-sm">{r.payload.projectId}</span><span className="text-gray-500 text-sm">{r.payload.reportDate}</span></div>
            <div className="flex gap-4 text-sm"><span className="text-gray-400">{Number(r.payload.energyProducedKWh).toLocaleString()} kWh</span><span className="text-green-400">${Number(r.payload.revenueGenerated).toLocaleString()}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
