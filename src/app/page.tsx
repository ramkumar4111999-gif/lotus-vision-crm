'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Package, Receipt, FlaskConical, CalendarDays, Wallet,
  BarChart3, UserCog, Megaphone, Menu, Moon, Sun, Search, Eye, LogOut, Settings, Bell, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type SectionKey =
  | 'dashboard' | 'customers' | 'inventory' | 'sales' | 'lab-orders' | 'appointments' | 'accounting' | 'reports' | 'staff' | 'campaigns';

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

function CrmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CrmState>({
    activeSection: 'dashboard',
    sidebarOpen: false,
    searchQuery: '',
    darkMode: false,
  });
  const setActiveSection = useCallback((section: SectionKey) => {
    setState((prev) => ({ ...prev, activeSection: section, sidebarOpen: false }));
  }, []);
  const toggleSidebar = useCallback(() => { setState((prev) => ({ ...prev, sidebarOpen: !prev.sidebarOpen })); }, []);
  const setSidebarOpen = useCallback((open: boolean) => { setState((prev) => ({ ...prev, sidebarOpen: open })); }, []);
  const setSearchQuery = useCallback((q: string) => { setState((prev) => ({ ...prev, searchQuery: q })); }, []);
  const toggleDarkMode = useCallback(() => { setState((prev) => ({ ...prev, darkMode: !prev.darkMode })); }, []);
  const setDarkMode = useCallback((dark: boolean) => { setState((prev) => ({ ...prev, darkMode: dark })); }, []);

  const store = { ...state, setActiveSection, toggleSidebar, setSidebarOpen, setSearchQuery, toggleDarkMode, setDarkMode };

  return (
    <CrmContext.Provider value={store}>
      {children}
    </CrmContext.Provider>
  );
}

function useCrmStore() {
  return useContext(CrmContext);
}

const sectionComponents: Record<string, React.LazyComponent> = {
  dashboard: null,
  customers: null,
  inventory: null,
  sales: null,
  'lab-orders': null,
  appointments: null,
  accounting: null,
  reports: null,
  staff: null,
  campaigns: null,
};

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [activeSection] = useState<SectionKey>('dashboard');

  useEffect(() => {
    if (!loaded) {
      const loadDynamic = async () => {
        const modules: Record<string, React.LazyComponent> = {
          dashboard: () => import('@/components/crm/dashboard').then(m => m.default),
          customers: () => import('@/components/crm/customers').then(m => m.default),
          inventory: () => import('@/components/crm/inventory').then(m => m.default),
          sales: () => import('@/components/crm/sales').then(m => m.default),
          'lab-orders': () => import('@/components/crm/lab-orders').then(m => m.default),
          appointments: () => import('@/components/crm/appointments').then(m => m.default),
          accounting: () => import('@/components/crm/accounting').then(m => m.default),
          reports: () => import('@/components/crm/reports').then(m => m.default),
          staff: () => import('@/components/crm/staff').then(m => m.default),
          campaigns: () => import('@/components/crm/campaigns').then(m => m.default),
        };
        await Promise.all(Object.entries(modules).map(([key, fn]) => {
          try { const mod = await fn(); sectionComponents[key] = mod.default; } catch(e) { console.error(`Failed to load ${key}:`, e); }
        });
        setLoaded(true);
      };
    }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
  }, [loaded, activeSection]);

  if (!loaded) {
    return (
      <div className="flex min-h-screen flex items-center justify-center p-8">
        <div className="animate-pulse text-lg text-muted-foreground mb-4">
          <div className="size-12 border-2 border-b border-muted/30 rounded-full flex items-center justify-center">
            <div className="animate-spin border-t-2 border-blue-500 border-t-transparent rounded-lg">
              <div className="h-8 w-8 border-b border-b/20 rounded-t-lg px-4 bg-background text-foreground">SKO</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">Loading Sankaran Kovil Opticals CRM...</p>
        </div>
      </div>
    );
  }

  switch (activeSection) {
    case 'dashboard': return loaded && sectionComponents.dashboard ? <sectionComponents.dashboard /> : null;
    case 'customers': return loaded && sectionComponents.customers ? <sectionComponents.customers /> : null;
    case 'inventory': return loaded && sectionComponents.inventory ? <sectionComponents.inventory /> : null;
    case 'sales': return loaded && sectionComponents.sales ? <sectionComponents.sales /> : null;
    case 'lab-orders': return loaded && sectionComponents['lab-orders'] ? <sectionComponents['lab-orders'] /> : null;
    case 'appointments': return loaded && sectionComponents.appointments ? <sectionComponents.appointments /> : null;
    case 'accounting': return loaded && sectionComponents.accounting ? <sectionComponents.accounting /> : null;
    case 'reports': return loaded && sectionComponents.reports ? <sectionComponents.reports /> : null;
    case 'staff': return loaded && sectionComponents.staff ? <sectionComponents.staff /> : null;
    case 'campaigns': return loaded && sectionComponents.campaigns ? <sectionComponents.campaigns /> : null;
    default: return loaded && sectionComponents.dashboard ? <sectionComponents.dashboard /> : null;
  }
}