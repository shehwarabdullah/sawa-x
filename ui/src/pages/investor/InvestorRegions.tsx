import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../api/backend';
import { RefreshCw, Globe, Lock } from 'lucide-react';

export default function InvestorRegions() {
  const { partyName, kycStatus } = useApp();
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setRegions(await api.getMyRegions(partyName)); } catch {}
    setLoading(false);
  };
  useEffect(() => { if (kycStatus === 'approved') load(); }, [partyName, kycStatus]);

  if (kycStatus !== 'approved') return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">My Regions</h1>
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-8 text-center max-w-lg">
        <Lock className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <p className="text-gray-400">Complete KYC to view your regional allocations.</p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Regions</h1>
          <p className="text-gray-500 text-sm">Regional portfolios you have been allocated to by the admin</p>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
      </div>
      {loading ? <p className="text-gray-500">Loading...</p> :
       regions.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <Globe className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">No Regional Access</h3>
          <p className="text-gray-500 text-sm">The admin has not allocated you to any regional portfolio yet.</p>
          <p className="text-gray-600 text-xs mt-2">Contact your platform administrator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {regions.map((r: any) => (
            <div key={r.contractId} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
                <Globe size={20} className="text-green-400" />
              </div>
              <h3 className="text-white font-semibold text-lg">{r.payload.region}</h3>
              <p className="text-gray-500 text-sm mt-1">{r.payload.description}</p>
              <div className="mt-3 text-xs text-gray-400">
                {(r.payload.allocatedInvestors || []).length} investors in this region
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
