import React, { useEffect, useState } from 'react';
import { api } from '../../api/backend';
import { RefreshCw, Plus, CheckCircle, DollarSign } from 'lucide-react';

export default function YieldManagement() {
  const [claims, setClaims] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [selProject, setSelProject] = useState('');
  const [selInvestor, setSelInvestor] = useState('Investor1');
  const [amount, setAmount] = useState(500);
  const [feedback, setFeedback] = useState('');

  const load = async () => {
    try {
      const [c, p, i] = await Promise.all([api.getYieldClaims(), api.getProjects(), api.getInvestments()]);
      setClaims(c); setProjects(p); setInvestments(i);
      if (p.length > 0 && !selProject) setSelProject(p[0].payload.projectId);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!selProject || amount <= 0) return;
    await api.createYieldClaim(selInvestor, selProject, amount);
    setFeedback(`Yield claim of $${amount} created for ${selInvestor}`);
    load();
    setTimeout(() => setFeedback(''), 4000);
  };

  // Get investors who have invested in the selected project
  const projectInvestors = [...new Set(investments.filter((i: any) => i.payload.projectId === selProject).map((i: any) => i.payload.investor.split('::')[0]))];

  const pendingClaims = claims.filter((c: any) => !c.payload.claimed);
  const claimedClaims = claims.filter((c: any) => c.payload.claimed);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Yield Management</h1>
          <p className="text-gray-500 text-sm">Create yield claims for investors based on production revenue</p>
        </div>
        <button onClick={load} className="text-gray-400 hover:text-white"><RefreshCw size={18} /></button>
      </div>

      {/* Create Yield Claim */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h3 className="text-white font-medium mb-3">Create Yield Claim</h3>
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Project</label>
            <select value={selProject} onChange={e => setSelProject(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
              {projects.map((p: any) => <option key={p.payload.projectId} value={p.payload.projectId}>{p.payload.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Investor</label>
            <select value={selInvestor} onChange={e => setSelInvestor(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
              {projectInvestors.length > 0 ? (
                projectInvestors.map(inv => <option key={inv} value={inv}>{inv}</option>)
              ) : (
                <><option value="Investor1">Investor1</option><option value="Investor2">Investor2</option><option value="Investor3">Investor3</option></>
              )}
            </select>
          </div>
          <div>
            <label className="text-gray-500 text-xs mb-1 block">Claimable Amount ($)</label>
            <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min={1}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
          </div>
          <div className="flex items-end">
            <button onClick={create} className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 justify-center">
              <Plus size={14} /> Create Claim
            </button>
          </div>
        </div>

        {feedback && (
          <div className="bg-green-500/10 text-green-400 rounded-lg p-3 flex items-center gap-2 text-sm">
            <CheckCircle size={14} /> {feedback}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-gray-500 text-xs">Total Claims</div>
          <div className="text-xl font-bold text-white">{claims.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-gray-500 text-xs">Pending</div>
          <div className="text-xl font-bold text-yellow-400">{pendingClaims.length} (${pendingClaims.reduce((s, c) => s + Number(c.payload.claimableAmount), 0).toLocaleString()})</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-gray-500 text-xs">Claimed</div>
          <div className="text-xl font-bold text-green-400">{claimedClaims.length} (${claimedClaims.reduce((s, c) => s + Number(c.payload.claimableAmount), 0).toLocaleString()})</div>
        </div>
      </div>

      {/* Claims List */}
      <h3 className="text-white font-medium mb-3">All Yield Claims</h3>
      {claims.length === 0 ? (
        <p className="text-gray-500 text-sm">No yield claims created yet. Create one above based on production revenue.</p>
      ) : (
        <div className="space-y-2">
          {claims.map((c: any) => (
            <div key={c.contractId} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.payload.claimed ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                  <DollarSign size={14} className={c.payload.claimed ? 'text-green-400' : 'text-yellow-400'} />
                </div>
                <div>
                  <div className="text-white text-sm">{c.payload.investor.split('::')[0]} — {c.payload.projectId}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">${Number(c.payload.claimableAmount).toLocaleString()}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${c.payload.claimed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {c.payload.claimed ? 'Claimed' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
