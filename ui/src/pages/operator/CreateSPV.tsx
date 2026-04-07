import React, { useState, useEffect } from 'react';
import { api } from '../../api/backend';
import { Send, CheckCircle } from 'lucide-react';

export default function CreateSPV() {
  const [regions, setRegions] = useState<any[]>([]);
  const [form, setForm] = useState({
    projectId: '', name: '', description: '', region: '',
    ppaTariff: 0.12, yieldRate: 0.08, durationYears: 25,
    capacityMW: 4, offTakerName: '', tariffEscalatorPct: 2.5,
    totalCapEx: 1200000, totalDebt: 0, annualOMCost: 24000,
    devFeePct: 5, mgmtFeePct: 1, operatorEquityPct: 40, investorHurdleIRR: 12
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.getRegions().then((r: any) => {
      setRegions(r || []);
      if (r?.length > 0 && !form.region) setForm(prev => ({ ...prev, region: r[0].region }));
    }).catch(() => {});
  }, []);

  const set = (k: string, v: string | number) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async () => {
    if (!form.projectId || !form.name || !form.region) return;
    await api.createSPV(form as any);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const devFeeAmt = form.totalCapEx * form.devFeePct / 100;
  const fundingTarget = form.operatorEquityPct < 100 ? (form.totalCapEx - form.totalDebt) / (1 - form.operatorEquityPct / 100) : form.totalCapEx;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Create SPV Proposal</h1>
      <div className="space-y-6 max-w-3xl">

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Project Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Project ID *</label>
              <input value={form.projectId} onChange={e => set('projectId', e.target.value)} placeholder="e.g. SOLAR-002" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Project Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. 4MW Solar Farm" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-gray-400 text-sm mb-1 block">Description</label>
              <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Project description" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Region (linked to portfolio) *</label>
              <select value={form.region} onChange={e => set('region', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                {regions.map((r: any) => <option key={r.region} value={r.region}>{r.region} ({r.investorCount} investors)</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Capacity (MW)</label>
              <input type="number" value={form.capacityMW} onChange={e => set('capacityMW', Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>
          <p className="text-gray-600 text-xs mt-3">Tranche sizes and total raise are set dynamically when tranches are created by the admin.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-white font-semibold">PPA & Revenue</h2>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">VDR</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-gray-400 text-sm mb-1 block">Off-Taker</label><input value={form.offTakerName} onChange={e => set('offTakerName', e.target.value)} placeholder="e.g. Eskom" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="text-gray-400 text-sm mb-1 block">PPA Tariff ($/kWh)</label><input type="number" step="0.01" value={form.ppaTariff} onChange={e => set('ppaTariff', Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="text-gray-400 text-sm mb-1 block">Escalator (%/yr)</label><input type="number" step="0.1" value={form.tariffEscalatorPct} onChange={e => set('tariffEscalatorPct', Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="text-gray-400 text-sm mb-1 block">Yield Rate</label><input type="number" step="0.01" value={form.yieldRate} onChange={e => set('yieldRate', Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="text-gray-400 text-sm mb-1 block">Duration (years)</label><input type="number" value={form.durationYears} onChange={e => set('durationYears', Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="text-gray-400 text-sm mb-1 block">Annual O&M ($)</label><input type="number" value={form.annualOMCost} onChange={e => set('annualOMCost', Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-white font-semibold">Financial Structure</h2>
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Waterfall</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-gray-400 text-sm mb-1 block">Total CapEx ($)</label><input type="number" value={form.totalCapEx} onChange={e => set('totalCapEx', Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="text-gray-400 text-sm mb-1 block">Total Debt ($)</label><input type="number" value={form.totalDebt} onChange={e => set('totalDebt', Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="text-gray-400 text-sm mb-1 block">Dev Fee (%)</label><input type="number" step="0.5" value={form.devFeePct} onChange={e => set('devFeePct', Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="text-gray-400 text-sm mb-1 block">Mgmt Fee (%)</label><input type="number" step="0.1" value={form.mgmtFeePct} onChange={e => set('mgmtFeePct', Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="text-gray-400 text-sm mb-1 block">Operator Equity (%)</label><input type="number" value={form.operatorEquityPct} onChange={e => set('operatorEquityPct', Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="text-gray-400 text-sm mb-1 block">Hurdle IRR (%)</label><input type="number" step="0.5" value={form.investorHurdleIRR} onChange={e => set('investorHurdleIRR', Number(e.target.value))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div><span className="text-gray-500">Dev Fee</span><div className="text-green-400 font-medium">${devFeeAmt.toLocaleString()}</div></div>
            <div><span className="text-gray-500">Funding Target</span><div className="text-white font-medium">${fundingTarget.toLocaleString()}</div></div>
            <div><span className="text-gray-500">Waterfall</span><div className="text-white text-xs">Pre: {100 - form.operatorEquityPct}% inv / Post: {form.operatorEquityPct}% op</div></div>
          </div>
          <div className="flex justify-end">
            <button onClick={submit} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm flex items-center gap-2">
              {submitted ? <><CheckCircle size={14} /> Submitted!</> : <><Send size={14} /> Submit to Admin</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
