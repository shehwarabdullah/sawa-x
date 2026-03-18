import React, { useEffect, useState } from 'react';
import { UserCheck, UserX, User } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { KYCBadge } from '../../components/Badge';
import { queryContracts, exerciseChoice, TMPL } from '../../api/ledger';
import { useApp } from '../../context/AppContext';

export default function KYCApprovals() {
  const { addToast, triggerRefresh, refresh } = useApp();

  const [pending,  setPending]  = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      queryContracts('Admin', TMPL.KYCRequest),
      queryContracts('Admin', TMPL.UserRole),
    ])
      .then(([reqs, roles]) => { setPending(reqs); setApproved(roles); })
      .catch(e => addToast('error', e.message))
      .finally(() => setLoading(false));
  }, [refresh]);

  const approve = async (contractId: string, name: string) => {
    try {
      await exerciseChoice('Admin', TMPL.KYCRequest, contractId, 'ApproveKYC', {});
      addToast('success', `KYC approved for ${name}`);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  const reject = async (contractId: string) => {
    try {
      await exerciseChoice('Admin', TMPL.KYCRequest, contractId, 'RejectKYC', {});
      addToast('info', 'KYC request rejected');
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  // Group approved by investor name for display
  const approvedByName = approved.reduce((acc: Record<string, any[]>, r) => {
    const name = r.payload.investor.split('::')[0];
    if (!acc[name]) acc[name] = [];
    acc[name].push(r);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="KYC Approvals"
        subtitle="Approve identity verification for all investors"
      />
      <div className="px-6 pb-6 space-y-6">

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50
            border border-slate-700 rounded-lg px-3 py-2 w-fit">
            <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent
              rounded-full animate-spin" />
            Loading from Canton ledger…
          </div>
        )}

        {/* Pending */}
        <div className="card">
          <div className="px-5 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">
              Pending KYC Requests
              {pending.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-amber-900/50 text-amber-300
                  text-xs rounded-full">{pending.length}</span>
              )}
            </h2>
          </div>
          {pending.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">
              No pending KYC requests
            </div>
          ) : pending.map(req => (
            <div key={req.contractId}
              className="px-5 py-4 border-b border-slate-800 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-900/30 flex items-center
                    justify-center flex-shrink-0 text-emerald-300 font-bold text-sm">
                    {req.payload.investor.split('::')[0].replace('Investor', 'I')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{req.payload.fullName}</p>
                    <p className="text-xs text-emerald-400 font-medium">
                      {req.payload.investor.split('::')[0]}
                    </p>
                    <p className="text-xs text-slate-500">Wallet: {req.payload.walletAddress}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Regions: {req.payload.requestedRegions?.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approve(req.contractId, req.payload.fullName)}
                    className="btn-primary">
                    <UserCheck size={14} /> Approve
                  </button>
                  <button onClick={() => reject(req.contractId)} className="btn-danger">
                    <UserX size={14} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Approved */}
        <div className="card">
          <div className="px-5 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">
              Approved Investors ({approved.length})
            </h2>
          </div>
          {approved.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">
              No approved investors yet
            </div>
          ) : approved.map(role => (
            <div key={role.contractId}
              className="px-5 py-3 flex items-center gap-3 border-b border-slate-800 last:border-0">
              <div className="w-9 h-9 rounded-full bg-emerald-900/30 flex items-center
                justify-center text-emerald-300 font-bold text-sm flex-shrink-0">
                {role.payload.investor.split('::')[0].replace('Investor', 'I')}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{role.payload.fullName}</p>
                <p className="text-xs text-emerald-400">
                  {role.payload.investor.split('::')[0]}
                </p>
                <p className="text-xs text-slate-500">
                  {role.payload.walletAddress} ·
                  Regions: {role.payload.authorizedRegions?.join(', ')}
                </p>
              </div>
              <KYCBadge verified={role.payload.kycVerified} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}