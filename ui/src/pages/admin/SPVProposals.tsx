import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Briefcase } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { SPVStateBadge } from '../../components/Badge';
import { queryContracts, exerciseChoice, TMPL } from '../../api/ledger';
import { useApp, fullPartyId } from '../../context/AppContext';

export default function SPVProposals() {
  const { addToast, triggerRefresh, refresh, hash } = useApp();

  const [projects,   setProjects]   = useState<any[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      queryContracts('Admin', TMPL.ProjectSPV),
      queryContracts('Admin', TMPL.RegionalPortfolio),
    ])
      .then(([projs, ports]) => { setProjects(projs); setPortfolios(ports); })
      .catch(e => addToast('error', e.message))
      .finally(() => setLoading(false));
  }, [refresh]);

  const proposed = projects.filter(p => p.payload.state === 'Proposed');
  const others   = projects.filter(p => p.payload.state !== 'Proposed');

  const approve = async (contractId: string, name: string, region: string) => {
    try {
      // 1. Approve the project
      await exerciseChoice('Admin', TMPL.ProjectSPV, contractId, 'Approve', {});

      // 2. Find matching portfolio and add project
      const matchingPortfolio = portfolios.find(
        p => p.payload.region === region && !p.payload.archived
      );
      if (matchingPortfolio) {
        // Extract projectId from the project payload
        const proj = projects.find(p => p.contractId === contractId);
        if (proj) {
          await exerciseChoice('Admin', TMPL.RegionalPortfolio,
            matchingPortfolio.contractId, 'AddProject', {
              projectId: proj.payload.projectId,
            });
          addToast('success',
            `SPV "${name}" approved and added to "${matchingPortfolio.payload.portfolioName}"`
          );
        }
      } else {
        addToast('success', `SPV "${name}" approved (no matching portfolio for region: ${region})`);
      }

      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  const reject = async (contractId: string, name: string) => {
    try {
      await exerciseChoice('Admin', TMPL.ProjectSPV, contractId, 'Reject', {});
      addToast('info', `SPV "${name}" returned to Draft`);
      triggerRefresh();
    } catch (e: any) { addToast('error', e.message); }
  };

  return (
    <div>
      <PageHeader
        title="SPV Proposals"
        subtitle="Approve proposals — project is automatically added to matching regional portfolio"
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

        {/* Portfolios overview */}
        {portfolios.length > 0 && (
          <div className="card p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">
              Active Regional Portfolios
            </p>
            <div className="flex flex-wrap gap-2">
              {portfolios.filter(p => !p.payload.archived).map(p => (
                <div key={p.contractId}
                  className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <div>
                    <p className="text-xs text-white font-medium">{p.payload.portfolioName}</p>
                    <p className="text-xs text-slate-500">
                      {p.payload.region} · {p.payload.projects?.length ?? 0} projects ·
                      {p.payload.authorizedInvestors?.length ?? 0} investors
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending proposals */}
        <div className="card">
          <div className="px-5 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">
              Awaiting Approval
              {proposed.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-amber-900/50 text-amber-300
                  text-xs rounded-full">{proposed.length}</span>
              )}
            </h2>
          </div>
          {proposed.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">
              No proposals pending
            </div>
          ) : proposed.map(p => {
            const matchPort = portfolios.find(
              port => port.payload.region === p.payload.region && !port.payload.archived
            );
            return (
              <div key={p.contractId}
                className="px-5 py-4 border-b border-slate-800 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center
                      justify-center">
                      <Briefcase size={15} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{p.payload.projectName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ID: {p.payload.projectId} · Region: {p.payload.region}
                      </p>

                      {/* Portfolio match indicator */}
                      {matchPort ? (
                        <p className="text-xs text-emerald-400 mt-1">
                          ✓ Will be added to: {matchPort.payload.portfolioName}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-400 mt-1">
                          ⚠ No portfolio found for region "{p.payload.region}"
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-4 mt-2">
                        {[
                          ['Capacity',       `${p.payload.capacityMW} MW`],
                          ['PPA Tariff',     `$${p.payload.ppaTariff}/kWh`],
                          ['Funding Target', `$${Number(p.payload.fundingTarget).toLocaleString()}`],
                          ['Token Symbol',   p.payload.tokenSymbol],
                          ['Token Price',    `$${p.payload.tokenPrice}`],
                          ['Tranche',        p.payload.trancheNumber?.Some ?? p.payload.trancheNumber ?? '—'],
                        ].map(([k, v]) => (
                          <div key={k as string}>
                            <p className="text-xs text-slate-500">{k}</p>
                            <p className="text-xs text-white font-medium">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => approve(p.contractId, p.payload.projectName, p.payload.region)}
                      className="btn-primary">
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button
                      onClick={() => reject(p.contractId, p.payload.projectName)}
                      className="btn-danger">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* All other projects */}
        {others.length > 0 && (
          <div className="card">
            <div className="px-5 py-3 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white">All Projects</h2>
            </div>
            <div className="divide-y divide-slate-800">
              {others.map(p => (
                <div key={p.contractId}
                  className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">{p.payload.projectName}</p>
                    <p className="text-xs text-slate-500">
                      {p.payload.projectId} · {p.payload.region}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-slate-400">
                      ${Number(p.payload.fundingRaised).toLocaleString()} /
                      ${Number(p.payload.fundingTarget).toLocaleString()}
                    </p>
                    <SPVStateBadge state={p.payload.state} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}