import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../api/backend';
import { PartyInfo, RoleType } from '../types';

interface AppState {
  ready: boolean;
  parties: PartyInfo[];
  loggedIn: boolean;
  role: RoleType | null;
  partyName: string;
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected';
  login: (role: RoleType, partyName: string) => void;
  logout: () => void;
  refreshKYC: () => void;
}

const AppContext = createContext<AppState>({
  ready: false, parties: [], loggedIn: false, role: null, partyName: '',
  kycStatus: 'none', login: () => {}, logout: () => {}, refreshKYC: () => {},
});

export const useApp = () => useContext(AppContext);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [parties, setParties] = useState<PartyInfo[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<RoleType | null>(null);
  const [partyName, setPartyName] = useState('');
  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');

  useEffect(() => {
    let attempts = 0;
    const tryInit = async () => {
      try {
        const data = await api.init();
        if (data.ready && data.parties?.length > 0) {
          setParties(data.parties);
          setReady(true);
        } else if (attempts < 10) {
          attempts++;
          setTimeout(tryInit, 2000);
        }
      } catch {
        if (attempts < 10) { attempts++; setTimeout(tryInit, 2000); }
      }
    };
    tryInit();
  }, []);

  // Check KYC status for current investor
  const refreshKYC = useCallback(async () => {
    if (role !== 'Investor' || !partyName) return;
    try {
      const data = await api.getKYCStatus(partyName);
      setKycStatus(data.status || 'none');
    } catch {
      setKycStatus('none');
    }
  }, [role, partyName]);

  useEffect(() => {
    if (loggedIn && role === 'Investor') refreshKYC();
  }, [loggedIn, role, partyName, refreshKYC]);

  const login = (r: RoleType, name: string) => {
    setRole(r);
    setPartyName(name);
    setLoggedIn(true);
    setKycStatus('none');
  };

  const logout = () => {
    setRole(null);
    setPartyName('');
    setLoggedIn(false);
    setKycStatus('none');
  };

  return (
    <AppContext.Provider value={{ ready, parties, loggedIn, role, partyName, kycStatus, login, logout, refreshKYC }}>
      {children}
    </AppContext.Provider>
  );
}
