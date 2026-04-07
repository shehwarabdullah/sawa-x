import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/backend';
import { Activity, Globe, Briefcase, AlertTriangle, UserCheck } from 'lucide-react';

export default function InvestorDashboard() {
  const { partyName, kycStatus } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ regions: 0, projects: 0, investments: 0, tokens: 0 });

  useEffect(() => {
    if (kycStatus !== 'approved') return;
    Promise.all([api.getMyRegions(partyName), api.getProjects(partyName), api.getInvestments(partyName), api.getTokens(partyName)])
      .then(([regions, projects, investments, tokens]) => {
        setStats({ regions: regions.length, projects: projects.length, investments: investments.length, tokens: tokens.length });
      }).catch(() => {});
  }, [partyName, kycStatus]);

  if (kycStatus !== 'approved') return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Welcome, {partyName}</h1>
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-8 max-w-lg">
        <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />
        <h2 className="text-white text-xl font-semibold mb-2">KYC Required</h2>
        <p className="text-gray-400 mb-4">
          {kycStatus === 'none' && 'Complete KYC verification before you can browse projects or invest.'}
          {kycStatus === 'pending' && 'Your KYC is under review. You will get access once approved.'}
          {kycStatus === 'rejected' && 'Your KYC was rejected. Please resubmit with correct documents.'}
        </p>
        {(kycStatus === 'none' || kycStatus === 'rejected') && (
          <button onClick={() => navigate('/investor/kyc')} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm flex items-center gap-2"><UserCheck size={16} /> Submit KYC</button>
        )}
      </div>
    </div>
  );

  const cards = [
    { label: 'My Regions', value: stats.regions, icon: <Globe size={20} />, color: 'text-blue-400' },
    { label: 'Accessible Projects', value: stats.projects, icon: <Activity size={20} />, color: 'text-green-400' },
    { label: 'Completed Investments', value: stats.investments, icon: <Briefcase size={20} />, color: 'text-purple-400' },
    { label: 'Tokens Held', value: stats.tokens, icon: <Briefcase size={20} />, color: 'text-yellow-400' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Welcome, {partyName}</h1>
      <p className="text-gray-500 mb-6">Your investment dashboard</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <span className={c.color}>{c.icon}</span>
            <div className="text-2xl font-bold text-white mt-2">{c.value}</div>
            <div className="text-gray-500 text-sm">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
