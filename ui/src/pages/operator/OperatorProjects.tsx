import React, { useEffect, useState } from 'react';
import { Plus, Send, Unlock, Lock, Zap } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { SPVStateBadge } from '../../components/Badge';
import { queryContracts, createContract, exerciseChoice, TMPL } from '../../api/ledger';
import { useApp } from '../../context/AppContext';

const OPERATOR_PARTY = 'Operator::1220e8d65081ace02e5f0a6781151f7990ffab43114dea256334e19b87cfb8b52f31';
const ADMIN_PARTY    = 'Admin::1220e8d65081ace02e5f0a6781151f7990ffab43114dea256334e19b87cfb8b52f31';
const SPV_PARTY      = 'SPV_METALEX::1220e8d65081ace02e5f0a6781151f7990ffab43114dea256334e19b87cfb8b52f31';

const DEFAULT_FORM = {
  projectId:     'METALEX-001',
  projectName:   'METALEX 4MW Solar',
  region:        'South Africa',
  trancheNumber: '1',
  capacityMW:    '4.0',
  ppaTariff:     '0.15',
  fundingTarget: '1000000',
  tokenSymbol:   'METALEX-T1',
  tokenPrice:    '1.0',
  spvParty:      SPV_PARTY,
};

export default function OperatorProjects() {
  const { addToast, triggerRefresh, refresh } = useApp();

  const [projects,    setProjects]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [form,        setForm]        = useState(DEFAULT_FORM);

  useEffect(() => {
    setLoading(true);
    queryContracts('Operator', TMPL.ProjectSPV)
      .then(setProjects)
      .catch(e => addToast('error', e.message))
      .finally(() => setLoading(false));
  }, [refresh]);

  const handleCreate = async () => {
    try {
      // Create SPV project
      await createContract('Operator', TMPL.ProjectSPV, {
        operator:      OPERATOR_PARTY,
        admin:         ADMIN_PARTY,
        spvParty:      form.spvParty,
        projectId:     form.projectId,
        projectName:   form.projectName,
        region:        form.region,
        trancheNumber: form.trancheNumber ? parseInt(form.trancheNumber) : null,
        capacityMW:    form.capacityMW,
        ppaTariff:     form.ppaTariff,
        fundingTarget: form.fundingTarget,
        fundingRaised: '0.0',
        state:         'Draft',
        tokenSymbol:   form.tokenSymbol,
        tokenPrice:    form.tokenPrice,
      });

      // Create token registry
      await createContract('Operator', TMPL.SPVTokenRegistry, {
        operator:   OPERATOR_PARTY,
        spvParty:   form.spvParty,
        projectId:  form.projectId,
        totalSupply: '0.0',
        holdings:   [],
      });

      addToast('success', `Project "${form.projectName}" created on ledger`);
      setShowCreate(false);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  const transition = async (
    contractId: string,
    choice: string,
    msg: string,
  ) => {
    try {
      await exerciseChoice('Operator', TMPL.ProjectSPV, contractId, choice, {});
      addToast('success', msg);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  return (
    <div>
      <PageHeader
        title="My SPV Projects"
        subtitle="Create, propose, and manage project lifecycle on Canton"
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={14} /> New Project
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

        {!loading && projects.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-slate-400 text-sm">No projects yet. Create your first SPV project.</p>
          </div>
        )}

        {projects.map(p => {
          const pct = Number(p.payload.fundingTarget) > 0
            ? (Number(p.payload.fundingRaised) / Number(p.payload.fundingTarget)) * 100
            : 0;

          return (
            <div key={p.contractId} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-white">{p.payload.projectName}</h3>
                    <SPVStateBadge state={p.payload.state} />
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {[
                      ['Project ID',  p.payload.projectId],
                      ['Region',      p.payload.region],
                      ['Capacity',    `${p.payload.capacityMW} MW`],
                      ['PPA Tariff',  `$${p.payload.ppaTariff}/kWh`],
                      ['Target',      `$${Number(p.payload.fundingTarget).toLocaleString()}`],
                      ['Raised',      `$${Number(p.payload.fundingRaised).toLocaleString()}`],
                      ['Token',       p.payload.tokenSymbol],
                      ['Price',       `$${p.payload.tokenPrice}`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-xs text-slate-500">{k}</p>
                        <p className="text-xs text-white font-medium">{v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Funding bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Funding Progress</span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400
                        rounded-full transition-all"
                        style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-mono">
                    cid: {p.contractId.slice(0, 32)}…
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 min-w-[140px]">
                  {p.payload.state === 'Draft' && (
                    <button
                      onClick={() => transition(p.contractId, 'Propose',
                        `"${p.payload.projectName}" proposed to Admin`)}
                      className="btn-primary text-xs">
                      <Send size={12} /> Propose
                    </button>
                  )}
                  {p.payload.state === 'Approved' && (
                    <button
                      onClick={() => transition(p.contractId, 'OpenFunding', 'Funding opened')}
                      className="btn-primary text-xs">
                      <Unlock size={12} /> Open Funding
                    </button>
                  )}
                  {p.payload.state === 'FundingOpen' && (
                    <button
                      onClick={() => transition(p.contractId, 'CloseFunding', 'Funding closed')}
                      className="btn-secondary text-xs">
                      <Lock size={12} /> Close Funding
                    </button>
                  )}
                  {p.payload.state === 'Funded' && (
                    <button
                      onClick={() => transition(p.contractId, 'MakeOperational',
                        'Project is now Operational')}
                      className="btn-primary text-xs">
                      <Zap size={12} /> Make Operational
                    </button>
                  )}
                  {p.payload.state === 'Proposed' && (
                    <p className="text-xs text-slate-500 text-center py-2">
                      Awaiting Admin approval…
                    </p>
                  )}
                  {p.payload.state === 'Operational' && (
                    <p className="text-xs text-emerald-400 text-center py-2">
                      ✓ Live & Operational
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <Modal title="Create SPV Project on Ledger" onClose={() => setShowCreate(false)} size="lg">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {([
                ['projectId',     'Project ID',           'METALEX-001'],
                ['projectName',   'Project Name',         'METALEX 4MW Solar'],
                ['region',        'Region',               'South Africa'],
                ['trancheNumber', 'Tranche Number',       '1'],
                ['capacityMW',    'Capacity (MW)',        '4.0'],
                ['ppaTariff',     'PPA Tariff ($/kWh)',   '0.15'],
                ['fundingTarget', 'Funding Target ($)',   '1000000'],
                ['tokenSymbol',   'Token Symbol',         'METALEX-T1'],
                ['tokenPrice',    'Token Price ($)',      '1.0'],
              ] as [keyof typeof DEFAULT_FORM, string, string][]).map(([key, label, placeholder]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input className="input" value={form[key]} placeholder={placeholder}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate}>Create on Ledger</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
