import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, FileCheck } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { queryContracts, exerciseChoice, TMPL } from '../../api/ledger';
import { useApp } from '../../context/AppContext';

export default function AccessRequests() {
  const { addToast, triggerRefresh, refresh } = useApp();

  const [pending,  setPending]  = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      queryContracts('Admin', TMPL.AccessRequest),
      queryContracts('Admin', TMPL.AccessApproval),
    ])
      .then(([reqs, approvals]) => { setPending(reqs); setApproved(approvals); })
      .catch(e => addToast('error', e.message))
      .finally(() => setLoading(false));
  }, [refresh]);

  const approve = async (contractId: string, investorName: string) => {
    try {
      await exerciseChoice('Admin', TMPL.AccessRequest, contractId, 'ApproveAccess', {});
      addToast('success', `Access approved for ${investorName}`);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  const reject = async (contractId: string) => {
    try {
      await exerciseChoice('Admin', TMPL.AccessRequest, contractId, 'RejectAccess', {});
      addToast('info', 'Access request rejected');
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  return (
    <div>
      <PageHeader
        title="Access Requests"
        subtitle="Grant investors access to view regional projects"
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

        <div className="card">
          <div className="px-5 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">
              Pending Access Requests
              {pending.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-amber-900/50 text-amber-300
                  text-xs rounded-full">{pending.length}</span>
              )}
            </h2>
          </div>
          {pending.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">
              No pending requests
            </div>
          ) : pending.map(req => (
            <div key={req.contractId}
              className="px-5 py-4 border-b border-slate-800 last:border-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center
                    justify-center text-violet-300 font-bold text-sm">
                    {req.payload.investor.split('::')[0].replace('Investor', 'I')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {req.payload.investorName}
                    </p>
                    <p className="text-xs text-violet-400 font-medium">
                      {req.payload.investor.split('::')[0]}
                    </p>
                    <p className="text-xs text-slate-500">
                      Region: <span className="text-slate-300">{req.payload.region}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Purpose: {req.payload.purpose}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approve(req.contractId, req.payload.investorName)}
                    className="btn-primary">
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button onClick={() => reject(req.contractId)} className="btn-danger">
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {approved.length > 0 && (
          <div className="card">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">
                Granted Approvals ({approved.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-800">
              {approved.map(a => (
                <div key={a.contractId}
                  className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-900/30 flex items-center
                    justify-center text-emerald-300 text-xs font-bold">
                    {a.payload.investor.split('::')[0].replace('Investor', 'I')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">
                      {a.payload.investor.split('::')[0]}
                    </p>
                    <p className="text-xs text-slate-500">Region: {a.payload.region}</p>
                  </div>
                  <span className="text-xs text-emerald-400 bg-emerald-900/30 px-2 py-1
                    rounded-lg border border-emerald-800/40">✓ Approved</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}