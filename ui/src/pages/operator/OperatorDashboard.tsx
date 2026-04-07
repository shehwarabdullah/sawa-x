import { useState, useEffect } from 'react';
import { api } from '../../api/backend';
import { FolderOpen, FileCheck, BarChart3 } from 'lucide-react';

export default function OperatorDashboard() {
  const [stats, setStats] = useState({ proposals: 0, projects: 0, reports: 0 });

  useEffect(() => {
    Promise.all([api.getSPVProposals(), api.getProjects(), api.getProduction()]).then(([prop, proj, rep]) => {
      setStats({ proposals: prop.length, projects: proj.length, reports: rep.length });
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Operator Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Proposals', value: stats.proposals, icon: FileCheck, color: 'text-yellow-400 bg-yellow-500/10' },
          { label: 'Active Projects', value: stats.projects, icon: FolderOpen, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Production Reports', value: stats.reports, icon: BarChart3, color: 'text-green-400 bg-green-500/10' },
        ].map(c => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center mb-3`}><c.icon className="w-5 h-5" /></div>
            <p className="text-gray-400 text-sm">{c.label}</p>
            <p className="text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
