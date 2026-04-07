import { useState, useEffect } from 'react';
import { api } from '../../api/backend';
import { Users, FolderOpen, FileCheck, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ kyc: 0, portfolios: 0, projects: 0, users: 0 });

  useEffect(() => {
    Promise.all([
      api.getKYCRequests(), api.getPortfolios(), api.getProjects(), api.getUserRoles()
    ]).then(([kyc, port, proj, users]) => {
      setStats({ kyc: kyc.length, portfolios: port.length, projects: proj.length, users: users.length });
    });
  }, []);

  const cards = [
    { label: 'Pending KYC', value: stats.kyc, icon: ShieldCheck, color: 'text-yellow-400 bg-yellow-500/10' },
    { label: 'Users', value: stats.users, icon: Users, color: 'text-blue-400 bg-blue-500/10' },
    { label: 'Portfolios', value: stats.portfolios, icon: FolderOpen, color: 'text-green-400 bg-green-500/10' },
    { label: 'Projects', value: stats.projects, icon: FileCheck, color: 'text-purple-400 bg-purple-500/10' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center mb-3`}>
              <c.icon className="w-5 h-5" />
            </div>
            <p className="text-gray-400 text-sm">{c.label}</p>
            <p className="text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
