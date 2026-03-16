import React, { useEffect, useState } from 'react';
import { Plus, FolderOpen, UserPlus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { queryContracts, createContract, exerciseChoice, TMPL } from '../../api/ledger';
import { useApp } from '../../context/AppContext';

const ADMIN_PARTY = 'Admin::1220e8d65081ace02e5f0a6781151f7990ffab43114dea256334e19b87cfb8b52f31';
const OPERATOR_PARTY = 'Operator::1220e8d65081ace02e5f0a6781151f7990ffab43114dea256334e19b87cfb8b52f31';
const INVESTOR_PARTY = 'Investor::1220e8d65081ace02e5f0a6781151f7990ffab43114dea256334e19b87cfb8b52f31';

export default function Portfolios() {
  const { addToast, triggerRefresh, refresh } = useApp();

  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddInv, setShowAddInv] = useState<string | null>(null);
  const [form, setForm] = useState({ region: 'South Africa', portfolioName: 'SA Solar Portfolio' });
  const [invParty, setInvParty] = useState(INVESTOR_PARTY);

  useEffect(() => {
    setLoading(true);
    queryContracts('Admin', TMPL.RegionalPortfolio)
      .then(setPortfolios)
      .catch(e => addToast('error', e.message))
      .finally(() => setLoading(false));
  }, [refresh]);

  const handleCreate = async () => {
    try {
      await createContract('Admin', TMPL.RegionalPortfolio, {
        admin:               ADMIN_PARTY,
        operator:            OPERATOR_PARTY,
        region:              form.region,
        portfolioName:       form.portfolioName,
        authorizedInvestors: [],
        projects:            [],
        archived:            false,
      });
      addToast('success', `Portfolio "${form.portfolioName}" created on ledger`);
      setShowCreate(false);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  const handleAddInvestor = async (contractId: string) => {
    try {
      await exerciseChoice('Admin', TMPL.RegionalPortfolio, contractId, 'AddInvestor', {
        investor: invParty,
      });
      addToast('success', `Investor allocated to portfolio`);
      setShowAddInv(null);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  return (
    <div>
      <PageHeader
        title="Regional Portfolios"
        subtitle="Create and manage regional investment portfolios"
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={14} /> New Portfolio
          </button>
        }
      />
      <div className="px-6 pb-6 space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50
            border border-slate-700 rounded-lg px-3 py-2 w-fit">
            <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent
              rounded-full animate-spin" />
            Loading from Canton ledger…
          </div>
        )}

        {!loading && portfolios.length === 0 && (
          <div className="card p-12 text-center">
            <FolderOpen size={32} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-400 text-sm">No portfolios yet. Create one to get started.</p>
          </div>
        )}

        {portfolios.map(p => (
          <div key={p.contractId} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FolderOpen size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">{p.payload.portfolioName}</h3>
                  {p.payload.archived && (
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                      Archived
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">Region: {p.payload.region}</p>
                <p className="text-xs text-slate-600 mt-0.5 font-mono truncate max-w-sm">
                  cid: {p.contractId.slice(0, 32)}…
                </p>
              </div>
              <button onClick={() => setShowAddInv(p.contractId)} className="btn-secondary">
                <UserPlus size={13} /> Add Investor
              </button>
            </div>

            {p.payload.authorizedInvestors?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">
                  Authorized Investors
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.payload.authorizedInvestors.map((inv: string) => (
                    <span key={inv} className="px-2 py-1 bg-emerald-900/30 text-emerald-300
                      text-xs rounded-lg border border-emerald-800/40 font-mono">
                      {inv.split('::')[0]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showCreate && (
        <Modal title="Create Regional Portfolio" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Region</label>
              <input className="input" value={form.region}
                onChange={e => setForm(f => ({ ...f, region: e.target.value }))} />
            </div>
            <div>
              <label className="label">Portfolio Name</label>
              <input className="input" value={form.portfolioName}
                onChange={e => setForm(f => ({ ...f, portfolioName: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate}>Create on Ledger</button>
            </div>
          </div>
        </Modal>
      )}

      {showAddInv && (
        <Modal title="Allocate Investor to Portfolio" onClose={() => setShowAddInv(null)}>
          <div className="space-y-4">
            <div>
              <label className="label">Investor Full Party ID</label>
              <input className="input text-xs" value={invParty}
                onChange={e => setInvParty(e.target.value)} />
              <p className="text-xs text-slate-500 mt-1">
                Default sandbox Investor party ID is pre-filled
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button className="btn-secondary" onClick={() => setShowAddInv(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => handleAddInvestor(showAddInv)}>
                Allocate on Ledger
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
