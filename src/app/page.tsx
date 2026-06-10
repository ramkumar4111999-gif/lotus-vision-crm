'use client';

import { useEffect } from 'react';
import {
  LayoutDashboard, Users, Package, Receipt, FlaskConical, CalendarDays, Wallet,
  BarChart3, UserCog, Megaphone, Menu, Moon, Sun, LogOut, Bell, X, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import { CrmProvider, useCrmStore, type SectionKey } from '@/components/crm/store';
import Dashboard from '@/components/crm/dashboard';
import Customers from '@/components/crm/customers';
import Inventory from '@/components/crm/inventory';
import Sales from '@/components/crm/sales';
import LabOrders from '@/components/crm/lab-orders';
import Appointments from '@/components/crm/appointments';
import Accounting from '@/components/crm/accounting';
import Reports from '@/components/crm/reports';
import Staff from '@/components/crm/staff';
import Campaigns from '@/components/crm/campaigns';

// ─── Navigation config ─────────────────────────────────────────────────

interface NavItem {
  key: SectionKey;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'sales', label: 'Sales', icon: Receipt },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'appointments', label: 'Appointments', icon: CalendarDays },
  { key: 'lab-orders', label: 'Lab Orders', icon: FlaskConical },
  { key: 'accounting', label: 'Accounting', icon: Wallet },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'staff', label: 'Staff', icon: UserCog },
  { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
];

// ─── Section renderer ──────────────────────────────────────────────────

function SectionRenderer() {
  const { activeSection } = useCrmStore();

  const sectionMap: Record<SectionKey, React.ComponentType> = {
    dashboard: Dashboard,
    customers: Customers,
    sales: Sales,
    inventory: Inventory,
    appointments: Appointments,
    'lab-orders': LabOrders,
    accounting: Accounting,
    reports: Reports,
    staff: Staff,
    campaigns: Campaigns,
  };

  const Component = sectionMap[activeSection];
  if (!Component) return <Dashboard />;
  return <Component />;
}

// ─── Sidebar (Desktop) ─────────────────────────────────────────────────

function Sidebar({ onNav }: { onNav?: () => void }) {
  const { activeSection, setActiveSection, darkMode, toggleDarkMode } = useCrmStore();

  return (
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
          SKO
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
            Sankaran Kovil
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
            Opticals CRM
          </span>
        </div>
      </div>

      <Separator />

      {/* Nav items */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.key;
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setActiveSection(item.key);
                      onNav?.();
                    }}
                    className={`
                      flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/40'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span>{item.label}</span>
                    {item.key === 'lab-orders' && (
                      <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 text-[10px] px-1.5">
                        3
                      </Badge>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="lg:hidden">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="p-3 space-y-1">
        <button
          onClick={toggleDarkMode}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
        >
          {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 text-xs font-semibold">
              RK
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">Ram Kumar</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Owner</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Top Bar ────────────────────────────────────────────────────────────

function TopBar() {
  const { activeSection, sidebarOpen, setSidebarOpen, searchQuery, setSearchQuery } = useCrmStore();

  const currentLabel = NAV_ITEMS.find((n) => n.key === activeSection)?.label ?? 'Dashboard';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {currentLabel}
      </h1>

      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden sm:block w-64">
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 pl-8 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        />
        <Eye className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
      </div>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4.5 w-4.5 text-slate-600 dark:text-slate-400" />
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          2
        </span>
      </Button>
    </header>
  );
}

// ─── Mobile Sidebar Overlay ─────────────────────────────────────────────

function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useCrmStore();

  if (!sidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setSidebarOpen(false)}
      />
      {/* Sidebar panel */}
      <div className="relative z-10 h-full w-72">
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-3 right-3 z-20 rounded-md bg-white/80 dark:bg-slate-800/80 p-1 shadow"
        >
          <X className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </button>
        <Sidebar onNav={() => setSidebarOpen(false)} />
      </div>
    </div>
  );
}

// ─── Dark Mode Effect ───────────────────────────────────────────────────

function DarkModeEffect() {
  const { darkMode } = useCrmStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return null;
}

// ─── Main Layout ────────────────────────────────────────────────────────

function CrmLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <DarkModeEffect />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar */}
      <MobileSidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <SectionRenderer />
        </main>
      </div>
    </div>
  );
}

// ─── Root Page ──────────────────────────────────────────────────────────

export default function Home() {
  return (
    <CrmProvider>
      <CrmLayout />
    </CrmProvider>
  );
}