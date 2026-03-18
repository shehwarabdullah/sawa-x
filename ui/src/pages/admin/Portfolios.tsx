import React, { useEffect, useState } from 'react';
import { Plus, FolderOpen, UserPlus, Briefcase } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { SPVStateBadge } from '../../components/Badge';
import { queryContracts, createContract, exerciseChoice, TMPL } from '../../api/ledger';
import { useApp, fullPartyId } from '../../context/AppContext';

const INVESTOR_OPTIONS = ['Investor1', 'Investor2', 'Investor3'];

export default function Portfolios() {
  const { addToast, triggerRefresh, refresh, hash } = useApp();

  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [projects,   setProjects]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddInv, setShowAddInv] = useState<string | null>(null);
  const [form,       setForm]       = useState({ region: 'South Africa', portfolioName: 'SA Solar Portfolio' });
  const [invName,    setInvName]    = useState('Investor1');

  const ADMIN_PARTY    = fullPartyId('Admin', hash);
  const OPERATOR_PARTY = fullPartyId('Operator', hash);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      queryContracts('Admin', TMPL.RegionalPortfolio),
      queryContracts('Admin', TMPL.ProjectSPV),
    ])
      .then(([ports, projs]) => { setPortfolios(ports); setProjects(projs); })
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
      addToast('success', `Portfolio "${form.portfolioName}" created`);
      setShowCreate(false);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  const handleAddInvestor = async (cid: string) => {
    try {
      const investorPartyId = fullPartyId(invName, hash);
      await exerciseChoice('Admin', TMPL.RegionalPortfolio, cid, 'AddInvestor', {
        investor: investorPartyId,
      });
      addToast('success', `${invName} allocated to portfolio`);
      setShowAddInv(null);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  return (
    <div>
      <PageHeader
        title="Regional Portfolios"
        subtitle="Portfolios contain projects — investors see projects in their authorized portfolio"
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
            <p className="text-slate-400 text-sm">
              No portfolios yet. Create one to group projects by region.
            </p>
          </div>
        )}

        {portfolios.map(p => {
          // Find projects in this portfolio's region
          const portfolioProjects = p.payload.projects ?? [];
          const linkedProjects = projects.filter(proj =>
            portfolioProjects.includes(proj.payload.projectId)
          );
          const authorizedInvestors: string[] = p.payload.authorizedInvestors ?? [];

          return (
            <div key={p.contractId} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FolderOpen size={16} className="text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">{p.payload.portfolioName}</h3>
                    {p.payload.archived && (
                      <span className="text-xs text-slate-500 bg-slate-800
                        px-2 py-0.5 rounded-full">Archived</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Region: {p.payload.region}</p>
                </div>
                <button onClick={() => setShowAddInv(p.contractId)} className="btn-secondary">
                  <UserPlus size={13} /> Add Investor
                </button>
              </div>

              {/* Authorized Investors */}
              {authorizedInvestors.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">
                    Authorized Investors ({authorizedInvestors.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {authorizedInvestors.map((inv: string) => (
                      <span key={inv}
                        className="px-2 py-1 bg-emerald-900/30 text-emerald-300 text-xs
                          rounded-lg border border-emerald-800/40">
                        {inv.split('::')[0]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects in Portfolio */}
              <div className="border-t border-slate-800 pt-4">
                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">
                  Projects ({linkedProjects.length})
                </p>
                {linkedProjects.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">
                    No projects yet — approve an SPV proposal for region "{p.payload.region}"
                    to automatically add it here
                  </p>
                ) : (
                  <div className="space-y-2">
                    {linkedProjects.map(proj => (
                      <div key={proj.contractId}
                        className="flex items-center justify-between bg-slate-800/50
                          rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Briefcase size={13} className="text-slate-400" />
                          <div>
                            <p className="text-xs text-white font-medium">
                              {proj.payload.projectName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {proj.payload.projectId} · {proj.payload.capacityMW}MW
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-slate-400">
                            ${Number(proj.payload.fundingRaised).toLocaleString()} /
                            ${Number(proj.payload.fundingTarget).toLocaleString()}
                          </p>
                          <SPVStateBadge state={proj.payload.state} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create Regional Portfolio" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="label">Region</label>
              <input className="input" value={form.region}
                onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                placeholder="e.g. South Africa" />
            </div>
            <div>
              <label className="label">Portfolio Name</label>
              <input className="input" value={form.portfolioName}
                onChange={e => setForm(f => ({ ...f, portfolioName: e.target.value }))} />
            </div>
            <p className="text-xs text-slate-500 bg-slate-800 rounded-lg p-3">
              💡 Projects are automatically linked to this portfolio when Admin approves
              an SPV proposal with matching region.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate}>Create on Ledger</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Investor Modal */}
      {showAddInv && (
        <Modal title="Authorize Investor for Portfolio" onClose={() => setShowAddInv(null)}>
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Select which investor account to authorize. They will be able to view and invest
              in all projects within this portfolio's region.
            </p>
            <div>
              <label className="label">Investor Account</label>
              <select
                value={invName}
                onChange={e => setInvName(e.target.value)}
                className="input"
              >
                {INVESTOR_OPTIONS.map(inv => (
                  <option key={inv} value={inv}>{inv}</option>
                ))}
              </select>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3">
              <p className="text-xs text-slate-400">Full party ID:</p>
              <p className="text-xs text-slate-300 font-mono mt-1 break-all">
                {fullPartyId(invName, hash)}
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button className="btn-secondary" onClick={() => setShowAddInv(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => handleAddInvestor(showAddInv)}>
                Authorize Investor
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}