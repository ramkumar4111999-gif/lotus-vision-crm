"use client";

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  BarChart3,
  Download,
  Loader2,
} from "lucide-react";
import { format, subDays, parseISO, isWithinInterval } from "date-fns";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// ─── Color Palette ───────────────────────────────────────────────────────────

const COLORS = [
  "#059669",
  "#10b981",
  "#34d399",
  "#6ee7b7",
  "#a7f3d0",
  "#047857",
  "#065f46",
  "#d1fae5",
  "#16a34a",
  "#22c55e",
  "#4ade80",
  "#86efac",
];

const PAYMENT_COLORS: Record<string, string> = {
  Cash: "#059669",
  UPI: "#7c3aed",
  Card: "#2563eb",
  Credit: "#dc2626",
};

const CHART_GRADIENT_ID = "emeraldGradient";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SalesTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface ProductSale {
  productId: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  currentStock: number;
  totalQtySold: number;
  totalRevenue: number;
}

interface TopCustomer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  group: string;
  loyaltyPoints: number;
  totalSpent: number;
  _count: { sales: number; visits: number; prescriptions: number };
}

interface SaleRecord {
  id: string;
  total: number;
  paymentMode: string;
  createdAt: string;
  customerName: string;
  customer?: { name: string; phone: string } | null;
}

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  costPrice: number | null;
  price: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

const RADIAN = Math.PI / 180;

function renderCustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) {
  if (percent < 0.06) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.35;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#374151" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="text-xs">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── Chart Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
  valuePrefix = "",
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  valuePrefix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="mb-1 text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">
            {valuePrefix}{formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3" style={{ height }}>
      <Skeleton className="size-10 rounded-full" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-32" />
      <div className="mt-4 flex w-full items-end justify-center gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="w-8 rounded-t" style={{ height: `${Math.max(40, 60 + Math.random() * 120)}px` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  iconBg: string;
}

function StatCard({ title, value, change, icon, iconBg }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={`flex size-10 items-center justify-center rounded-lg ${iconBg}`}>{icon}</div>
          {change !== undefined && (
            <div className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
              change >= 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
            }`}>
              {change >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}

// ─── Data Hooks ───────────────────────────────────────────────────────────────

function useReportsData<T>(type: string, fallbackData: T) {
  return useQuery<T>({
    queryKey: ["reports", type],
    queryFn: () => fetch(`/api/reports?type=${type}`).then((r) => r.json()),
    placeholderData: fallbackData,
    staleTime: 60_000,
  });
}

function useSalesData() {
  return useQuery<{ data: SaleRecord[] }>({
    queryKey: ["sales-all"],
    queryFn: () => fetch("/api/sales?limit=1000").then((r) => r.json()),
    staleTime: 60_000,
  });
}

function useProductsData() {
  return useQuery<{ data: Product[] }>({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then((r) => r.json()),
    staleTime: 60_000,
  });
}

function useTopCustomers() {
  return useQuery<{ data: TopCustomer[] }>({
    queryKey: ["top-customers"],
    queryFn: () => fetch("/api/reports?type=top-customers").then((r) => r.json()),
    staleTime: 60_000,
  });
}

// ─── Fallback Data ───────────────────────────────────────────────────────────

const FALLBACK_SALES_TREND: SalesTrendPoint[] = [];
const FALLBACK_PRODUCTS: ProductSale[] = [];
const FALLBACK_CUSTOMERS: TopCustomer[] = [];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Reports() {
  const today = new Date();
  const defaultFrom = format(subDays(today, 30), "yyyy-MM-dd");
  const defaultTo = format(today, "yyyy-MM-dd");

  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);

  // Fetch data
  const salesTrendQuery = useReportsData<{ data: SalesTrendPoint[] }>("sales-trend", { data: FALLBACK_SALES_TREND });
  const topProductsQuery = useReportsData<{ data: ProductSale[] }>("top-products", { data: FALLBACK_PRODUCTS });
  const topCustomersQuery = useTopCustomers();
  const salesQuery = useSalesData();
  const productsQuery = useProductsData();

  // Parse raw data with fallbacks
  const salesTrendData = useMemo(() => {
    const raw = salesTrendQuery.data;
    if (raw && "data" in raw && Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw)) return raw;
    return FALLBACK_SALES_TREND;
  }, [salesTrendQuery.data]);

  const topProducts = useMemo(() => {
    const raw = topProductsQuery.data;
    if (raw && "data" in raw && Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw)) return raw;
    return FALLBACK_PRODUCTS;
  }, [topProductsQuery.data]);

  const topCustomers = useMemo(() => {
    const raw = topCustomersQuery.data;
    if (raw && "data" in raw && Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw)) return raw;
    return FALLBACK_CUSTOMERS;
  }, [topCustomersQuery.data]);

  const allSales = useMemo(() => {
    const raw = salesQuery.data;
    if (raw && "sales" in raw && Array.isArray(raw.sales)) return raw.sales;
    if (raw && "data" in raw && Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw)) return raw;
    return [] as SaleRecord[];
  }, [salesQuery.data]);

  const allProducts = useMemo(() => {
    const raw = productsQuery.data;
    if (raw && "data" in raw && Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw)) return raw;
    return [] as Product[];
  }, [productsQuery.data]);

  // ─── Revenue Summary from all sales ────────────────────────────────────

  const revenueSummary = useMemo(() => {
    const from = parseISO(dateFrom);
    const to = new Date(dateTo + "T23:59:59");
    const filtered = allSales.filter((s) => {
      try { return isWithinInterval(new Date(s.createdAt), { start: from, end: to }); }
      catch { return false; }
    });
    const totalRevenue = filtered.reduce((sum, s) => sum + (s.total || 0), 0);
    const numTx = filtered.length;
    const avgValue = numTx > 0 ? Math.round(totalRevenue / numTx) : 0;
    return { totalRevenue, numTx, avgValue };
  }, [allSales, dateFrom, dateTo]);

  // ─── Payment Modes from real sales data ─────────────────────────────────

  const paymentModes = useMemo(() => {
    const from = parseISO(dateFrom);
    const to = new Date(dateTo + "T23:59:59");
    const filtered = allSales.filter((s) => {
      try { return isWithinInterval(new Date(s.createdAt), { start: from, end: to }); }
      catch { return false; }
    });
    const map: Record<string, { mode: string; count: number; amount: number }> = {};
    filtered.forEach((s) => {
      const mode = s.paymentMode || "Cash";
      if (!map[mode]) map[mode] = { mode, count: 0, amount: 0 };
      map[mode].count += 1;
      map[mode].amount += s.total || 0;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [allSales, dateFrom, dateTo]);

  // ─── Daily revenue from real data ────────────────────────────────────────

  const dailyRevenue = useMemo((): SalesTrendPoint[] => {
    const from = parseISO(dateFrom);
    const to = new Date(dateTo + "T23:59:59");
    const filtered = allSales.filter((s) => {
      try { return isWithinInterval(new Date(s.createdAt), { start: from, end: to }); }
      catch { return false; }
    });
    const dayMap = new Map<string, { date: string; revenue: number; orders: number }>();
    filtered.forEach((s) => {
      const day = format(new Date(s.createdAt), "yyyy-MM-dd");
      const existing = dayMap.get(day) || { date: day, revenue: 0, orders: 0 };
      existing.revenue += s.total || 0;
      existing.orders += 1;
      dayMap.set(day, existing);
    });
    return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({
      ...d,
      date: format(parseISO(d.date), "MMM dd"),
    }));
  }, [allSales, dateFrom, dateTo]);

  // ─── Customer acquisition from real sales data ─────────────────────────

  const customerAcquisition = useMemo(() => {
    const seen = new Set<string>();
    const dailyNew: Record<string, number> = {};
    const from = parseISO(dateFrom);
    const to = new Date(dateTo + "T23:59:59");
    allSales
      .filter((s) => {
        try { return isWithinInterval(new Date(s.createdAt), { start: from, end: to }); }
        catch { return false; }
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach((s) => {
        // Each unique customer's first sale counts as acquisition
        const key = s.customer?.name || s.customerName || `anon-${s.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          const day = format(new Date(s.createdAt), "yyyy-MM-dd");
          dailyNew[day] = (dailyNew[day] || 0) + 1;
        }
      });
    return Object.entries(dailyNew)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, newCustomers]) => ({
        date: format(parseISO(date), "MMM dd"),
        newCustomers,
      }));
  }, [allSales, dateFrom, dateTo]);

  // ─── Top products by revenue (from real API data) ─────────────────────

  const topProductsByRevenue = useMemo(() => {
    if (topProducts.length === 0) return [];
    return [...topProducts]
      .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
      .slice(0, 10)
      .map((p) => ({
        name: p.name || "Unknown",
        revenue: p.totalRevenue || 0,
        quantity: p.totalQtySold || 0,
        category: p.category || "",
      }));
  }, [topProducts]);

  // ─── Monthly revenue for area chart ────────────────────────────────────

  const monthlyRevenue = useMemo((): SalesTrendPoint[] => {
    if (salesTrendData.length === 0) {
      // Build from raw sales
      const monthMap = new Map<string, { date: string; revenue: number; orders: number }>();
      allSales.forEach((s) => {
        const month = format(new Date(s.createdAt), "MMM yyyy");
        const existing = monthMap.get(month) || { date: month, revenue: 0, orders: 0 };
        existing.revenue += s.total || 0;
        existing.orders += 1;
        monthMap.set(month, existing);
      });
      return Array.from(monthMap.values()).slice(-12);
    }
    return salesTrendData.slice(0, 12).map((d) => ({
      ...d,
      date: format(parseISO(d.date), "MMM yyyy"),
    }));
  }, [salesTrendData, allSales]);

  const totalMonthlyRevenue = monthlyRevenue.reduce((s, d) => s + d.revenue, 0);
  const totalMonthlyOrders = monthlyRevenue.reduce((s, d) => s + d.orders, 0);
  const avgMonthlySaleValue = totalMonthlyOrders > 0 ? Math.round(totalMonthlyRevenue / totalMonthlyOrders) : 0;

  // ─── CSV Export ──────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);

  const handleDownloadCSV = useCallback(async () => {
    setExporting(true);
    try {
      const [salesRes, custRes, prodRes] = await Promise.allSettled([
        fetch("/api/sales?limit=999"),
        fetch("/api/customers?limit=999"),
        fetch("/api/products?pageSize=999"),
      ]);

      // ─── Section 1: Sales Summary ───────────────────────────────────
      let salesSheet = "SALES SUMMARY\n";
      salesSheet += "Date,Invoice#,Customer,Items,Subtotal,Discount,Tax,Total,Mode,Status\n";
      if (salesRes.status === "fulfilled" && salesRes.value.ok) {
        const salesData = await salesRes.value.json();
        const list: SaleRecord[] = Array.isArray(salesData.sales) ? salesData.sales : [];
        for (const s of list) {
          const dateStr = s.createdAt ? format(new Date(s.createdAt), "dd-MMM-yyyy") : "";
          const items = (s as Record<string, unknown>).itemsCount || 0;
          const disc = s.discount || 0;
          const tax = ((s as Record<string, unknown>).cgst || 0) + ((s as Record<string, unknown>).sgst || 0);
          const line = [
            dateStr,
            `"${s.invoiceNo || ""}"`,
            `"${(s.customer?.name || s.customerName || "").replace(/"/g, '""')}"`,
            items,
            (s as Record<string, unknown>).subtotal || 0,
            disc,
            tax,
            s.total || 0,
            s.paymentMode || "",
            s.status || "",
          ].join(",");
          salesSheet += line + "\n";
        }
      }

      // ─── Section 2: Customer Summary ────────────────────────────────
      let customerSheet = "\nCUSTOMER SUMMARY\n";
      customerSheet += "Name,Phone,Group,Orders,Total Spent\n";
      const customersMap = new Map<string, { orders: number; spent: number }>();
      if (salesRes.status === "fulfilled" && salesRes.value.ok) {
        const salesData = await salesRes.value.json();
        const list: SaleRecord[] = Array.isArray(salesData.sales) ? salesData.sales : [];
        for (const s of list) {
          const name = s.customer?.name || s.customerName || "Walk-in";
          const existing = customersMap.get(name) || { orders: 0, spent: 0 };
          existing.orders += 1;
          existing.spent += s.total || 0;
          customersMap.set(name, existing);
        }
      }
      if (custRes.status === "fulfilled" && custRes.value.ok) {
        const custData = await custRes.value.json();
        const custList = Array.isArray(custData.data) ? custData.data : [];
        for (const c of custList) {
          const r = c as Record<string, unknown>;
          const stats = customersMap.get(r.name as string) || { orders: 0, spent: 0 };
          const line = [
            `"${(r.name || "").toString().replace(/"/g, '""')}"`,
            `"${(r.phone || "").toString()}"`,
            `"${(r.group || "New").toString()}"`,
            stats.orders,
            stats.spent,
          ].join(",");
          customerSheet += line + "\n";
        }
      }

      // ─── Section 3: Product Performance ─────────────────────────────
      let productSheet = "\nPRODUCT PERFORMANCE\n";
      productSheet += "Name,Category,Price,Stock,Revenue\n";
      const productSalesMap = new Map<string, { qty: number; revenue: number }>();
      if (salesRes.status === "fulfilled" && salesRes.value.ok) {
        // Fetch sale items from individual sale details for product performance
        // We'll use the top products API for this
      }
      if (prodRes.status === "fulfilled" && prodRes.value.ok) {
        const prodData = await prodRes.value.json();
        const prodList = Array.isArray(prodData.products) ? prodData.products : [];
        // Try to get product performance data from the reports API
        try {
          const perfRes = await fetch("/api/reports?type=top-products");
          if (perfRes.ok) {
            const perfData = await perfRes.json();
            const perfList = Array.isArray(perfData.data) ? perfData.data : [];
            const perfMap = new Map<string, { qty: number; revenue: number }>();
            for (const p of perfList) {
              const pr = p as Record<string, unknown>;
              perfMap.set(pr.name as string, {
                qty: (pr.totalQtySold as number) || 0,
                revenue: (pr.totalRevenue as number) || 0,
              });
            }
            for (const p of prodList) {
              const pr = p as Record<string, unknown>;
              const perf = perfMap.get(pr.name as string) || { qty: 0, revenue: 0 };
              const line = [
                `"${(pr.name || "").toString().replace(/"/g, '""')}"`,
                `"${(pr.category || "").toString()}"`,
                pr.price || 0,
                pr.stock || 0,
                perf.revenue,
              ].join(",");
              productSheet += line + "\n";
            }
          } else {
            for (const p of prodList) {
              const pr = p as Record<string, unknown>;
              const line = [
                `"${(pr.name || "").toString().replace(/"/g, '""')}"`,
                `"${(pr.category || "").toString()}"`,
                pr.price || 0,
                pr.stock || 0,
                0,
              ].join(",");
              productSheet += line + "\n";
            }
          }
        } catch {
          for (const p of prodList) {
            const pr = p as Record<string, unknown>;
            const line = [
              `"${(pr.name || "").toString().replace(/"/g, '""')}"`,
              `"${(pr.category || "").toString()}"`,
              pr.price || 0,
              pr.stock || 0,
              0,
            ].join(",");
            productSheet += line + "\n";
          }
        }
      }

      const csvContent = salesSheet + "\n" + customerSheet + "\n" + productSheet;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crm-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Report downloaded successfully!");
    } catch {
      toast.error("Failed to download report");
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Business insights for Sankaran Kovil Opticals
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 gap-2"
          onClick={handleDownloadCSV}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download CSV Report
        </Button>
      </div>

      {/* Date Range Picker */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Date Range:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="rpt-from" className="text-xs">From</Label>
                <Input id="rpt-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-[150px] text-xs" />
              </div>
              <div className="flex items-center gap-1.5">
                <Label htmlFor="rpt-to" className="text-xs">To</Label>
                <Input id="rpt-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-[150px] text-xs" />
              </div>
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => { setDateFrom(defaultFrom); setDateTo(defaultTo); }}>
                Last 30 Days
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => { setDateFrom(format(subDays(today, 7), "yyyy-MM-dd")); setDateTo(defaultTo); }}>
                Last 7 Days
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(revenueSummary.totalRevenue)} icon={<DollarSign className="size-5 text-white" />} iconBg="bg-emerald-600" />
        <StatCard title="Avg Sale Value" value={formatCurrency(revenueSummary.avgValue)} icon={<IndianRupee className="size-5 text-white" />} iconBg="bg-teal-600" />
        <StatCard title="Transactions" value={formatNumber(revenueSummary.numTx)} icon={<ShoppingCart className="size-5 text-white" />} iconBg="bg-emerald-700" />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5"><TrendingUp className="h-4 w-4" /><span className="hidden sm:inline">Overview</span></TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5"><ShoppingCart className="h-4 w-4" /><span className="hidden sm:inline">Products</span></TabsTrigger>
          <TabsTrigger value="customers" className="gap-1.5"><Users className="h-4 w-4" /><span className="hidden sm:inline">Customers</span></TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ──────────────────────────────────────────── */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Revenue Trend + Payment Modes */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
                  <CardDescription>Revenue over the past 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlyRevenue.length === 0 ? (
                    <ChartSkeleton height={320} />
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id={CHART_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<ChartTooltip valuePrefix="₹" />} formatter={(value: number) => [formatCurrency(value), "Revenue"]} />
                        <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} fill={`url(#${CHART_GRADIENT_ID})`} name="Revenue" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Payment Mode Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sales by Payment Mode</CardTitle>
                  <CardDescription>UPI, Cash, Card distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  {paymentModes.length === 0 ? (
                    <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">No sales data in selected period</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={paymentModes}
                          cx="50%"
                          cy="45%"
                          outerRadius={85}
                          innerRadius={40}
                          dataKey="amount"
                          nameKey="mode"
                          labelLine={false}
                          label={renderCustomLabel}
                        >
                          {paymentModes.map((entry) => (
                            <Cell key={entry.mode} fill={PAYMENT_COLORS[entry.mode] || COLORS[paymentModes.indexOf(entry) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={<ChartTooltip valuePrefix="₹" />}
                          formatter={(value: number, name: string) => [formatCurrency(value), name]}
                        />
                        <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v: string) => <span className="text-xs text-foreground">{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payment Mode Bar Chart */}
            {paymentModes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment Mode Breakdown</CardTitle>
                  <CardDescription>Transaction count and revenue by payment method</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={paymentModes} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <XAxis dataKey="mode" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        content={<ChartTooltip valuePrefix="₹" />}
                        formatter={(value: number, name: string) => {
                          if (name === "amount") return [formatCurrency(value), "Revenue"];
                          return [formatNumber(value), "Count"];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={40} name="Revenue (₹)">
                        {paymentModes.map((entry) => (
                          <Cell key={entry.mode} fill={PAYMENT_COLORS[entry.mode] || COLORS[0]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Daily Revenue Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daily Revenue ({format(parseISO(dateFrom), "dd MMM")} - {format(parseISO(dateTo), "dd MMM yyyy")})</CardTitle>
                <CardDescription>Daily revenue and transaction count</CardDescription>
              </CardHeader>
              <CardContent>
                {dailyRevenue.length === 0 ? (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No sales data in selected period</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        content={<ChartTooltip valuePrefix="₹" />}
                        formatter={(value: number, name: string) => {
                          if (name === "revenue") return [formatCurrency(value), "Revenue"];
                          return [formatNumber(value), "Orders"];
                        }}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: "#059669" }} name="Revenue" />
                      <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#34d399" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 5, fill: "#34d399" }} name="Orders" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Products Tab ──────────────────────────────────────────── */}
        <TabsContent value="products">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top 10 Products by Revenue</CardTitle>
                <CardDescription>Highest revenue-generating products</CardDescription>
              </CardHeader>
              <CardContent>
                {topProductsByRevenue.length === 0 ? (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground text-sm">No product sales data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(350, topProductsByRevenue.length * 38 + 20)}>
                    <BarChart data={topProductsByRevenue} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#374151" }} axisLine={false} tickLine={false} width={115} />
                      <Tooltip
                        content={<ChartTooltip valuePrefix="₹" />}
                        formatter={(value: number, name: string) => {
                          if (name === "revenue") return [formatCurrency(value), "Revenue"];
                          return [formatNumber(value), "Qty Sold"];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#059669" radius={[0, 4, 4, 0]} barSize={18} name="Revenue (₹)">
                        {topProductsByRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Product table */}
            {topProductsByRevenue.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Product Revenue Details</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Product Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Qty Sold</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProductsByRevenue.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-muted-foreground font-mono text-xs">{i + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{p.name}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-xs">{p.category}</Badge></TableCell>
                            <TableCell className="text-right font-mono text-sm">{formatNumber(p.quantity)}</TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold">{formatCurrency(p.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ─── Customers Tab ────────────────────────────────────────── */}
        <TabsContent value="customers">
          <div className="space-y-6">
            {/* Customer Acquisition Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Acquisition</CardTitle>
                <CardDescription>New customers per day in the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {customerAcquisition.length === 0 ? (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">No customer acquisition data in selected period</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={customerAcquisition} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} formatter={(value: number) => [formatNumber(value), "New Customers"]} />
                      <Line type="monotone" dataKey="newCustomers" stroke="#059669" strokeWidth={2.5} dot={{ fill: "#059669", r: 4 }} activeDot={{ r: 6, fill: "#059669" }} name="New Customers" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top Customers Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Customers by Total Spend</CardTitle>
                <CardDescription>Highest spending customers in the selected period</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {topCustomers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Users className="h-10 w-10 mb-2 opacity-40" />
                    <p className="text-sm">No customer data available</p>
                  </div>
                ) : (
                  <div className="max-h-[480px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Customer Name</TableHead>
                          <TableHead className="hidden sm:table-cell">Phone</TableHead>
                          <TableHead className="hidden md:table-cell">Group</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">Total Spent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topCustomers.map((c, i) => (
                          <TableRow key={c.id}>
                            <TableCell className="text-muted-foreground font-mono text-xs">{i + 1}</TableCell>
                            <TableCell className="font-medium text-sm">{c.name}</TableCell>
                            <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{c.phone || "—"}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="secondary" className="text-xs">{c.group || "New"}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{c._count?.sales ?? 0}</TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(c.totalSpent || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}