"use client";

import React, { useMemo, useState } from "react";
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
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  IndianRupee,
  BarChart3,
  Activity,
  BoxIcon,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval } from "date-fns";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Color Palette (Emerald/Green) ───────────────────────────────────────────

const COLORS = [
  "#059669", // emerald-600
  "#10b981", // emerald-500
  "#34d399", // emerald-400
  "#6ee7b7", // emerald-300
  "#a7f3d0", // emerald-200
  "#047857", // emerald-700
  "#065f46", // emerald-800
  "#d1fae5", // emerald-100
  "#16a34a", // green-600
  "#22c55e", // green-500
  "#4ade80", // green-400
  "#86efac", // green-300
];

const CHART_GRADIENT_ID = "emeraldGradient";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SalesTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface ProductSales {
  name: string;
  quantity: number;
  revenue: number;
  category?: string;
}

interface CustomerSpend {
  name: string;
  totalSpent: number;
  orderCount: number;
  group?: string;
}

interface InventoryItem {
  name: string;
  category: string;
  stock: number;
  minStock: number;
  costPrice: number;
  sellingPrice: number;
  turnoverRate?: number;
}

interface CustomerAcquisition {
  month: string;
  newCustomers: number;
}

interface PaymentMode {
  mode: string;
  count: number;
  amount: number;
}

interface CategorySales {
  category: string;
  sales: number;
}

interface CustomerGroup {
  group: string;
  count: number;
}

// ─── API Response Types ──────────────────────────────────────────────────────

interface ApiResponse<T> {
  data: T;
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

function getDateRange(period: string): { from: Date; to: Date } {
  const now = new Date();
  switch (period) {
    case "7d":
      return { from: subDays(now, 7), to: now };
    case "30d":
      return { from: subDays(now, 30), to: now };
    case "3m":
      return { from: subMonths(now, 3), to: now };
    case "6m":
      return { from: subMonths(now, 6), to: now };
    case "1y":
      return { from: subMonths(now, 12), to: now };
    default:
      return { from: subDays(now, 30), to: now };
  }
}

const RADIAN = Math.PI / 180;

function renderCustomizedLabel({
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
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
  valuePrefix = "",
  valueSuffix = "",
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="mb-1 text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">
            {valuePrefix}
            {typeof entry.value === "number"
              ? formatNumber(entry.value)
              : entry.value}
            {valueSuffix}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton Loaders ────────────────────────────────────────────────────────

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3" style={{ height }}>
      <Skeleton className="size-10 rounded-full" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-32" />
      <div className="mt-4 flex w-full items-end justify-center gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-8 rounded-t"
            style={{ height: `${Math.max(40, 60 + Math.random() * 120)}px` }}
          />
        ))}
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="size-10 rounded-lg" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="mt-3 h-7 w-28" />
        <Skeleton className="mt-1 h-4 w-20" />
      </CardContent>
    </Card>
  );
}

// ─── Data Fetching Hooks ─────────────────────────────────────────────────────

function useReportsData<T>(type: string, fallbackData: T) {
  return useQuery<ApiResponse<T>>({
    queryKey: ["reports", type],
    queryFn: () => fetch(`/api/reports?type=${type}`).then((r) => r.json()),
    placeholderData: { data: fallbackData },
    staleTime: 60_000,
  });
}

function useSalesData() {
  return useQuery<ApiResponse<SalesTrendPoint[]>>({
    queryKey: ["sales"],
    queryFn: () => fetch("/api/sales").then((r) => r.json()),
    staleTime: 60_000,
  });
}

function useProductsData() {
  return useQuery<ApiResponse<InventoryItem[]>>({
    queryKey: ["products"],
    queryFn: () => fetch("/api/products").then((r) => r.json()),
    staleTime: 60_000,
  });
}

function useCustomersData() {
  return useQuery<ApiResponse<CustomerSpend[]>>({
    queryKey: ["customers"],
    queryFn: () => fetch("/api/customers").then((r) => r.json()),
    staleTime: 60_000,
  });
}

// ─── Fallback / Demo Data ───────────────────────────────────────────────────

