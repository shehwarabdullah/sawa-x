import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderOpen, Briefcase,
  FileCheck, TrendingUp, Settings, ChevronDown, Zap, RefreshCw,
} from 'lucide-react';
import { useApp, InvestorId } from '../context/AppContext';
import { fetchAndStoreHash } from '../api/ledger';
import ToastStack from './ToastStack';

const adminNav = [
  { to: '/admin/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/kyc',         icon: Users,           label: 'KYC Approvals' },
  { to: '/admin/portfolios',  icon: FolderOpen,      label: 'Portfolios' },
  { to: '/admin/projects',    icon: Briefcase,       label: 'SPV Proposals' },
  { to: '/admin/access',      icon: FileCheck,       label: 'Access Requests' },
];

const operatorNav = [
  { to: '/operator/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/operator/projects',  icon: Briefcase,       label: 'My Projects' },
  { to: '/operator/reports',   icon: TrendingUp,      label: 'Production Reports' },
];

const investorNav = [
  { to: '/investor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/investor/access',    icon: FileCheck,       label: 'Request Access' },
  { to: '/investor/projects',  icon: Briefcase,       label: 'Projects' },
  { to: '/investor/portfolio', icon: FolderOpen,      label: 'My Portfolio' },
];

const NAV_MAP = { admin: adminNav, operator: operatorNav, investor: investorNav };

const ROLE_COLORS: Record<string, string> = {
  admin:    'bg-violet-900/50 text-violet-300 border-violet-700',
  operator: 'bg-blue-900/50 text-blue-300 border-blue-700',
  investor: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
};

const INVESTOR_OPTIONS: InvestorId[] = ['Investor1', 'Investor2', 'Investor3'];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { role, setRole, selectedInvestor, setSelectedInvestor,
          hash, setHash, addToast, triggerRefresh } = useApp();
  const nav = NAV_MAP[role];
  const [detecting, setDetecting] = useState(false);

  // Auto-detect hash on mount
  useEffect(() => {
    if (!hash) autoDetectHash();
  }, []);

  const autoDetectHash = async () => {
    setDetecting(true);
    try {
      const newHash = await fetchAndStoreHash();
      setHash(newHash);
      addToast('success', `Canton node detected: ${newHash.slice(0, 12)}…`);
      triggerRefresh();
    } catch {
      addToast('error', 'Could not detect Canton node. Is the JSON API running on :7575?');
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">Sawa-X</p>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Canton Demo</p>
          </div>
        </div>

        {/* Canton hash status */}
        <div className="px-3 pt-3 pb-1">
          <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700
            rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-2 h-2 rounded-full flex-shrink-0
                ${hash ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <p className="text-xs text-slate-400 truncate">
                {hash ? `${hash.slice(0, 12)}…` : 'No hash detected'}
              </p>
            </div>
            <button
              onClick={autoDetectHash}
              disabled={detecting}
              className="text-slate-500 hover:text-emerald-400 transition-colors ml-2 flex-shrink-0"
              title="Re-detect Canton node hash"
            >
              <RefreshCw size={12} className={detecting ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Role switcher */}
        <div className="px-3 py-3 border-b border-slate-800">
          <p className="label px-1">Active Role</p>
          <div className="relative">
            <select
              value={role}
              onChange={e => setRole(e.target.value as typeof role)}
              className={`w-full appearance-none text-xs font-medium px-3 py-2 rounded-lg border
                cursor-pointer focus:outline-none ${ROLE_COLORS[role]}`}
            >
              <option value="admin">Admin</option>
              <option value="operator">Operator</option>
              <option value="investor">Investor</option>
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-2.5 pointer-events-none opacity-60" />
          </div>

          {/* Investor sub-selector */}
          {role === 'investor' && (
            <div className="relative mt-2">
              <p className="label px-1">Investor Account</p>
              <select
                value={selectedInvestor}
                onChange={e => {
                  setSelectedInvestor(e.target.value as InvestorId);
                  triggerRefresh();
                }}
                className="w-full appearance-none text-xs font-medium px-3 py-2 rounded-lg
                  border cursor-pointer focus:outline-none
                  bg-emerald-900/30 text-emerald-200 border-emerald-700"
              >
                {INVESTOR_OPTIONS.map(inv => (
                  <option key={inv} value={inv}>{inv}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 bottom-2.5 pointer-events-none opacity-60" />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-emerald-600/15 text-emerald-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
              <Settings size={11} className="text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-300 font-medium capitalize">
                {role === 'investor' ? selectedInvestor : role}
              </p>
              <p className="text-[10px] text-slate-500">Sandbox Ledger</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      <ToastStack />
    </div>
  );
}