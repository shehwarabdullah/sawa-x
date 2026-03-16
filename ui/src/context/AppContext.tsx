import React, {
  createContext, useContext, useState, useCallback, ReactNode,
} from 'react';
import { Role, Toast } from '../types';
import * as mock from '../api/mock';

// Re-export store so components can subscribe via context refreshes
export { mock };

export interface AppContextValue {
  role: Role;
  partyId: string;
  setRole: (r: Role) => void;
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  refresh: number;           // bump this to re-render all panels
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const PARTY_MAP: Record<Role, string> = {
  admin:    'Admin',
  operator: 'Operator',
  investor: 'Investor',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState]  = useState<Role>('admin');
  const [toasts, setToasts]   = useState<Toast[]>([]);
  const [refresh, setRefresh] = useState(0);

  const setRole = (r: Role) => setRoleState(r);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const triggerRefresh = useCallback(() => setRefresh(n => n + 1), []);

  return (
    <AppContext.Provider value={{
      role,
      partyId: PARTY_MAP[role],
      setRole,
      toasts,
      addToast,
      removeToast,
      refresh,
      triggerRefresh,
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
