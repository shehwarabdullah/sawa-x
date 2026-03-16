import React, { useEffect, useState } from 'react';
import { Users, FolderOpen, Briefcase, FileCheck } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { SPVStateBadge } from '../../components/Badge';
import { queryContracts, TMPL } from '../../api/ledger';
import { useApp } from '../../context/AppContext';

export default function AdminDashboard() {
  const { refresh } = useApp();

  const [projects,   setProjects]   = useState<any[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [userRoles,  setUserRoles]  = useState<any[]>([]);
  const [kycReqs,    setKycReqs]    = useState<any[]>([]);
  const [accessReqs, setAccessReqs] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      queryContracts('Admin', TMPL.ProjectSPV).then(setProjects),
      queryContracts('Admin', TMPL.RegionalPortfolio).then(setPortfolios),
      queryContracts('Admin', TMPL.UserRole).then(setUserRoles),
      queryContracts('Admin', TMPL.KYCRequest).then(setKycReqs),
      queryContracts('Admin', TMPL.AccessRequest).then(setAccessReqs),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refresh]);

  const proposed    = projects.filter(p => p.payload.state === 'Proposed').length;
  const fundingOpen = projects.filter(p => p.payload.state === 'FundingOpen').length;
  const operational = projects.filter(p => p.payload.state === 'Operational').length;

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Sawa-X Regional Portfolio Platform · Live Canton Ledger"
      />

      {loading && (
        <div className="px-6 pb-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50
            border border-slate-700 rounded-lg px-3 py-2 w-fit">
            <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent
              rounded-full animate-spin" />
            Loading contracts from Canton ledger…
          </div>
        </div>
      )}

      <div className="px-6 pb-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Pending KYC"
            value={kycReqs.length}
            icon={<Users size={16} />}
            color="text-amber-400"
          />
          <StatCard
            label="Portfolios"
            value={portfolios.length}
            icon={<FolderOpen size={16} />}
            color="text-blue-400"
          />
          <StatCard
            label="SPV Proposals"
            value={proposed}
            icon={<Briefcase size={16} />}
            color="text-violet-400"
          />
          <StatCard
            label="Access Requests"
            value={accessReqs.length}
            icon={<FileCheck size={16} />}
            color="text-emerald-400"
          />
        </div>

        {/* Ledger health banner */}
        <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-800/40
          rounded-xl px-4 py-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs text-emerald-300 font-medium">
            Connected to Canton Sandbox · {projects.length + portfolios.length + userRoles.length} active contracts on ledger
          </p>
        </div>

        {/* Demo flow checklist */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Demo Flow Progress</h2>
          <ol className="space-y-3">
            {[
              {
                step: 1,
                label: 'Create Regional Portfolio',
                done: portfolios.length > 0,
              },
              {
                step: 2,
                label: 'Approve Investor KYC',
                done: userRoles.length > 0,
              },
              {
                step: 3,
                label: 'Allocate Portfolio to Investor',
                done: portfolios.some(p => p.payload.authorizedInvestors?.length > 0),
              },
              {
                step: 4,
                label: 'Approve SPV Proposal',
                done: projects.some(p =>
                  ['Approved','FundingOpen','Funded','Operational'].includes(p.payload.state)
                ),
              },
              {
                step: 5,
                label: 'Approve Investor Access Request',
                done: accessReqs.length === 0 && projects.length > 0,
              },
            ].map(({ step, label, done }) => (
              <li key={step} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center
                  text-xs font-bold flex-shrink-0
                  ${done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                  {done ? '✓' : step}
                </div>
                <span className={`text-sm
                  ${done
                    ? 'text-emerald-300 line-through decoration-emerald-700'
                    : 'text-slate-300'
                  }`}>
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Projects from ledger */}
        {projects.length > 0 && (
          <div className="card">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center
              justify-between">
              <h2 className="text-sm font-semibold text-white">
                Live Projects from Canton Ledger
              </h2>
              <div className="flex gap-3 text-xs text-slate-500">
                <span className="text-amber-400">{proposed} proposed</span>
                <span className="text-emerald-400">{fundingOpen} open</span>
                <span className="text-violet-400">{operational} operational</span>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
                  <th className="text-left px-5 py-2">Project</th>
                  <th className="text-left py-2">Region</th>
                  <th className="text-right py-2">Target (USDCx)</th>
                  <th className="text-right py-2">Raised</th>
                  <th className="text-right px-5 py-2">State</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.contractId}
                    className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-5 py-2 text-slate-200 font-medium">
                      {p.payload.projectName}
                    </td>
                    <td className="py-2 text-slate-400">{p.payload.region}</td>
                    <td className="py-2 text-right text-slate-300">
                      ${Number(p.payload.fundingTarget).toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-emerald-400">
                      ${Number(p.payload.fundingRaised).toLocaleString()}
                    </td>
                    <td className="px-5 py-2 text-right">
                      <SPVStateBadge state={p.payload.state} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* KYC Approved investors */}
        {userRoles.length > 0 && (
          <div className="card">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">
                KYC Verified Investors ({userRoles.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-800">
              {userRoles.map(r => (
                <div key={r.contractId}
                  className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">
                      {r.payload.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {r.payload.investor} · {r.payload.walletAddress}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-400 bg-emerald-900/30 px-2 py-1
                    rounded-lg border border-emerald-800/40">
                    ✓ KYC Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}