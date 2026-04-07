import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/backend';
import { RefreshCw, BarChart3, Zap, DollarSign, Lock } from 'lucide-react';

export default function InvestorProduction() {
  const { partyName, kycStatus } = useApp();
  const [projects, setProjects] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const p = await api.getProjects(partyName);
      setProjects(p);
      const allReports = await api.getProduction();
      const projectIds = new Set(p.map((pr: any) => pr.payload.projectId));
      setReports(allReports.filter((r: any) => projectIds.has(r.payload.projectId)));
    } catch {}
    setLoading(false);
  };
  useEffect(() => { if (kycStatus === 'approved') load(); }, [partyName, kycStatus]);

  if (kycStatus !== 'approved') return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Production Metrics</h1>
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-8 text-center max-w-lg">
        <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <p className="text-gray-400">Complete KYC to view production data.</p>
      </div>
    </div>
  );

  const totalEnergy = reports.reduce((s, r) => s + Number(r.payload.energyProducedKWh), 0);
  const totalRevenue = reports.reduce((s, r) => s + Number(r.payload.revenueGenerated), 0);

  // Group by project
  const grouped: Record<string, any[]> = {};
  reports.forEach((r: any) => {
    if (!grouped[r.payload.projectId]) grouped[r.payload.projectId] = [];
    grouped[r.payload.projectId].push(r);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Production Metrics</h1>
          <p className="text-gray-500 text-sm">Energy production data for your invested projects</p>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-blue-400 mb-2"><BarChart3 size={18} /> Reports</div>
          <div className="text-2xl font-bold text-white">{reports.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-yellow-400 mb-2"><Zap size={18} /> Total Energy</div>
          <div className="text-2xl font-bold text-white">{totalEnergy.toLocaleString()} kWh</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-green-400 mb-2"><DollarSign size={18} /> Total Revenue</div>
          <div className="text-2xl font-bold text-white">${totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      {loading ? <p className="text-gray-500">Loading...</p> :
       reports.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">No Production Data</h3>
          <p className="text-gray-500 text-sm">Production reports will appear here once the operator submits data for your projects.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([projectId, projReports]) => {
            const proj = projects.find((p: any) => p.payload.projectId === projectId);
            return (
              <div key={projectId} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <div className="text-white font-semibold">{proj?.payload.name || projectId}</div>
                  <div className="text-gray-500 text-xs">{projectId} · {proj?.payload.region}</div>
                </div>
                <div className="divide-y divide-gray-800">
                  {projReports.sort((a: any, b: any) => b.payload.reportDate.localeCompare(a.payload.reportDate)).map((r: any, i: number) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-gray-400 text-sm">{r.payload.reportDate}</span>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <span className="text-yellow-400">{Number(r.payload.energyProducedKWh).toLocaleString()} kWh</span>
                        <span className="text-green-400">${Number(r.payload.revenueGenerated).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
