import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/backend';
import { RefreshCw, DollarSign, CheckCircle, AlertCircle, Lock, AlertTriangle, UserCheck, Coins } from 'lucide-react';

export default function InvestorYieldClaim() {
  const { partyName, kycStatus } = useApp();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Record<string, { type: 'success' | 'error'; msg: string }>>({});

  const load = async () => {
    setLoading(true);
    try { setClaims(await api.getYieldClaims(partyName)); } catch {}
    setLoading(false);
  };
  useEffect(() => { if (kycStatus === 'approved') load(); }, [partyName, kycStatus]);

  const claim = async (contractId: string) => {
    try {
      const result = await api.claimYield(contractId, partyName);
      if (result.error) {
        setFeedback(prev => ({ ...prev, [contractId]: { type: 'error', msg: result.error } }));
      } else {
        setFeedback(prev => ({ ...prev, [contractId]: { type: 'success', msg: 'Yield claimed successfully! Funds added to your account.' } }));
      }
      load();
      setTimeout(() => setFeedback(prev => { const n = { ...prev }; delete n[contractId]; return n; }), 4000);
    } catch (e: any) {
      setFeedback(prev => ({ ...prev, [contractId]: { type: 'error', msg: e.message } }));
    }
  };

  if (kycStatus !== 'approved') return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Yield Claims</h1>
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-8 max-w-lg">
        <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />
        <h2 className="text-white text-lg font-semibold mb-2">KYC Required</h2>
        <p className="text-gray-400 mb-4">Complete KYC to access yield claims.</p>
        {(kycStatus === 'none' || kycStatus === 'rejected') && (
          <button onClick={() => navigate('/investor/kyc')} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm flex items-center gap-2"><UserCheck size={16} /> Submit KYC</button>
        )}
      </div>
    </div>
  );

  const pendingClaims = claims.filter((c: any) => !c.payload.claimed);
  const claimedList = claims.filter((c: any) => c.payload.claimed);
  const totalClaimable = pendingClaims.reduce((s, c) => s + Number(c.payload.claimableAmount), 0);
  const totalClaimed = claimedList.reduce((s, c) => s + Number(c.payload.claimableAmount), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Yield Claims</h1>
          <p className="text-gray-500 text-sm">Claim your earned yield from operational projects</p>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-800/50 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Available to Claim</div>
          <div className="text-3xl font-bold text-green-400">${totalClaimable.toLocaleString()}</div>
          <div className="text-gray-500 text-xs">{pendingClaims.length} pending claims</div>
        </div>
        <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-800/50 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Total Claimed</div>
          <div className="text-3xl font-bold text-blue-400">${totalClaimed.toLocaleString()}</div>
          <div className="text-gray-500 text-xs">{claimedList.length} completed claims</div>
        </div>
      </div>

      {loading ? <p className="text-gray-500">Loading...</p> :
       claims.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Coins className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">No Yield Claims</h3>
          <p className="text-gray-500 text-sm">Yield claims are created by the admin once your projects generate revenue.</p>
          <p className="text-gray-600 text-xs mt-2">Earnings are automatically calculated from production data and the waterfall settlement.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Claims */}
          {pendingClaims.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <DollarSign size={16} className="text-green-400" /> Available Claims
              </h3>
              <div className="space-y-3">
                {pendingClaims.map((c: any) => {
                  const fb = feedback[c.contractId];
                  return (
                    <div key={c.contractId} className="bg-gray-900 border border-green-800/50 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-white font-medium">{c.payload.projectId}</div>
                          <div className="text-gray-500 text-xs">Yield from project operations</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-green-400 text-xl font-bold">${Number(c.payload.claimableAmount).toLocaleString()}</div>
                          </div>
                          <button onClick={() => claim(c.contractId)}
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2">
                            <DollarSign size={14} /> Claim
                          </button>
                        </div>
                      </div>
                      {fb && (
                        <div className={`mt-3 flex items-center gap-2 text-sm rounded-lg p-3 ${fb.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {fb.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {fb.msg}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Claimed History */}
          {claimedList.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-400" /> Claimed History
              </h3>
              <div className="space-y-2">
                {claimedList.map((c: any) => (
                  <div key={c.contractId} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-white text-sm">{c.payload.projectId}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">${Number(c.payload.claimableAmount).toLocaleString()}</span>
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">Claimed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
