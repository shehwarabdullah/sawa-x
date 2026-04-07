import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RoleType } from '../types';
import { Zap, Shield, Settings, TrendingUp } from 'lucide-react';

export default function LoginPage() {
  const { ready, parties, login } = useApp();
  const [selected, setSelected] = useState<{ role: RoleType; party: string } | null>(null);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-12 h-12 text-green-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-white mb-2">Sawa-X</h1>
          <p className="text-gray-400">Connecting to Canton ledger...</p>
          <p className="text-gray-600 text-sm mt-2">Make sure sandbox + JSON API + backend are running</p>
        </div>
      </div>
    );
  }

  const investors = parties.filter(p => p.name.startsWith('Investor'));
  const cards = [
    { role: 'Admin' as RoleType, party: 'Admin', icon: Shield, color: 'from-red-500 to-red-700', border: 'border-red-500/30', desc: 'Manage KYC, portfolios, approvals & investor access' },
    { role: 'Operator' as RoleType, party: 'Operator', icon: Settings, color: 'from-blue-500 to-blue-700', border: 'border-blue-500/30', desc: 'Create SPV projects, manage lifecycle & production' },
    ...investors.map(inv => ({
      role: 'Investor' as RoleType, party: inv.name, icon: TrendingUp,
      color: 'from-green-500 to-green-700', border: 'border-green-500/30',
      desc: 'Invest in tranches, view portfolio & track yield',
    })),
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Zap className="w-10 h-10 text-green-500" />
            <h1 className="text-4xl font-bold text-white">Sawa-X</h1>
          </div>
          <p className="text-gray-400 text-lg">Tokenized Infrastructure Investment Platform</p>
          <p className="text-gray-600 text-sm mt-1">Canton / DAML Blockchain · Select your portal</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c, i) => {
            const Icon = c.icon;
            const isSel = selected?.party === c.party && selected?.role === c.role;
            return (
              <button key={i} onClick={() => setSelected({ role: c.role, party: c.party })}
                className={`relative p-6 rounded-xl border ${c.border} bg-gray-900 hover:bg-gray-800 transition-all text-left ${isSel ? 'ring-2 ring-green-500 bg-gray-800' : ''}`}>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold text-lg">{c.party}</h3>
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 mb-2 bg-gray-700 text-gray-300">{c.role}</span>
                <p className="text-gray-500 text-sm">{c.desc}</p>
                {isSel && <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-green-500" />}
              </button>
            );
          })}
        </div>
        {selected && (
          <div className="mt-8 text-center">
            <button onClick={() => login(selected.role, selected.party)}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-semibold rounded-lg hover:from-green-500 hover:to-green-400 transition-all text-lg shadow-lg shadow-green-500/20">
              Login as {selected.party} ({selected.role})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
