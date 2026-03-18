import React, { useEffect, useState } from 'react';
import { Briefcase, TrendingUp, Zap } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { SPVStateBadge } from '../../components/Badge';
import { queryContracts, TMPL } from '../../api/ledger';
import { useApp } from '../../context/AppContext';

export default function OperatorDashboard() {
  const { refresh, hash } = useApp();

  const [projects, setProjects] = useState<any[]>([]);
  const [reports,  setReports]  = useState<any[]>([]);
  const [yields,   setYields]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!hash) return;
    setLoading(true);
    Promise.all([
      queryContracts('Operator', TMPL.ProjectSPV).then(setProjects),
      queryContracts('Operator', TMPL.ProductionReport).then(setReports),
      queryContracts('Operator', TMPL.ClaimableYield).then(setYields),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refresh, hash]);

  const totalFunded = projects.reduce((s, p) => s + Number(p.payload.fundingRaised), 0);

  return (
    <div>
      <PageHeader title="Operator Dashboard" subtitle="Manage SPV projects and production data" />
      <div className="px-6 pb-6 space-y-6">

        {!hash && (
          <div className="card p-4 border-red-800/40 bg-red-950/30">
            <p className="text-sm text-red-300">
              ⚠ No Canton hash detected — click 🔄 in sidebar to connect
            </p>
          </div>
        )}

        {loading && hash && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Loading from Canton ledger…
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Projects"      value={projects.length}                     icon={<Briefcase size={16} />} />
          <StatCard label="Total Funding Raised" value={`$${totalFunded.toLocaleString()}`} icon={<TrendingUp size={16} />} color="text-blue-400" />
          <StatCard label="Production Reports"  value={reports.length}                      icon={<Zap size={16} />}      color="text-amber-400" />
        </div>

        {/* Operator checklist */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Operator Demo Checklist</h2>
          <ol className="space-y-3">
            {[
              { step: 6,  label: 'Create SPV Project (Draft)',          done: projects.length > 0 },
              { step: 7,  label: 'Propose to Admin for approval',       done: projects.some(p => p.payload.state !== 'Draft') },
              { step: 8,  label: 'Open Funding (after Admin approves)', done: projects.some(p => ['FundingOpen','Funded','Operational'].includes(p.payload.state)) },
              { step: 9,  label: 'Submit Production Report',            done: reports.length > 0 },
              { step: 10, label: 'Allocate Yield to Investors',         done: yields.length > 0 },
            ].map(({ step, label, done }) => (
              <li key={step} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                  ${done ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                  {done ? '✓' : step}
                </div>
                <span className={`text-sm ${done ? 'text-emerald-300 line-through decoration-emerald-700' : 'text-slate-300'}`}>
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Projects list */}
        {projects.length > 0 && (
          <div className="card">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">My Projects</h2>
            </div>
            <div className="divide-y divide-slate-800">
              {projects.map(p => {
                const pct = Number(p.payload.fundingTarget) > 0
                  ? (Number(p.payload.fundingRaised) / Number(p.payload.fundingTarget)) * 100 : 0;
                return (
                  <div key={p.contractId} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-white">{p.payload.projectName}</p>
                        <p className="text-xs text-slate-500">{p.payload.projectId} · {p.payload.region} · {p.payload.capacityMW}MW</p>
                      </div>
                      <SPVStateBadge state={p.payload.state} />
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>${Number(p.payload.fundingRaised).toLocaleString()} raised</span>
                      <span>${Number(p.payload.fundingTarget).toLocaleString()} target</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
