import React, { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { KYCBadge } from '../../components/Badge';
import { queryContracts, createContract, TMPL } from '../../api/ledger';
import { useApp, fullPartyId } from '../../context/AppContext';

export default function InvestorAccess() {
  const { addToast, triggerRefresh, refresh, partyId, partyName, hash } = useApp();

  const ADMIN_PARTY = fullPartyId('Admin', hash);

  const [myRole,      setMyRole]      = useState<any | null>(null);
  const [myKycReq,    setMyKycReq]    = useState<any | null>(null);
  const [myAccessReq, setMyAccessReq] = useState<any | null>(null);
  const [myApproval,  setMyApproval]  = useState<any | null>(null);
  const [loading,     setLoading]     = useState(true);

  const [kycForm, setKycForm] = useState({
    fullName:  partyName === 'Investor1' ? 'Alice Mwangi'
             : partyName === 'Investor2' ? 'Bob Kariuki'
             : 'Carol Osei',
    walletAddress: `0x${partyName}Wallet`,
    regions: 'South Africa',
  });

  const [accessForm, setAccessForm] = useState({
    region:  'South Africa',
    purpose: 'Reviewing renewable energy investment opportunities',
  });

  // Re-load when investor switches
  useEffect(() => {
    setKycForm({
      fullName:  partyName === 'Investor1' ? 'Alice Mwangi'
               : partyName === 'Investor2' ? 'Bob Kariuki'
               : 'Carol Osei',
      walletAddress: `0x${partyName}Wallet`,
      regions: 'South Africa',
    });
  }, [partyName]);

  useEffect(() => {
    if (!hash) return;
    setLoading(true);
    Promise.all([
      queryContracts('Investor', TMPL.UserRole),
      queryContracts('Investor', TMPL.KYCRequest),
      queryContracts('Investor', TMPL.AccessRequest),
      queryContracts('Investor', TMPL.AccessApproval),
    ]).then(([roles, kycReqs, accessReqs, approvals]) => {
      setMyRole(roles.find(r => r.payload.investor === partyId) ?? null);
      setMyKycReq(kycReqs.find(r => r.payload.investor === partyId) ?? null);
      setMyAccessReq(accessReqs.find(r => r.payload.investor === partyId) ?? null);
      setMyApproval(approvals.find(r => r.payload.investor === partyId) ?? null);
    })
      .catch(e => addToast('error', e.message))
      .finally(() => setLoading(false));
  }, [refresh, partyId, hash]);

  const submitKYC = async () => {
    if (myRole)   { addToast('info', `${partyName} already KYC verified`); return; }
    if (myKycReq) { addToast('info', 'KYC request already pending'); return; }
    try {
      await createContract('Investor', TMPL.KYCRequest, {
        investor:         partyId,
        admin:            ADMIN_PARTY,
        fullName:         kycForm.fullName,
        walletAddress:    kycForm.walletAddress,
        requestedRegions: kycForm.regions.split(',').map(s => s.trim()),
      });
      addToast('success', `KYC request submitted for ${partyName}`);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  const submitAccess = async () => {
    if (!myRole)    { addToast('error', 'Complete KYC first'); return; }
    if (myAccessReq){ addToast('info', 'Access request already pending'); return; }
    if (myApproval) { addToast('info', 'Access already granted'); return; }
    try {
      await createContract('Investor', TMPL.AccessRequest, {
        investor:     partyId,
        admin:        ADMIN_PARTY,
        investorName: myRole.payload.fullName,
        region:       accessForm.region,
        purpose:      accessForm.purpose,
      });
      addToast('success', 'Access request submitted to Admin');
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  return (
    <div>
      <PageHeader
        title={`Request Access — ${partyName}`}
        subtitle="Step 1: KYC · Step 2: Project Access"
      />
      <div className="px-6 pb-6 space-y-6">

        {/* Current investor indicator */}
        <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700
          rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-emerald-900/50 flex items-center
            justify-center text-emerald-300 text-sm font-bold">
            {partyName.replace('Investor', 'I')}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{partyName}</p>
            <p className="text-xs text-slate-500 font-mono">
              {partyId.slice(0, 30)}…
            </p>
          </div>
          <p className="text-xs text-slate-500 ml-auto">
            Switch investor in the sidebar
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent
              rounded-full animate-spin" />
            Loading ledger state for {partyName}…
          </div>
        )}

        {/* KYC Card */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">
              Step 1 – Identity Verification (KYC)
            </h2>
            {myRole ? <KYCBadge verified /> : myKycReq ? (
              <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-1
                rounded-lg border border-amber-800/40">⏳ Pending Admin Review</span>
            ) : null}
          </div>

          {myRole ? (
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-4">
              <p className="text-sm text-emerald-300 font-medium">✓ KYC Approved on Ledger</p>
              <p className="text-xs text-slate-400 mt-1">Name: {myRole.payload.fullName}</p>
              <p className="text-xs text-slate-400">Wallet: {myRole.payload.walletAddress}</p>
              <p className="text-xs text-slate-400">
                Regions: {myRole.payload.authorizedRegions?.join(', ')}
              </p>
            </div>
          ) : myKycReq ? (
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4">
              <p className="text-sm text-amber-300">KYC request on ledger — awaiting Admin</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                cid: {myKycReq.contractId.slice(0, 24)}…
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" value={kycForm.fullName}
                    onChange={e => setKycForm(f => ({ ...f, fullName: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Wallet Address</label>
                  <input className="input" value={kycForm.walletAddress}
                    onChange={e => setKycForm(f => ({ ...f, walletAddress: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Requested Regions</label>
                <input className="input" value={kycForm.regions}
                  onChange={e => setKycForm(f => ({ ...f, regions: e.target.value }))} />
              </div>
              <button onClick={submitKYC} className="btn-primary w-full justify-center">
                <Send size={14} /> Submit KYC for {partyName}
              </button>
            </div>
          )}
        </div>

        {/* Access Card */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">
              Step 2 – Request Project Access
            </h2>
            {myApproval && (
              <span className="text-xs text-emerald-400 bg-emerald-900/30 px-2 py-1
                rounded-lg border border-emerald-800/40">✓ Access Granted</span>
            )}
          </div>

          {!myRole && (
            <p className="text-sm text-slate-500 py-4 text-center">
              Complete KYC first
            </p>
          )}

          {myRole && myApproval && (
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-4">
              <p className="text-sm text-emerald-300 font-medium">
                ✓ Access Approved for {myApproval.payload.region}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You can now view and invest in projects in this region.
              </p>
            </div>
          )}

          {myRole && myAccessReq && !myApproval && (
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4">
              <p className="text-sm text-amber-300">Access request pending Admin approval…</p>
            </div>
          )}

          {myRole && !myAccessReq && !myApproval && (
            <div className="space-y-3">
              <div>
                <label className="label">Region</label>
                <input className="input" value={accessForm.region}
                  onChange={e => setAccessForm(f => ({ ...f, region: e.target.value }))} />
              </div>
              <div>
                <label className="label">Purpose</label>
                <textarea className="input resize-none h-20" value={accessForm.purpose}
                  onChange={e => setAccessForm(f => ({ ...f, purpose: e.target.value }))} />
              </div>
              <button onClick={submitAccess} className="btn-primary w-full justify-center">
                <Send size={14} /> Request Access for {partyName}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}