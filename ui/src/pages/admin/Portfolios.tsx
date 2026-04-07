import { useState, useEffect } from 'react';
import { api } from '../../api/backend';
import { DamlContract, RegionalPortfolio } from '../../types';
import { useApp } from '../../context/AppContext';
import { Plus, UserPlus } from 'lucide-react';

export default function Portfolios() {
  const { parties } = useApp();
  const [portfolios, setPortfolios] = useState<DamlContract<RegionalPortfolio>[]>([]);
  const [newRegion, setNewRegion] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [allocInvestor, setAllocInvestor] = useState('');
  const [allocCid, setAllocCid] = useState('');

  const load = () => api.getPortfolios().then(setPortfolios);
  useEffect(() => { load(); }, []);

  const investors = parties.filter(p => p.name.startsWith('Investor'));

  const createPortfolio = async () => {
    if (!newRegion) return;
    await api.createPortfolio(newRegion, newDesc);
    setNewRegion(''); setNewDesc('');
    load();
  };

  const allocate = async () => {
    if (!allocCid || !allocInvestor) return;
    await api.allocateInvestorPortfolio(allocCid, allocInvestor);
    setAllocCid(''); setAllocInvestor('');
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Regional Portfolios</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-white font-semibold mb-3">Create Portfolio</h2>
        <div className="flex gap-3">
          <input value={newRegion} onChange={e => setNewRegion(e.target.value)} placeholder="Region name"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" />
          <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" />
          <button onClick={createPortfolio} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {portfolios.map(p => (
          <div key={p.contractId} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-white font-semibold">{p.payload.region}</h3>
                <p className="text-gray-500 text-sm">{p.payload.description}</p>
              </div>
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">{p.payload.allocatedInvestors.length} investors</span>
            </div>
            <div className="text-gray-400 text-xs mb-3">
              Allocated: {p.payload.allocatedInvestors.map(inv => inv.split('::')[0]).join(', ') || 'none'}
            </div>
            <div className="flex gap-2">
              <select value={allocCid === p.contractId ? allocInvestor : ''} onChange={e => { setAllocCid(p.contractId); setAllocInvestor(e.target.value); }}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
                <option value="">Add investor...</option>
                {investors.map(inv => <option key={inv.name} value={inv.name}>{inv.name}</option>)}
              </select>
              {allocCid === p.contractId && allocInvestor && (
                <button onClick={allocate} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 flex items-center gap-1">
                  <UserPlus className="w-4 h-4" /> Allocate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
