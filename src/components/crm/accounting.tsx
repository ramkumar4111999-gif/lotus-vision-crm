'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO, startOfDay, isToday, isWithinInterval } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  IndianRupee,
  CalendarDays,
  Filter,
  Receipt,
  CreditCard,
  PieChart as PieChartIcon,
  Banknote,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  vendor: string;
  createdAt: string;
}

interface Due {
  id: string;
  customer: string;
  totalAmount: number;
  paid: number;
  balance: number;
  dueDate: string;
  status: 'Pending' | 'Partial' | 'Paid';
}

interface Sale {
  id: string;
  customer: string;
  totalAmount: number;
  date: string;
}

interface CashFlowEntry {
  date: string;
  description: string;
  type: 'Income' | 'Expense';
  amount: number;
  balance: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  'Rent',
  'Salary',
  'Electricity',
  'Lab Bills',
  'Transport',
  'Maintenance',
  'Other',
] as const;

const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
  'hsl(var(--chart-2) / 0.5)',
];

const BAR_CHART_CONFIG: ChartConfig = {
  amount: {
    label: 'Amount',
    color: 'hsl(var(--chart-1))',
  },
};

const PIE_CHART_CONFIG: ChartConfig = {
  value: {
    label: 'Amount',
  },
  Rent: { label: 'Rent', color: 'hsl(var(--chart-1))' },
  Salary: { label: 'Salary', color: 'hsl(var(--chart-2))' },
  Electricity: { label: 'Electricity', color: 'hsl(var(--chart-3))' },
  'Lab Bills': { label: 'Lab Bills', color: 'hsl(var(--chart-4))' },
  Transport: { label: 'Transport', color: 'hsl(var(--chart-5))' },
  Maintenance: { label: 'Maintenance', color: 'hsl(var(--chart-6))' },
  Other: { label: 'Other', color: 'hsl(40, 80%, 55%)' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

function getTodayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Accounting() {
  // Data state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dues, setDues] = useState<Due[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Loading states
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [loadingDues, setLoadingDues] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);

  // Dialog states
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [payingDue, setPayingDue] = useState<Due | null>(null);

  // Expense form state
  const [expForm, setExpForm] = useState({
    category: '',
    description: '',
    amount: '',
    date: getTodayStr(),
    vendor: '',
  });

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');

  // Filter states
  const [cashFlowFrom, setCashFlowFrom] = useState(
    format(new Date(), 'yyyy-MM-01')
  );
  const [cashFlowTo, setCashFlowTo] = useState(getTodayStr());
  const [dueFilter, setDueFilter] = useState<string>('All');

  // Deleting state
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // ─── Fetch Data ──────────────────────────────────────────────────────────

  const fetchExpenses = useCallback(async () => {
    try {
      setLoadingExpenses(true);
      const res = await fetch('/api/expenses');
      if (res.ok) {
        const data = await res.json();
        setExpenses(Array.isArray(data) ? data : data.expenses ?? []);
      }
    } catch {
      toast.error('Failed to fetch expenses');
    } finally {
      setLoadingExpenses(false);
    }
  }, []);

  const fetchDues = useCallback(async () => {
    try {
      setLoadingDues(true);
      const res = await fetch('/api/dues');
      if (res.ok) {
        const data = await res.json();
        setDues(Array.isArray(data) ? data : data.dues ?? []);
      }
    } catch {
      toast.error('Failed to fetch dues');
    } finally {
      setLoadingDues(false);
    }
  }, []);

  const fetchSales = useCallback(async () => {
    try {
      setLoadingSales(true);
      const res = await fetch('/api/sales');
      if (res.ok) {
        const data = await res.json();
        setSales(Array.isArray(data) ? data : data.sales ?? []);
      }
    } catch {
      toast.error('Failed to fetch sales');
    } finally {
      setLoadingSales(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchDues();
    fetchSales();
  }, [fetchExpenses, fetchDues, fetchSales]);

  // ─── Summary Calculations ────────────────────────────────────────────────

  const todayIncome = useMemo(() => {
    return sales
      .filter((s) => {
        try {
          return isToday(parseISO(s.date));
        } catch {
          return false;
        }
      })
      .reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  }, [sales]);

  const todayExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        try {
          return isToday(parseISO(e.date));
        } catch {
          return false;
        }
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);

  const netCashFlow = todayIncome - todayExpenses;

  const totalPendingDues = useMemo(() => {
    return dues
      .filter((d) => d.status !== 'Paid')
      .reduce((sum, d) => sum + (d.balance || 0), 0);
  }, [dues]);

  // ─── Cash Flow Calculations ──────────────────────────────────────────────

  const cashFlowData = useMemo((): CashFlowEntry[] => {
    const fromDate = startOfDay(parseISO(cashFlowFrom));
    const toDate = startOfDay(parseISO(cashFlowTo));

    const incomeEntries: CashFlowEntry[] = sales
      .filter((s) => {
        try {
          const d = parseISO(s.date);
          return isWithinInterval(d, { start: fromDate, end: toDate });
        } catch {
          return false;
        }
      })
      .map((s) => ({
        date: s.date,
        description: `Sale - ${s.customer || 'Customer'}`,
        type: 'Income' as const,
        amount: s.totalAmount,
        balance: 0,
      }));

    const expenseEntries: CashFlowEntry[] = expenses
      .filter((e) => {
        try {
          const d = parseISO(e.date);
          return isWithinInterval(d, { start: fromDate, end: toDate });
        } catch {
          return false;
        }
      })
      .map((e) => ({
        date: e.date,
        description: `${e.category} - ${e.description || e.vendor || 'Expense'}`,
        type: 'Expense' as const,
        amount: e.amount,
        balance: 0,
      }));

    const allEntries = [...incomeEntries, ...expenseEntries].sort(
      (a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.type === 'Income' ? -1 : 1;
      }
    );

    let runningBalance = 0;
    return allEntries.map((entry) => {
      if (entry.type === 'Income') {
        runningBalance += entry.amount;
      } else {
        runningBalance -= entry.amount;
      }
      return { ...entry, balance: runningBalance };
    });
  }, [sales, expenses, cashFlowFrom, cashFlowTo]);

  const cashFlowSummary = useMemo(() => {
    const totalIncome = cashFlowData
      .filter((e) => e.type === 'Income')
      .reduce((s, e) => s + e.amount, 0);
    const totalExpense = cashFlowData
      .filter((e) => e.type === 'Expense')
      .reduce((s, e) => s + e.amount, 0);
    return { totalIncome, totalExpense, net: totalIncome - totalExpense };
  }, [cashFlowData]);

  // ─── Expense Category Summary ────────────────────────────────────────────

  const categorySummary = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      map[cat] = (map[cat] || 0) + (e.amount || 0);
    });
    return EXPENSE_CATEGORIES.map((cat) => ({
      name: cat,
      value: map[cat] || 0,
    })).filter((c) => c.value > 0);
  }, [expenses]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((s, e) => s + (e.amount || 0), 0);
  }, [expenses]);

  // ─── Filtered Dues ───────────────────────────────────────────────────────

  const filteredDues = useMemo(() => {
    if (dueFilter === 'All') return dues;
    return dues.filter((d) => d.status === dueFilter);
  }, [dues, dueFilter]);

  // ─── Expense Form Handlers ───────────────────────────────────────────────

  const resetExpForm = () => {
    setExpForm({
      category: '',
      description: '',
      amount: '',
      date: getTodayStr(),
      vendor: '',
    });
    setEditingExpense(null);
  };

  const openAddExpense = () => {
    resetExpForm();
    setExpenseDialogOpen(true);
  };

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpForm({
      category: expense.category || '',
      description: expense.description || '',
      amount: String(expense.amount || ''),
      date: expense.date || getTodayStr(),
      vendor: expense.vendor || '',
    });
    setExpenseDialogOpen(true);
  };

  const handleSaveExpense = async () => {
    const amount = parseFloat(expForm.amount);
    if (!expForm.category || !expForm.description || isNaN(amount) || amount <= 0 || !expForm.date) {
      toast.error('Please fill in all required fields with valid data');
      return;
    }

    try {
      const isEdit = !!editingExpense;
      const url = editingExpense ? `/api/expenses?id=${editingExpense.id}` : '/api/expenses';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: expForm.category,
          description: expForm.description,
          amount,
          date: expForm.date,
          vendor: expForm.vendor,
        }),
      });

      if (res.ok) {
        toast.success(isEdit ? 'Expense updated' : 'Expense added');
        setExpenseDialogOpen(false);
        resetExpForm();
        fetchExpenses();
      } else {
        toast.error('Failed to save expense');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setDeletingExpenseId(id);
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Expense deleted');
        fetchExpenses();
      } else {
        toast.error('Failed to delete expense');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingExpenseId(null);
    }
  };

  // ─── Payment Handlers ────────────────────────────────────────────────────

  const openPaymentDialog = (due: Due) => {
    setPayingDue(due);
    setPaymentAmount('');
    setPaymentDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!payingDue) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > payingDue.balance) {
      toast.error('Amount exceeds pending balance');
      return;
    }

    try {
      const newPaid = payingDue.paid + amount;
      const newBalance = payingDue.totalAmount - newPaid;
      const newStatus = newBalance <= 0 ? 'Paid' : 'Partial';

      const res = await fetch(`/api/dues?id=${payingDue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paid: newPaid,
          balance: Math.max(0, newBalance),
          status: newStatus,
        }),
      });

      if (res.ok) {
        toast.success(`Payment of ${formatINR(amount)} recorded`);
        setPaymentDialogOpen(false);
        setPayingDue(null);
        fetchDues();
      } else {
        toast.error('Failed to record payment');
      }
    } catch {
      toast.error('Network error');
    }
  };

  // ─── Status Badge ────────────────────────────────────────────────────────

  const DueStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'Pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
            Pending
          </Badge>
        );
      case 'Partial':
        return (
          <Badge className="bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800">
            Partial
          </Badge>
        );
      case 'Paid':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
            Paid
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // ─── Skeleton Loader ─────────────────────────────────────────────────────

  const TableSkeleton = ({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) => (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-8 bg-muted rounded animate-pulse flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <IndianRupee className="h-6 w-6" />
            Accounting & Finance
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track income, expenses, and pending dues
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Today&apos;s Income</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  {formatINR(todayIncome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Today&apos;s Expenses</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400 truncate">
                  {formatINR(todayExpenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  netCashFlow >= 0
                    ? 'bg-emerald-100 dark:bg-emerald-950'
                    : 'bg-red-100 dark:bg-red-950'
                }`}
              >
                <Wallet
                  className={`h-5 w-5 ${
                    netCashFlow >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Net Cash Flow</p>
                <p
                  className={`text-lg font-bold truncate ${
                    netCashFlow >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {netCashFlow >= 0 ? '+' : ''}
                  {formatINR(netCashFlow)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Pending Dues</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400 truncate">
                  {formatINR(totalPendingDues)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="cashflow" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cashflow" className="gap-1.5">
            <Banknote className="h-4 w-4" />
            <span className="hidden sm:inline">Cash Flow</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1.5">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="dues" className="gap-1.5">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Dues</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── Cash Flow Tab ────────────────────────────────────────────── */}
        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Cash Flow Statement</CardTitle>
                  <CardDescription>Track all income and expense transactions</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="cf-from" className="text-xs whitespace-nowrap">
                      <CalendarDays className="h-3.5 w-3.5 inline mr-1" />
                      From
                    </Label>
                    <Input
                      id="cf-from"
                      type="date"
                      value={cashFlowFrom}
                      onChange={(e) => setCashFlowFrom(e.target.value)}
                      className="h-8 w-[140px] text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="cf-to" className="text-xs whitespace-nowrap">
                      To
                    </Label>
                    <Input
                      id="cf-to"
                      type="date"
                      value={cashFlowTo}
                      onChange={(e) => setCashFlowTo(e.target.value)}
                      className="h-8 w-[140px] text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSales || loadingExpenses ? (
                <TableSkeleton rows={6} cols={5} />
              ) : cashFlowData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Wallet className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">No transactions found in this period</p>
                </div>
              ) : (
                <>
                  <div className="max-h-[420px] overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Description</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                          <TableHead className="text-xs text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashFlowData.map((entry, i) => (
                          <TableRow key={`cf-${entry.date}-${entry.description}-${i}`}>
                            <TableCell className="text-xs">{formatDate(entry.date)}</TableCell>
                            <TableCell className="text-xs max-w-[200px] truncate">
                              {entry.description}
                            </TableCell>
                            <TableCell>
                              {entry.type === 'Income' ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                                  Income
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 border-red-200 text-xs dark:bg-red-950 dark:text-red-300 dark:border-red-800">
                                  Expense
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell
                              className={`text-xs text-right font-mono font-medium ${
                                entry.type === 'Income'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {entry.type === 'Income' ? '+' : '-'}
                              {formatINR(entry.amount)}
                            </TableCell>
                            <TableCell
                              className={`text-xs text-right font-mono font-medium ${
                                entry.balance >= 0
                                  ? 'text-foreground'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {formatINR(entry.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3} className="text-xs font-semibold">
                            Summary
                          </TableCell>
                          <TableCell className="text-xs text-right">
                            <div className="space-y-0.5">
                              <span className="block text-emerald-600 dark:text-emerald-400 font-mono">
                                +{formatINR(cashFlowSummary.totalIncome)}
                              </span>
                              <span className="block text-red-600 dark:text-red-400 font-mono">
                                -{formatINR(cashFlowSummary.totalExpense)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell
                            className={`text-xs text-right font-mono font-bold ${
                              cashFlowSummary.net >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {cashFlowSummary.net >= 0 ? '+' : ''}
                            {formatINR(cashFlowSummary.net)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>

                  {/* Bottom Summary Cards */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Total Income</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatINR(cashFlowSummary.totalIncome)}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-red-50 dark:bg-red-950/30 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Total Expense</p>
                      <p className="text-sm font-bold text-red-600 dark:text-red-400 font-mono">
                        {formatINR(cashFlowSummary.totalExpense)}
                      </p>
                    </div>
                    <div
                      className={`rounded-lg border p-3 text-center ${
                        cashFlowSummary.net >= 0
                          ? 'bg-emerald-50 dark:bg-emerald-950/30'
                          : 'bg-red-50 dark:bg-red-950/30'
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">Net</p>
                      <p
                        className={`text-sm font-bold font-mono ${
                          cashFlowSummary.net >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {cashFlowSummary.net >= 0 ? '+' : ''}
                        {formatINR(cashFlowSummary.net)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Expenses Tab ─────────────────────────────────────────────── */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Expense Management
                  </CardTitle>
                  <CardDescription>
                    {expenses.length} expense{expenses.length !== 1 ? 's' : ''} totaling{' '}
                    {formatINR(totalExpenses)}
                  </CardDescription>
                </div>
                <Button onClick={openAddExpense} size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add Expense
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingExpenses ? (
                <TableSkeleton rows={6} cols={6} />
              ) : expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Receipt className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">No expenses recorded yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-1.5"
                    onClick={openAddExpense}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add your first expense
                  </Button>
                </div>
              ) : (
                <>
                  {/* Expense Table */}
                  <div className="max-h-[360px] overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Category</TableHead>
                          <TableHead className="text-xs">Description</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                          <TableHead className="text-xs hidden sm:table-cell">Vendor</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((exp) => (
                          <TableRow key={exp.id}>
                            <TableCell className="text-xs">{formatDate(exp.date)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {exp.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs max-w-[180px] truncate">
                              {exp.description}
                            </TableCell>
                            <TableCell className="text-xs text-right font-mono font-medium text-red-600 dark:text-red-400">
                              {formatINR(exp.amount)}
                            </TableCell>
                            <TableCell className="text-xs hidden sm:table-cell max-w-[120px] truncate">
                              {exp.vendor || '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => openEditExpense(exp)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  disabled={deletingExpenseId === exp.id}
                                >
                                  {deletingExpenseId === exp.id ? (
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Category Summary */}
                  {categorySummary.length > 0 && (
                    <div className="mt-6">
                      <Separator className="mb-4" />
                      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4" />
                        Expense Distribution by Category
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pie Chart */}
                        <div className="flex items-center justify-center">
                          <ChartContainer config={PIE_CHART_CONFIG} className="h-[250px] w-full max-w-[250px]">
                            <PieChart>
                              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                              <Pie
                                data={categorySummary}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={90}
                                paddingAngle={2}
                                strokeWidth={2}
                              >
                                {categorySummary.map((_, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                            </PieChart>
                          </ChartContainer>
                        </div>
                        {/* Bar Chart + Legend */}
                        <div className="space-y-3">
                          <ChartContainer config={BAR_CHART_CONFIG} className="h-[200px] w-full">
                            <BarChart
                              data={categorySummary}
                              layout="vertical"
                              margin={{ top: 0, right: 20, bottom: 0, left: 60 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={55} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {categorySummary.map((_, index) => (
                                  <Cell
                                    key={`bar-${index}`}
                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ChartContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Dues Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="dues">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Customer Dues
                  </CardTitle>
                  <CardDescription>
                    {filteredDues.length} due{filteredDues.length !== 1 ? 's' : ''} •{' '}
                    Pending total: {formatINR(totalPendingDues)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={dueFilter} onValueChange={setDueFilter}>
                    <SelectTrigger className="h-8 w-[120px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Partial">Partial</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingDues ? (
                <TableSkeleton rows={6} cols={7} />
              ) : filteredDues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CreditCard className="h-10 w-10 mb-2 opacity-40" />
                  <p className="text-sm">
                    {dueFilter !== 'All'
                      ? `No ${dueFilter.toLowerCase()} dues found`
                      : 'No dues recorded yet'}
                  </p>
                </div>
              ) : (
                <div className="max-h-[420px] overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Customer</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                        <TableHead className="text-xs text-right hidden sm:table-cell">Paid</TableHead>
                        <TableHead className="text-xs text-right">Balance</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Due Date</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDues.map((due) => (
                        <TableRow key={due.id}>
                          <TableCell className="text-xs font-medium">
                            {due.customer}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {formatINR(due.totalAmount)}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono hidden sm:table-cell text-emerald-600 dark:text-emerald-400">
                            {formatINR(due.paid)}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono font-medium text-red-600 dark:text-red-400">
                            {formatINR(due.balance)}
                          </TableCell>
                          <TableCell className="text-xs hidden md:table-cell">
                            {formatDate(due.dueDate)}
                          </TableCell>
                          <TableCell>
                            <DueStatusBadge status={due.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            {due.status !== 'Paid' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() => openPaymentDialog(due)}
                              >
                                <IndianRupee className="h-3 w-3" />
                                Pay
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="text-xs font-semibold" colSpan={1}>
                          Total ({filteredDues.length})
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono font-semibold">
                          {formatINR(filteredDues.reduce((s, d) => s + d.totalAmount, 0))}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono font-semibold hidden sm:table-cell text-emerald-600 dark:text-emerald-400">
                          {formatINR(filteredDues.reduce((s, d) => s + d.paid, 0))}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono font-semibold text-red-600 dark:text-red-400">
                          {formatINR(filteredDues.reduce((s, d) => s + d.balance, 0))}
                        </TableCell>
                        <TableCell colSpan={3} />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Expense Dialog ─────────────────────────────────────────────── */}
      <Dialog open={expenseDialogOpen} onOpenChange={(open) => {
        if (!open) resetExpForm();
        setExpenseDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </DialogTitle>
            <DialogDescription>
              {editingExpense
                ? 'Update the expense details below.'
                : 'Fill in the details to record a new expense.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="exp-category">Category *</Label>
              <Select
                value={expForm.category}
                onValueChange={(v) => setExpForm((f) => ({ ...f, category: v }))}
              >
                <SelectTrigger id="exp-category" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="exp-description">Description *</Label>
              <Textarea
                id="exp-description"
                value={expForm.description}
                onChange={(e) => setExpForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of the expense"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="exp-amount">Amount (₹) *</Label>
                <Input
                  id="exp-amount"
                  type="number"
                  min="0"
                  step="1"
                  value={expForm.amount}
                  onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  className="font-mono"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="exp-date">Date *</Label>
                <Input
                  id="exp-date"
                  type="date"
                  value={expForm.date}
                  onChange={(e) => setExpForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="exp-vendor">Vendor / Payee</Label>
              <Input
                id="exp-vendor"
                type="text"
                value={expForm.vendor}
                onChange={(e) => setExpForm((f) => ({ ...f, vendor: e.target.value }))}
                placeholder="Vendor name (optional)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetExpForm();
                setExpenseDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveExpense}>
              {editingExpense ? 'Update' : 'Save'} Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Record Payment Dialog ──────────────────────────────────────── */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {payingDue && (
                <>
                  Record a payment for{' '}
                  <span className="font-semibold text-foreground">{payingDue.customer}</span>.
                  <br />
                  Pending balance:{' '}
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {formatINR(payingDue.balance)}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="payment-amount">Payment Amount (₹)</Label>
              <Input
                id="payment-amount"
                type="number"
                min="1"
                max={payingDue?.balance || 0}
                step="1"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                className="font-mono text-lg"
                autoFocus
              />
              {payingDue && (
                <p className="text-xs text-muted-foreground">
                  Max: {formatINR(payingDue.balance)}
                </p>
              )}
            </div>

            {payingDue && paymentAmount && !isNaN(parseFloat(paymentAmount)) && parseFloat(paymentAmount) > 0 && (
              <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Paid</span>
                  <span className="font-mono">{formatINR(payingDue.paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">+ This Payment</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    +{formatINR(parseFloat(paymentAmount))}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>New Balance</span>
                  <span className="font-mono">
                    {formatINR(
                      Math.max(0, payingDue.balance - parseFloat(paymentAmount))
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={
                !paymentAmount ||
                isNaN(parseFloat(paymentAmount)) ||
                parseFloat(paymentAmount) <= 0
              }
            >
              <IndianRupee className="h-4 w-4 mr-1" />
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}