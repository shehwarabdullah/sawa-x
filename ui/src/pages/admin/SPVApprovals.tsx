import React, { useEffect, useState } from 'react';
import { api } from '../../api/backend';
import { DamlContract, SPVProposal } from '../../types';
import { CheckCircle, RefreshCw } from 'lucide-react';

export default function SPVApprovals() {
  const [proposals, setProposals] = useState<DamlContract<SPVProposal>[]>([]);
  const load = async () => { try { setProposals(await api.getSPVProposals()); } catch {} };
  useEffect(() => { load(); }, []);
  const approve = async (id: string) => { await api.approveSPV(id); load(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">SPV Approvals</h1>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
      </div>
      {proposals.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400">No pending SPV proposals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <div key={p.contractId} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-white font-medium text-lg">{p.payload.name}</div>
                  <div className="text-gray-500 text-sm mb-2">{p.payload.description}</div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-400">Region: <span className="text-white">{p.payload.region}</span></span>
                    <span className="text-gray-400">Total: <span className="text-green-400">${Number(p.payload.totalFunding).toLocaleString()}</span></span>
                    <span className="text-gray-400">Tranche: <span className="text-white">${Number(p.payload.trancheSize).toLocaleString()}</span></span>
                  </div>
                </div>
                <button onClick={() => approve(p.contractId)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1">
                  <CheckCircle size={14} /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
