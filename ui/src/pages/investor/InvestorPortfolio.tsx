import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/backend';
import { RefreshCw, Briefcase, Coins, Lock } from 'lucide-react';

export default function InvestorPortfolio() {
  const { partyName, kycStatus } = useApp();
  const [investments, setInvestments] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [inv, tok] = await Promise.all([api.getInvestments(partyName), api.getTokens(partyName)]);
      setInvestments(inv); setTokens(tok);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { if (kycStatus === 'approved') load(); }, [partyName, kycStatus]);

  if (kycStatus !== 'approved') return (
    <div><h1 className="text-2xl font-bold text-white mb-6">My Portfolio</h1>
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-8 text-center max-w-lg">
        <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-4" /><p className="text-gray-400">Complete KYC to view your portfolio.</p>
      </div></div>
  );

  const totalInvested = investments.reduce((s, i) => s + Number(i.payload.amount), 0);
  const totalTokens = tokens.reduce((s, t) => s + Number(t.payload.tokenAmount), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Portfolio</h1>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-800/50 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Total Invested</div>
          <div className="text-2xl font-bold text-white">${totalInvested.toLocaleString()}</div>
          <div className="text-gray-500 text-xs">{investments.length} completed investments</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-800/50 rounded-xl p-5">
          <div className="text-gray-400 text-sm">Token Holdings</div>
          <div className="text-2xl font-bold text-white">${totalTokens.toLocaleString()}</div>
          <div className="text-gray-500 text-xs">{tokens.length} yield-bearing tokens</div>
        </div>
      </div>

      {loading ? <p className="text-gray-500">Loading...</p> :
       investments.length === 0 && tokens.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">No Investments Yet</h3>
          <p className="text-gray-500 text-sm">Complete tranche investments from the Projects page to see them here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Investments */}
          {investments.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center gap-2"><Briefcase size={16} /> Completed Investments</h3>
              <div className="space-y-2">
                {investments.map((inv: any) => (
                  <div key={inv.contractId} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center"><span className="text-green-400 font-bold text-xs">T{inv.payload.trancheIndex}</span></div>
                      <div>
                        <div className="text-white text-sm font-medium">{inv.payload.projectName}</div>
                        <div className="text-gray-500 text-xs">{inv.payload.projectId} · Tranche #{inv.payload.trancheIndex}</div>
                      </div>
                    </div>
                    <div className="text-white font-semibold">${Number(inv.payload.amount).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tokens */}
          {tokens.length > 0 && (
            <div>
              <h3 className="text-white font-medium mb-3 flex items-center gap-2"><Coins size={16} /> Yield-Bearing Tokens</h3>
              <div className="space-y-2">
                {tokens.map((tok: any) => (
                  <div key={tok.contractId} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center"><Coins size={14} className="text-yellow-400" /></div>
                      <div>
                        <div className="text-white text-sm font-medium">{tok.payload.projectName} Token</div>
                        <div className="text-gray-500 text-xs">{tok.payload.projectId} · Tranche #{tok.payload.trancheIndex}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">${Number(tok.payload.tokenAmount).toLocaleString()}</div>
                      <div className="text-yellow-400 text-xs">{(Number(tok.payload.yieldRate) * 100).toFixed(1)}% yield</div>
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
