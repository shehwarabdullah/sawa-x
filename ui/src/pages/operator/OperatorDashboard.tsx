import React from 'react';
import { Briefcase, TrendingUp, Zap } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { SPVStateBadge } from '../../components/Badge';
import { mock, useApp } from '../../context/AppContext';

export default function OperatorDashboard() {
  const { refresh } = useApp();
  void refresh;
  const s = mock.store;

  const myProjects = s.projects;
  const totalFunded = myProjects.reduce((sum, p) => sum + p.fundingRaised, 0);

  return (
    <div>
      <PageHeader title="Operator Dashboard" subtitle="Manage SPV projects and production data" />
      <div className="px-6 pb-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Projects" value={myProjects.length} icon={<Briefcase size={16} />} />
          <StatCard label="Total Funding Raised" value={`$${totalFunded.toLocaleString()}`}
            icon={<TrendingUp size={16} />} color="text-blue-400" />
          <StatCard label="Production Reports" value={s.productionReports.length}
            icon={<Zap size={16} />} color="text-amber-400" />
        </div>

        {/* Operator demo flow */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Operator Demo Checklist</h2>
          <ol className="space-y-3">
            {[
              { step: 6, label: 'Create SPV Project (Draft)',       done: s.projects.length > 0 },
              { step: 7, label: 'Push SPV Proposal to Admin',       done: s.projects.some(p => p.state !== 'Draft') },
              { step: 8, label: 'Open Funding (after Admin approves)', done: s.projects.some(p => ['FundingOpen','Funded','Operational'].includes(p.state)) },
              { step: 9, label: 'Submit Production Report',         done: s.productionReports.length > 0 },
              { step: 10, label: 'Allocate Yield to Investors',     done: s.claimableYields.length > 0 },
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

        {myProjects.length > 0 && (
          <div className="card">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">My Projects</h2>
            </div>
            <div className="divide-y divide-slate-800">
              {myProjects.map(p => (
                <div key={p.contractId} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{p.projectName}</p>
                    <p className="text-xs text-slate-500">{p.projectId} · {p.region} · {p.capacityMW}MW</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-emerald-400">${p.fundingRaised.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">of ${p.fundingTarget.toLocaleString()}</p>
                    </div>
                    <SPVStateBadge state={p.state} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
