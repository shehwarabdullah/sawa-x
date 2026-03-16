import React from 'react';
import { FileCheck, Briefcase, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { mock, useApp } from '../../context/AppContext';

export default function InvestorDashboard() {
  const { partyId, refresh } = useApp();
  void refresh;
  const s = mock.store;

  const myRole      = s.userRoles.find(r => r.investor === partyId);
  const myApprovals = s.accessApprovals.filter(a => a.investor === partyId);
  const myYields    = s.claimableYields.filter(y => y.investor === partyId);
  const myReg       = s.registries.find(r => r.holdings.some(([p]) => p === partyId));
  const myTokens    = myReg?.holdings.find(([p]) => p === partyId)?.[1] ?? 0;

  return (
    <div>
      <PageHeader title="Investor Dashboard" subtitle="View your investments and claimable yield" />
      <div className="px-6 pb-6 space-y-6">

        {/* KYC status */}
        <div className="card p-4 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center
            ${myRole ? 'bg-emerald-900/40' : 'bg-slate-800'}`}>
            <span className="text-lg">{myRole ? '✓' : '⏳'}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {myRole ? `KYC Verified – ${myRole.fullName}` : 'KYC Not Yet Approved'}
            </p>
            <p className="text-xs text-slate-500">
              {myRole
                ? `Wallet: ${myRole.walletAddress} · Regions: ${myRole.authorizedRegions.join(', ')}`
                : 'Switch to the Investor role and submit a KYC request'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Access Approvals" value={myApprovals.length} icon={<FileCheck size={16} />} />
          <StatCard label="SPV Tokens Held" value={myTokens.toLocaleString()}
            icon={<Briefcase size={16} />} color="text-blue-400" />
          <StatCard label="Claimable Yield" value={`$${myYields.reduce((s, y) => s + y.amount, 0).toFixed(2)}`}
            icon={<TrendingUp size={16} />} color="text-amber-400" />
        </div>

        {/* Investor flow checklist */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Investor Flow Checklist</h2>
          <ol className="space-y-3">
            {[
              { step: 1, label: 'Submit KYC request',            done: !!myRole || s.kycRequests.some(r => r.investor === partyId) },
              { step: 2, label: 'KYC approved by Admin',         done: !!myRole },
              { step: 3, label: 'Request project access',        done: s.accessRequests.some(r => r.investor === partyId) || myApprovals.length > 0 },
              { step: 4, label: 'Access approved by Admin',      done: myApprovals.length > 0 },
              { step: 5, label: 'View & invest in projects',     done: myTokens > 0 },
              { step: 6, label: 'Claim yield',                   done: s.claimableYields.filter(y => y.investor === partyId).length > 0 },
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

        {/* Claimable yields */}
        {myYields.length > 0 && (
          <div className="card">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">Claimable Yield</h2>
            </div>
            {myYields.map(y => (
              <div key={y.contractId} className="px-5 py-3 flex items-center justify-between border-b
                border-slate-800 last:border-0">
                <div>
                  <p className="text-sm text-white">{y.projectId}</p>
                  <p className="text-xs text-slate-500">Period ending {y.periodEnd}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-emerald-400 font-semibold">${y.amount.toFixed(2)}</p>
                  <button
                    onClick={() => { mock.claimYield(y.contractId); }}
                    className="btn-primary text-xs"
                  >
                    Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
