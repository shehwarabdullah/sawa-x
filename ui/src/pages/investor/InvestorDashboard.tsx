import React, { useEffect, useState } from 'react';
import { FileCheck, Briefcase, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { queryContracts, TMPL } from '../../api/ledger';
import { useApp } from '../../context/AppContext';

export default function InvestorDashboard() {
  const { partyId, partyName, refresh, hash } = useApp();

  const [myRole,     setMyRole]     = useState<any | null>(null);
  const [myApproval, setMyApproval] = useState<any | null>(null);
  const [myTokens,   setMyTokens]   = useState<any[]>([]);
  const [myYields,   setMyYields]   = useState<any[]>([]);
  const [kycPending, setKycPending] = useState(false);
  const [accPending, setAccPending] = useState(false);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!hash) return;
    setLoading(true);
    Promise.all([
      queryContracts('Investor', TMPL.UserRole),
      queryContracts('Investor', TMPL.KYCRequest),
      queryContracts('Investor', TMPL.AccessApproval),
      queryContracts('Investor', TMPL.AccessRequest),
      queryContracts('Investor', TMPL.SPVToken),
      queryContracts('Investor', TMPL.ClaimableYield),
    ]).then(([roles, kycReqs, approvals, accessReqs, tokens, yields]) => {
      setMyRole(roles.find(r => r.payload.investor === partyId) ?? null);
      setKycPending(kycReqs.some(r => r.payload.investor === partyId));
      setMyApproval(approvals.find(a => a.payload.investor === partyId) ?? null);
      setAccPending(accessReqs.some(r => r.payload.investor === partyId));
      setMyTokens(tokens.filter(t => t.payload.owner === partyId));
      setMyYields(yields.filter(y => y.payload.investor === partyId));
    })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refresh, partyId, hash]);

  const totalTokens = myTokens.reduce((s, t) => s + Number(t.payload.amount), 0);
  const totalYield  = myYields.reduce((s, y) => s + Number(y.payload.amount), 0);

  return (
    <div>
      <PageHeader
        title={`Investor Dashboard — ${partyName}`}
        subtitle="Your investment status and portfolio summary"
      />
      <div className="px-6 pb-6 space-y-6">

        {/* Investor identity card */}
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-900/40 flex items-center
            justify-center text-emerald-300 text-lg font-bold">
            {partyName.replace('Investor', 'I')}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{partyName}</p>
            {myRole ? (
              <>
                <p className="text-xs text-emerald-400">✓ KYC Verified — {myRole.payload.fullName}</p>
                <p className="text-xs text-slate-500">
                  Wallet: {myRole.payload.walletAddress} ·
                  Regions: {myRole.payload.authorizedRegions?.join(', ')}
                </p>
              </>
            ) : kycPending ? (
              <p className="text-xs text-amber-400">⏳ KYC pending Admin approval</p>
            ) : (
              <p className="text-xs text-slate-500">KYC not submitted — go to Request Access</p>
            )}
          </div>
          {myApproval && (
            <span className="text-xs text-emerald-400 bg-emerald-900/30 px-2 py-1
              rounded-lg border border-emerald-800/40">
              🔓 Access: {myApproval.payload.region}
            </span>
          )}
        </div>

        {!hash && (
          <div className="card p-4 border-red-800/40 bg-red-950/30">
            <p className="text-sm text-red-300">
              ⚠ No Canton hash — click 🔄 in sidebar
            </p>
          </div>
        )}

        {loading && hash && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Loading portfolio for {partyName}…
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Access Approvals" value={myApproval ? 1 : 0} icon={<FileCheck size={16} />} />
          <StatCard label="Tokens Held"       value={totalTokens.toLocaleString()} icon={<Briefcase size={16} />} color="text-blue-400" />
          <StatCard label="Claimable Yield"   value={`$${totalYield.toFixed(2)}`}  icon={<TrendingUp size={16} />} color="text-amber-400" />
        </div>

        {/* Investor flow checklist */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-white mb-4">
            {partyName} — Flow Checklist
          </h2>
          <ol className="space-y-3">
            {[
              { step: 1, label: 'Submit KYC request',       done: !!myRole || kycPending },
              { step: 2, label: 'KYC approved by Admin',    done: !!myRole },
              { step: 3, label: 'Request project access',   done: accPending || !!myApproval },
              { step: 4, label: 'Access approved by Admin', done: !!myApproval },
              { step: 5, label: 'Invest in a project',      done: totalTokens > 0 },
              { step: 6, label: 'Claim yield',              done: myYields.length === 0 && totalTokens > 0 },
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

        {/* Token holdings summary */}
        {myTokens.length > 0 && (
          <div className="card">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">Token Holdings</h2>
            </div>
            <div className="divide-y divide-slate-800">
              {myTokens.map(t => (
                <div key={t.contractId} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">{t.payload.projectId}</p>
                    <p className="text-xs text-slate-500">{t.payload.symbol}</p>
                  </div>
                  <p className="text-sm text-emerald-400 font-semibold">
                    {Number(t.payload.amount).toLocaleString()} tokens
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Claimable yields */}
        {myYields.length > 0 && (
          <div className="card">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">Claimable Yield</h2>
            </div>
            <div className="divide-y divide-slate-800">
              {myYields.map(y => (
                <div key={y.contractId} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{y.payload.projectId}</p>
                    <p className="text-xs text-slate-500">Period: {y.payload.periodEnd}</p>
                  </div>
                  <p className="text-sm text-emerald-400 font-bold">
                    ${Number(y.payload.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
