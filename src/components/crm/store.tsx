'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type SectionKey =
  | 'dashboard'
  | 'customers'
  | 'inventory'
  | 'sales'
  | 'lab-orders'
  | 'appointments'
  | 'accounting'
  | 'reports'
  | 'staff'
  | 'campaigns';

interface CrmState {
  activeSection: SectionKey;
  sidebarOpen: boolean;
  searchQuery: string;
  darkMode: boolean;
  setActiveSection: (section: SectionKey) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
}

const CrmContext = createContext<CrmState & {
  setActiveSection: (section: SectionKey) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
}>({
  activeSection: 'dashboard',
  sidebarOpen: false,
  searchQuery: '',
  darkMode: false,
  setActiveSection: () => {},
  toggleSidebar: () => {},
  setSidebarOpen: () => {},
  setSearchQuery: () => {},
  toggleDarkMode: () => {},
  setDarkMode: () => {},
});

export function CrmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CrmState>({
    activeSection: 'dashboard',
    sidebarOpen: false,
    searchQuery: '',
    darkMode: false,
  });

  const setActiveSection = useCallback((section: SectionKey) => {
    setState((prev) => ({ ...prev, activeSection: section, sidebarOpen: false }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, sidebarOpen: open }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setState((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  }, []);

  const setDarkMode = useCallback((dark: boolean) => {
    setState((prev) => ({ ...prev, darkMode: dark }));
  }, []);

  const store = {
    ...state,
    setActiveSection,
    toggleSidebar,
    setSidebarOpen,
    setSearchQuery,
    toggleDarkMode,
    setDarkMode,
  };

  return (
    <CrmContext.Provider value={store}>
      {children}
    </CrmContext.Provider>
  );
}

export function useCrmStore() {
  return useContext(CrmContext);
}