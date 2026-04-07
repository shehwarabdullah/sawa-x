import React, { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Users, FolderOpen, FileCheck, ShieldCheck, KeyRound, DollarSign,
  Wrench, PlusCircle, BarChart3, Globe, Coins,
  TrendingUp, Briefcase, LogOut, UserCheck, Activity
} from 'lucide-react';

const navItems: Record<string, { label: string; to: string; icon: React.ReactNode }[]> = {
  Admin: [
    { label: 'Dashboard', to: '/admin', icon: <LayoutDashboard size={18} /> },
    { label: 'KYC Approvals', to: '/admin/kyc', icon: <ShieldCheck size={18} /> },
    { label: 'Portfolios', to: '/admin/portfolios', icon: <FolderOpen size={18} /> },
    { label: 'SPV Approvals', to: '/admin/spv-approvals', icon: <FileCheck size={18} /> },
    { label: 'Manage Access', to: '/admin/access', icon: <KeyRound size={18} /> },
    { label: 'Tranche Mgmt', to: '/admin/tranches', icon: <Users size={18} /> },
    { label: 'Waterfall', to: '/admin/waterfall', icon: <DollarSign size={18} /> },
    { label: 'Yield Claims', to: '/admin/yields', icon: <DollarSign size={18} /> },
  ],
  Operator: [
    { label: 'Dashboard', to: '/operator', icon: <LayoutDashboard size={18} /> },
    { label: 'Create SPV', to: '/operator/create-spv', icon: <PlusCircle size={18} /> },
    { label: 'Projects', to: '/operator/projects', icon: <Wrench size={18} /> },
    { label: 'Production', to: '/operator/production', icon: <BarChart3 size={18} /> },
    { label: 'Financials', to: '/operator/financials', icon: <DollarSign size={18} /> },
  ],
  Investor: [
    { label: 'Dashboard', to: '/investor', icon: <LayoutDashboard size={18} /> },
    { label: 'Submit KYC', to: '/investor/kyc', icon: <UserCheck size={18} /> },
    { label: 'My Regions', to: '/investor/regions', icon: <Globe size={18} /> },
    { label: 'Projects', to: '/investor/projects', icon: <Activity size={18} /> },
    { label: 'Production', to: '/investor/production', icon: <BarChart3 size={18} /> },
    { label: 'Yield Claims', to: '/investor/yields', icon: <Coins size={18} /> },
    { label: 'Waterfall', to: '/investor/waterfall', icon: <TrendingUp size={18} /> },
    { label: 'My Portfolio', to: '/investor/portfolio', icon: <Briefcase size={18} /> },
  ],
};

const roleColors: Record<string, string> = { Admin: 'bg-red-500', Operator: 'bg-blue-500', Investor: 'bg-green-500' };
const kycBadge: Record<string, { color: string; label: string }> = {
  none: { color: 'bg-gray-600', label: 'No KYC' }, pending: { color: 'bg-yellow-600', label: 'KYC Pending' },
  approved: { color: 'bg-green-600', label: 'KYC Approved' }, rejected: { color: 'bg-red-600', label: 'KYC Rejected' },
};

export default function Layout({ children }: { children: ReactNode }) {
  const { role, partyName, logout, kycStatus } = useApp();
  const items = navItems[role || ''] || [];
  const kyc = kycBadge[kycStatus] || kycBadge.none;

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">⚡</span></div>
            <span className="text-white font-bold text-lg">Sawa-X</span>
          </div>
        </div>
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${roleColors[role || '']}`} />
            <span className="text-white text-sm font-medium">{partyName}</span>
          </div>
          <span className="text-gray-500 text-xs">{role}</span>
          {role === 'Investor' && <div className={`mt-2 ${kyc.color} text-white text-xs px-2 py-0.5 rounded-full inline-block`}>{kyc.label}</div>}
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/admin' || item.to === '/operator' || item.to === '/investor'}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
              {item.icon}{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 w-full"><LogOut size={18} /> Sign Out</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto"><div className="p-6">{children}</div></div>
    </div>
  );
}
