import React, { useEffect, useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import { queryContracts, createContract, exerciseChoice, TMPL } from '../../api/ledger';
import { useApp } from '../../context/AppContext';

const OPERATOR_PARTY = 'Operator::1220e91ad516d0621a2c079e9f7adb09045bc330946156cf9a2595212bf814c22d60';
const INVESTOR_PARTY = 'Investor::1220e91ad516d0621a2c079e9f7adb09045bc330946156cf9a2595212bf814c22d60';
const SPV_PARTY      = 'SPV_METALEX::1220e91ad516d0621a2c079e9f7adb09045bc330946156cf9a2595212bf814c22d60';

const DEFAULT = {
  projectId:        'METALEX-001',
  periodStart:      '2026-01-01',
  periodEnd:        '2026-01-31',
  kWhProduced:      '50000',
  revenueGenerated: '7500',
  investorParty:    INVESTOR_PARTY,
};

export default function ProductionReports() {
  const { addToast, triggerRefresh, refresh } = useApp();

  const [reports,    setReports]    = useState<any[]>([]);
  const [yields,     setYields]     = useState<any[]>([]);
  const [registries, setRegistries] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState(DEFAULT);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      queryContracts('Operator', TMPL.ProductionReport).then(setReports),
      queryContracts('Operator', TMPL.ClaimableYield).then(setYields),
      queryContracts('Operator', TMPL.SPVTokenRegistry).then(setRegistries),
    ])
      .catch(e => addToast('error', e.message))
      .finally(() => setLoading(false));
  }, [refresh]);

  const handleCreate = async () => {
    try {
      await createContract('Operator', TMPL.ProductionReport, {
        operator:         OPERATOR_PARTY,
        spvParty:         SPV_PARTY,
        projectId:        form.projectId,
        periodStart:      form.periodStart,
        periodEnd:        form.periodEnd,
        kWhProduced:      form.kWhProduced,
        revenueGenerated: form.revenueGenerated,
        distributed:      false,
      });
      addToast('success', 'Production report submitted on ledger');
      setShowCreate(false);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  const allocate = async (reportCid: string, projectId: string) => {
    try {
      // Find the registry for this project
      const reg = registries.find(r => r.payload.projectId === projectId);
      if (!reg) throw new Error(`No token registry found for project ${projectId}`);

      await exerciseChoice('Operator', TMPL.ProductionReport, reportCid, 'AllocateYield', {
        registryCid:   reg.contractId,
        investorParty: form.investorParty,
      });
      addToast('success', `Yield allocated to ${form.investorParty.split('::')[0]}`);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  return (
    <div>
      <PageHeader
        title="Production Reports"
        subtitle="Submit production data and allocate yield on Canton"
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={14} /> New Report
          </button>
        }
      />
      <div className="px-6 pb-6 space-y-6">

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50
            border border-slate-700 rounded-lg px-3 py-2 w-fit">
            <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent
              rounded-full animate-spin" />
            Loading from Canton ledger…
          </div>
        )}

        {/* Reports */}
        <div className="card">
          <div className="px-5 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Production Reports</h2>
          </div>
          {reports.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">No reports yet</div>
          ) : reports.map(r => (
            <div key={r.contractId} className="px-5 py-4 border-b border-slate-800 last:border-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{r.payload.projectId}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {r.payload.periodStart} → {r.payload.periodEnd}
                  </p>
                  <div className="flex gap-6 mt-2">
                    <div>
                      <p className="text-xs text-slate-500">kWh Produced</p>
                      <p className="text-sm text-white font-medium">
                        {Number(r.payload.kWhProduced).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Revenue Generated</p>
                      <p className="text-sm text-emerald-400 font-medium">
                        ${Number(r.payload.revenueGenerated).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-mono">
                    cid: {r.contractId.slice(0, 24)}…
                  </p>
                </div>
                {!r.payload.distributed ? (
                  <button
                    onClick={() => allocate(r.contractId, r.payload.projectId)}
                    className="btn-primary text-xs">
                    <Zap size={12} /> Allocate Yield
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 bg-emerald-900/30 px-2 py-1
                    rounded-lg border border-emerald-800/40">
                    ✓ Distributed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Claimable Yields */}
        {yields.length > 0 && (
          <div className="card">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">
                Claimable Yield Contracts ({yields.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-800">
              {yields.map(y => (
                <div key={y.contractId} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{y.payload.projectId}</p>
                    <p className="text-xs text-slate-500">
                      Investor: {y.payload.investor.split('::')[0]} ·
                      Period end: {y.payload.periodEnd}
                    </p>
                  </div>
                  <p className="text-sm text-emerald-400 font-semibold">
                    ${Number(y.payload.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <Modal title="Submit Production Report" onClose={() => setShowCreate(false)} size="lg">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {([
                ['projectId',        'Project ID',                   'METALEX-001'],
                ['periodStart',      'Period Start',                 '2026-01-01'],
                ['periodEnd',        'Period End',                   '2026-01-31'],
                ['kWhProduced',      'kWh Produced',                 '50000'],
                ['revenueGenerated', 'Revenue Generated ($)',        '7500'],
              ] as [keyof typeof DEFAULT, string, string][]).map(([key, label, placeholder]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input className="input" value={form[key]} placeholder={placeholder}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="col-span-2">
                <label className="label">Investor Party (for yield allocation)</label>
                <input className="input text-xs" value={form.investorParty}
                  onChange={e => setForm(f => ({ ...f, investorParty: e.target.value }))} />
              </div>
            </div>
            <p className="text-xs text-slate-500 bg-slate-800 rounded-lg p-3">
              ℹ️ Dummy on-contract data for demo.
              Yield = (Investor Tokens / Total Supply) × Revenue Generated.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate}>Submit to Ledger</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