const DEMO_MONTHLY_REVENUE: SalesTrendPoint[] = [
  { date: "Jan 2025", revenue: 485000, orders: 142 },
  { date: "Feb 2025", revenue: 512000, orders: 158 },
  { date: "Mar 2025", revenue: 598000, orders: 175 },
  { date: "Apr 2025", revenue: 475000, orders: 138 },
  { date: "May 2025", revenue: 623000, orders: 189 },
  { date: "Jun 2025", revenue: 689000, orders: 204 },
  { date: "Jul 2025", revenue: 721000, orders: 218 },
  { date: "Aug 2025", revenue: 654000, orders: 195 },
  { date: "Sep 2025", revenue: 798000, orders: 237 },
  { date: "Oct 2025", revenue: 845000, orders: 252 },
  { date: "Nov 2025", revenue: 912000, orders: 271 },
  { date: "Dec 2025", revenue: 1035000, orders: 305 },
];

const DEMO_DAILY_SALES_7D: SalesTrendPoint[] = [
  { date: "Mon", revenue: 32500, orders: 9 },
  { date: "Tue", revenue: 28900, orders: 8 },
  { date: "Wed", revenue: 41200, orders: 12 },
  { date: "Thu", revenue: 37800, orders: 11 },
  { date: "Fri", revenue: 52300, orders: 15 },
  { date: "Sat", revenue: 68400, orders: 20 },
  { date: "Sun", revenue: 45600, orders: 13 },
];

const DEMO_DAILY_SALES_30D: SalesTrendPoint[] = Array.from({ length: 30 }, (_, i) => ({
  date: format(subDays(new Date(), 29 - i), "MMM dd"),
  revenue: 25000 + Math.floor(Math.random() * 50000),
  orders: 7 + Math.floor(Math.random() * 18),
}));

const DEMO_DAILY_SALES_3M: SalesTrendPoint[] = Array.from({ length: 90 }, (_, i) => ({
  date: format(subDays(new Date(), 89 - i), "MMM dd"),
  revenue: 20000 + Math.floor(Math.random() * 60000),
  orders: 5 + Math.floor(Math.random() * 22),
}));

const DEMO_PAYMENT_MODES: PaymentMode[] = [
  { mode: "Cash", count: 245, amount: 1285000 },
  { mode: "Card", count: 312, amount: 2156000 },
  { mode: "UPI", count: 528, amount: 2890000 },
  { mode: "Credit", count: 87, amount: 634000 },
];

const DEMO_TOP_PRODUCTS: ProductSales[] = [
  { name: "Ray-Ban Aviator Classic", quantity: 156, revenue: 702000, category: "Sunglasses" },
  { name: "Titan Eye+ Rectangle", quantity: 142, revenue: 497000, category: "Frames" },
  { name: "Essilor Crizal Easy Pro", quantity: 238, revenue: 428400, category: "Lenses" },
  { name: "Oakley Holbrook", quantity: 98, revenue: 490000, category: "Sunglasses" },
  { name: "Vincent Chase Round", quantity: 134, revenue: 375200, category: "Frames" },
  { name: "Zeiss BlueGuard", quantity: 189, revenue: 359100, category: "Lenses" },
  { name: "Carrera Champion", quantity: 87, revenue: 313200, category: "Sunglasses" },
  { name: "Tommy Hilfiger TH 1632", quantity: 112, revenue: 291200, category: "Frames" },
  { name: "Hoya EnRoute", quantity: 167, revenue: 283900, category: "Lenses" },
  { name: "Polaroid PLD 6014", quantity: 95, revenue: 237500, category: "Sunglasses" },
];

const DEMO_CATEGORY_SALES: CategorySales[] = [
  { category: "Frames", sales: 35 },
  { category: "Lenses", sales: 32 },
  { category: "Sunglasses", sales: 25 },
  { category: "Accessories", sales: 8 },
];

