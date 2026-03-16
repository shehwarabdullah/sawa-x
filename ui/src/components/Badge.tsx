import React from 'react';
import { SPVState } from '../types';

const STATE_STYLES: Record<SPVState, string> = {
  Draft:       'bg-slate-800 text-slate-400 border-slate-700',
  Proposed:    'bg-amber-900/40 text-amber-300 border-amber-700/50',
  Approved:    'bg-blue-900/40 text-blue-300 border-blue-700/50',
  FundingOpen: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  Funded:      'bg-teal-900/40 text-teal-300 border-teal-700/50',
  Operational: 'bg-violet-900/40 text-violet-300 border-violet-700/50',
};

export function SPVStateBadge({ state }: { state: SPVState }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
      font-medium border ${STATE_STYLES[state]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {state}
    </span>
  );
}

export function KYCBadge({ verified }: { verified: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
      ${verified
        ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50'
        : 'bg-red-900/40 text-red-300 border-red-700/50'
      }`}>
      {verified ? '✓ KYC Verified' : '✗ Pending KYC'}
    </span>
  );
}
