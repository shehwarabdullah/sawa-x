import React, {
  createContext, useContext, useState, useCallback, ReactNode, useEffect,
} from 'react';
import { Role, Toast } from '../types';

export type InvestorId = 'Investor1' | 'Investor2' | 'Investor3';

export interface AppContextValue {
  role: Role;
  setRole: (r: Role) => void;
  selectedInvestor: InvestorId;
  setSelectedInvestor: (i: InvestorId) => void;
  partyId: string;          // full Canton party ID with hash
  partyName: string;        // short display name e.g. "Investor1"
  hash: string;             // current Canton node hash
  setHash: (h: string) => void;
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  refresh: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// Stored in localStorage so it survives page refresh
const HASH_KEY = 'canton_node_hash';

export function AppProvider({ children }: { children: ReactNode }) {
  const [role,             setRoleState]         = useState<Role>('admin');
  const [selectedInvestor, setSelectedInvestor]  = useState<InvestorId>('Investor1');
  const [toasts,           setToasts]            = useState<Toast[]>([]);
  const [refresh,          setRefresh]           = useState(0);
  const [hash,             setHashState]         = useState<string>(
    () => localStorage.getItem(HASH_KEY) ?? ''
  );

  const setHash = useCallback((h: string) => {
    localStorage.setItem(HASH_KEY, h);
    setHashState(h);
  }, []);

  // Derive current party name
  const partyName = role === 'investor'
    ? selectedInvestor
    : role === 'admin'
      ? 'Admin'
      : 'Operator';

  // Full party ID = name::hash
  const partyId = hash ? `${partyName}::${hash}` : partyName;

  const setRole = (r: Role) => setRoleState(r);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const triggerRefresh = useCallback(() => setRefresh(n => n + 1), []);

  return (
    <AppContext.Provider value={{
      role, setRole,
      selectedInvestor, setSelectedInvestor,
      partyId, partyName, hash, setHash,
      toasts, addToast, removeToast,
      refresh, triggerRefresh,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Helper: get full party ID for any party name given a hash
export function fullPartyId(name: string, hash: string): string {
  return hash ? `${name}::${hash}` : name;
}