const DEMO_TOP_CUSTOMERS: CustomerSpend[] = [
  { name: "Rajesh Kumar", totalSpent: 245000, orderCount: 18, group: "Premium" },
  { name: "Priya Sharma", totalSpent: 198000, orderCount: 14, group: "Regular" },
  { name: "Amit Patel", totalSpent: 176500, orderCount: 12, group: "Wholesale" },
  { name: "Sunita Verma", totalSpent: 154200, orderCount: 11, group: "Premium" },
  { name: "Vikram Singh", totalSpent: 138900, orderCount: 10, group: "Regular" },
  { name: "Neha Gupta", totalSpent: 125400, orderCount: 9, group: "New" },
  { name: "Deepak Joshi", totalSpent: 112000, orderCount: 8, group: "Regular" },
  { name: "Anita Desai", totalSpent: 98700, orderCount: 7, group: "Wholesale" },
  { name: "Rohit Mehta", totalSpent: 87600, orderCount: 6, group: "New" },
  { name: "Kavita Reddy", totalSpent: 76500, orderCount: 5, group: "Regular" },
];

const DEMO_CUSTOMER_ACQUISITION: CustomerAcquisition[] = [
  { month: "Jan", newCustomers: 18 },
  { month: "Feb", newCustomers: 22 },
  { month: "Mar", newCustomers: 28 },
  { month: "Apr", newCustomers: 15 },
  { month: "May", newCustomers: 32 },
  { month: "Jun", newCustomers: 25 },
  { month: "Jul", newCustomers: 38 },
  { month: "Aug", newCustomers: 30 },
  { month: "Sep", newCustomers: 42 },
  { month: "Oct", newCustomers: 35 },
  { month: "Nov", newCustomers: 48 },
  { month: "Dec", newCustomers: 52 },
];

const DEMO_CUSTOMER_GROUPS: CustomerGroup[] = [
  { group: "Regular", count: 312 },
  { group: "Wholesale", count: 78 },
  { group: "New", count: 145 },
  { group: "Premium", count: 54 },
];

const DEMO_INVENTORY: InventoryItem[] = [
  { name: "Ray-Ban Aviator Classic", category: "Sunglasses", stock: 24, minStock: 15, costPrice: 3200, sellingPrice: 4500, turnoverRate: 8.2 },
  { name: "Titan Eye+ Rectangle", category: "Frames", stock: 38, minStock: 20, costPrice: 1800, sellingPrice: 3500, turnoverRate: 6.5 },
  { name: "Essilor Crizal Easy Pro", category: "Lenses", stock: 12, minStock: 25, costPrice: 1200, sellingPrice: 1800, turnoverRate: 9.1 },
  { name: "Oakley Holbrook", category: "Sunglasses", stock: 18, minStock: 10, costPrice: 3800, sellingPrice: 5000, turnoverRate: 7.4 },
  { name: "Vincent Chase Round", category: "Frames", stock: 8, minStock: 15, costPrice: 900, sellingPrice: 2800, turnoverRate: 5.8 },
  { name: "Zeiss BlueGuard", category: "Lenses", stock: 5, minStock: 20, costPrice: 1500, sellingPrice: 1900, turnoverRate: 10.2 },
  { name: "Carrera Champion", category: "Sunglasses", stock: 15, minStock: 10, costPrice: 2800, sellingPrice: 3600, turnoverRate: 6.9 },
  { name: "Tommy Hilfiger TH 1632", category: "Frames", stock: 22, minStock: 12, costPrice: 2200, sellingPrice: 2600, turnoverRate: 5.3 },
  { name: "Hoya EnRoute", category: "Lenses", stock: 3, minStock: 15, costPrice: 1400, sellingPrice: 1700, turnoverRate: 8.7 },
  { name: "Polaroid PLD 6014", category: "Sunglasses", stock: 20, minStock: 8, costPrice: 1800, sellingPrice: 2500, turnoverRate: 7.1 },
  { name: "Bausch & Lomb Ultra", category: "Lenses", stock: 2, minStock: 10, costPrice: 2500, sellingPrice: 3500, turnoverRate: 4.5 },
  { name: "Gucci GG 0061S", category: "Sunglasses", stock: 7, minStock: 5, costPrice: 12000, sellingPrice: 16500, turnoverRate: 3.2 },
  { name: "Ray-Ban Wayfarer", category: "Sunglasses", stock: 30, minStock: 12, costPrice: 3500, sellingPrice: 4900, turnoverRate: 9.5 },
  { name: "Lenskart Air Flex", category: "Frames", stock: 4, minStock: 20, costPrice: 600, sellingPrice: 1800, turnoverRate: 7.8 },
  { name: "Seiko 1.67 Hi-Index", category: "Lenses", stock: 6, minStock: 12, costPrice: 2000, sellingPrice: 3200, turnoverRate: 6.1 },
];

const DEMO_INVENTORY_CATEGORIES: CategorySales[] = [
  { category: "Frames", sales: 38 },
  { category: "Lenses", sales: 28 },
  { category: "Sunglasses", sales: 30 },
  { category: "Accessories", sales: 4 },
];

// ─── Stat Card Component ─────────────────────────────────────────────────────

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
          <div className={`flex size-10 items-center justify-center rounded-lg ${iconBg}`}>
            {icon}
          </div>
          {change !== undefined && (
            <div
              className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                change >= 0
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                  : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
              }`}
            >
              {change >= 0 ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
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

// ─── Sales Tab ───────────────────────────────────────────────────────────────

function SalesTab() {
  const [dateRange, setDateRange] = useState("30d");

  const salesTrendQuery = useReportsData<SalesTrendPoint[]>("sales-trend", DEMO_MONTHLY_REVENUE);
  const salesQuery = useSalesData();
  const salesData = salesQuery.data?.data ?? [];

  const dailySalesMap = useMemo(() => {
    const map: Record<string, SalesTrendPoint[]> = {
      "7d": DEMO_DAILY_SALES_7D,
      "30d": DEMO_DAILY_SALES_30D,
      "3m": DEMO_DAILY_SALES_3M,
      "6m": DEMO_DAILY_SALES_3M,
      "1y": DEMO_DAILY_SALES_3M,
    };
    return map[dateRange] ?? DEMO_DAILY_SALES_30D;
  }, [dateRange]);

  const monthlyRevenue = salesTrendQuery.data?.data ?? DEMO_MONTHLY_REVENUE;

  const totalRevenue = useMemo(() => {
    return dailySalesMap.reduce((sum, d) => sum + d.revenue, 0);
  }, [dailySalesMap]);

  const totalOrders = useMemo(() => {
    return dailySalesMap.reduce((sum, d) => sum + d.orders, 0);
  }, [dailySalesMap]);

  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const revenueChange = 12.5;
  const aovChange = 3.2;
  const ordersChange = 8.7;

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Period:</span>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="3m">Last 3 Months</SelectItem>
            <SelectItem value="6m">Last 6 Months</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          change={revenueChange}
          icon={<DollarSign className="size-5 text-white" />}
          iconBg="bg-emerald-600"
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(avgOrderValue)}
          change={aovChange}
          icon={<TrendingUp className="size-5 text-white" />}
          iconBg="bg-emerald-700"
        />
        <StatCard
          title="Total Orders"
          value={formatNumber(totalOrders)}
          change={ordersChange}
          icon={<ShoppingCart className="size-5 text-white" />}
          iconBg="bg-emerald-500"
        />
      </div>

      <Separator />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Revenue Trend - Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
            <CardDescription>Revenue and order volume over the past 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            {salesTrendQuery.isLoading ? (
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
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={
                      <ChartTooltip valuePrefix="₹" />
                    }
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === "revenue" ? "Revenue" : "Orders",
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#059669"
                    strokeWidth={2}
                    fill={`url(#${CHART_GRADIENT_ID})`}
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Payment Mode Distribution - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Modes</CardTitle>
            <CardDescription>Distribution by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={DEMO_PAYMENT_MODES}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  innerRadius={45}
                  dataKey="amount"
                  nameKey="mode"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {DEMO_PAYMENT_MODES.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={<ChartTooltip valuePrefix="₹" />}
                  formatter={(value: number) => [formatCurrency(value), "Amount"]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Daily Sales Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Sales</CardTitle>
          <CardDescription>
            Daily revenue and orders for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySalesMap} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={
                  <ChartTooltip valuePrefix="₹" />
                }
                formatter={(value: number, name: string) => {
                  if (name === "revenue") return [formatCurrency(value), "Revenue"];
                  return [formatNumber(value), "Orders"];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#059669"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#059669" }}
                name="Revenue"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#34d399"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 5, fill: "#34d399" }}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Products Tab ────────────────────────────────────────────────────────────

function ProductsTab() {
  const topProductsQuery = useReportsData<ProductSales[]>("top-products", DEMO_TOP_PRODUCTS);
  const productsQuery = useProductsData();

  const topProducts = topProductsQuery.data?.data ?? DEMO_TOP_PRODUCTS;
  const allProducts = productsQuery.data?.data ?? DEMO_INVENTORY;

  const lowStockProducts = useMemo(() => {
    return allProducts
      .filter((p) => p.stock < p.minStock)
      .sort((a, b) => a.stock / a.minStock - b.stock / b.minStock);
  }, [allProducts]);

  const categorySales = DEMO_CATEGORY_SALES;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top 10 Best Selling - Horizontal Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top 10 Best Selling Products</CardTitle>
            <CardDescription>Ranked by quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            {topProductsQuery.isLoading ? (
              <ChartSkeleton height={420} />
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(400, topProducts.length * 40 + 20)}>
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#374151" }}
                    axisLine={false}
                    tickLine={false}
                    width={115}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    formatter={(value: number, name: string) => {
                      if (name === "quantity") return [formatNumber(value), "Units Sold"];
                      return [formatCurrency(value), "Revenue"];
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="quantity"
                    fill="#059669"
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                    name="Units Sold"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category-wise Sales - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category-wise Sales</CardTitle>
            <CardDescription>Revenue share by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={categorySales}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  innerRadius={45}
                  dataKey="sales"
                  nameKey="category"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {categorySales.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={<ChartTooltip valueSuffix="%" />}
                  formatter={(value: number) => [`${value}%`, "Share"]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Low Stock Alert - Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              <CardTitle className="text-base">Low Stock Alert</CardTitle>
            </div>
            <CardDescription>
              Products below minimum stock level
              {lowStockProducts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {lowStockProducts.length}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No low stock alerts
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStockProducts.map((product) => {
                      const ratio = product.stock / product.minStock;
                      const isCritical = ratio < 0.3;
                      return (
                        <TableRow key={product.name}>
                          <TableCell className="max-w-[180px] truncate font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {product.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {product.stock}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">
                            {product.minStock}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={isCritical ? "destructive" : "outline"}
                              className={
                                isCritical
                                  ? ""
                                  : "border-amber-300 text-amber-700 dark:border-amber-600 dark:text-amber-400"
                              }
                            >
                              {isCritical ? "Critical" : "Low"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Customers Tab ───────────────────────────────────────────────────────────

function CustomersTab() {
  const topCustomersQuery = useReportsData<CustomerSpend[]>("top-customers", DEMO_TOP_CUSTOMERS);
  const customersQuery = useCustomersData();

  const topCustomers = topCustomersQuery.data?.data ?? DEMO_TOP_CUSTOMERS;
  const customerAcquisition = DEMO_CUSTOMER_ACQUISITION;
  const customerGroups = DEMO_CUSTOMER_GROUPS;

  const totalCustomers = customerGroups.reduce((s, g) => s + g.count, 0);

  const maxSpend = useMemo(() => {
    return Math.max(...topCustomers.map((c) => c.totalSpent));
  }, [topCustomers]);

  return (
    <div className="space-y-6">
      {/* Top 10 Customers Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 10 Customers by Spend</CardTitle>
          <CardDescription>Highest spending customers in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {topCustomersQuery.isLoading ? (
            <ChartSkeleton height={380} />
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={topCustomers} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={70}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  content={<ChartTooltip valuePrefix="₹" />}
                  formatter={(value: number, name: string) => {
                    if (name === "totalSpent") return [formatCurrency(value), "Total Spent"];
                    return [formatNumber(value), "Orders"];
                  }}
                />
                <Legend />
                <Bar
                  dataKey="totalSpent"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                  name="Total Spent"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Customer Acquisition Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Acquisition</CardTitle>
            <CardDescription>New customers added each month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={customerAcquisition}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  formatter={(value: number) => [formatNumber(value), "New Customers"]}
                />
                <Line
                  type="monotone"
                  dataKey="newCustomers"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ fill: "#059669", r: 4 }}
                  activeDot={{ r: 6, fill: "#059669" }}
                  name="New Customers"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Group Distribution Pie */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Customer Groups</CardTitle>
                <CardDescription>Distribution by customer type</CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm">
                {formatNumber(totalCustomers)} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerGroups}
                  cx="50%"
                  cy="45%"
                  outerRadius={85}
                  innerRadius={42}
                  dataKey="count"
                  nameKey="group"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {customerGroups.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={<ChartTooltip />}
                  formatter={(value: number, name: string) => [
                    `${formatNumber(value)} customers`,
                    name,
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Inventory Tab ───────────────────────────────────────────────────────────

function InventoryTab() {
  const turnoverQuery = useReportsData<InventoryItem[]>("inventory-turnover", DEMO_INVENTORY);
  const productsQuery = useProductsData();

  const inventory = turnoverQuery.data?.data ?? DEMO_INVENTORY;
  const inventoryCategories = DEMO_INVENTORY_CATEGORIES;

  const totalCostValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.stock * item.costPrice, 0);
  }, [inventory]);

  const totalSellingValue = useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.stock * item.sellingPrice, 0);
  }, [inventory]);

  const potentialProfit = totalSellingValue - totalCostValue;
  const profitMargin = totalCostValue > 0 ? ((potentialProfit / totalCostValue) * 100).toFixed(1) : "0";

  const turnoverData = useMemo(() => {
    return [...inventory]
      .sort((a, b) => (b.turnoverRate ?? 0) - (a.turnoverRate ?? 0))
      .slice(0, 10);
  }, [inventory]);

  return (
    <div className="space-y-6">
      {/* Stock Value Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total SKUs"
          value={formatNumber(inventory.length)}
          change={5.2}
          icon={<Package className="size-5 text-white" />}
          iconBg="bg-emerald-600"
        />
        <StatCard
          title="Stock Value (Cost)"
          value={formatCurrency(totalCostValue)}
          icon={<IndianRupee className="size-5 text-white" />}
          iconBg="bg-emerald-700"
        />
        <StatCard
          title="Stock Value (Selling)"
          value={formatCurrency(totalSellingValue)}
          change={8.4}
          icon={<TrendingUp className="size-5 text-white" />}
          iconBg="bg-emerald-500"
        />
        <StatCard
          title="Potential Profit"
          value={formatCurrency(potentialProfit)}
          change={parseFloat(profitMargin)}
          icon={<BarChart3 className="size-5 text-white" />}
          iconBg="bg-emerald-800"
        />
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Inventory Turnover Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Inventory Turnover Rate</CardTitle>
            <CardDescription>Products ranked by sales velocity</CardDescription>
          </CardHeader>
          <CardContent>
            {turnoverQuery.isLoading ? (
              <ChartSkeleton height={380} />
            ) : (
              <ResponsiveContainer width="100%" height={380}>
                <BarChart
                  data={turnoverData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#374151" }}
                    axisLine={false}
                    tickLine={false}
                    width={115}
                  />
                  <Tooltip
                    content={<ChartTooltip valueSuffix="x" />}
                    formatter={(value: number) => [`${value.toFixed(1)}x`, "Turnover Rate"]}
                  />
                  <Bar
                    dataKey="turnoverRate"
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                    name="Turnover Rate"
                  >
                    {turnoverData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                        opacity={1 - i * 0.06}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory by Category</CardTitle>
            <CardDescription>Stock distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={380}>
              <PieChart>
                <Pie
                  data={inventoryCategories}
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  innerRadius={45}
                  dataKey="sales"
                  nameKey="category"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {inventoryCategories.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={<ChartTooltip valueSuffix="%" />}
                  formatter={(value: number) => [`${value}%`, "Share"]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Main Reports Component ──────────────────────────────────────────────────

export default function Reports() {
  return (
    <section className="w-full" aria-label="CRM Reports & Analytics">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Reports & Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comprehensive insights into your sales, products, customers, and inventory.
        </p>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="sales" className="gap-1.5">
            <DollarSign className="size-4" />
            <span className="hidden sm:inline">Sales</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="size-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-1.5">
            <Users className="size-4" />
            <span className="hidden sm:inline">Customers</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-1.5">
            <BoxIcon className="size-4" />
            <span className="hidden sm:inline">Inventory</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <SalesTab />
        </TabsContent>
        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="customers">
          <CustomersTab />
        </TabsContent>
        <TabsContent value="inventory">
          <InventoryTab />
        </TabsContent>
      </Tabs>
    </section>
  );
}