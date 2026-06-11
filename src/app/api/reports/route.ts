import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    switch (type) {
      case "sales-trend":
        return getSalesTrend();
      case "top-products":
        return getTopProducts();
      case "top-customers":
        return getTopCustomers();
      case "inventory-turnover":
        return getInventoryTurnover();
      case "revenue-comparison":
        return getRevenueComparison();
      case "product-performance":
        return getProductPerformance();
      case "customer-acquisition":
        return getCustomerAcquisition();
      default:
        return NextResponse.json(
          { error: "Invalid report type. Use: sales-trend, top-products, top-customers, inventory-turnover, revenue-comparison, product-performance, customer-acquisition" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}

/**
 * Daily sales for the last 30 days, grouped by date.
 */
async function getSalesTrend() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const sales = await db.sale.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: {
      createdAt: true,
      totalAmount: true,
      discount: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group sales by date (YYYY-MM-DD)
  const grouped = new Map<string, { date: string; total: number; count: number }>();

  // Pre-fill all 30 days so days with no sales still appear
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().split("T")[0];
    grouped.set(key, { date: key, total: 0, count: 0 });
  }

  for (const sale of sales) {
    const key = sale.createdAt.toISOString().split("T")[0];
    const existing = grouped.get(key);
    if (existing) {
      existing.total += sale.totalAmount;
      existing.count += 1;
    }
  }

  return NextResponse.json({
    report: "sales-trend",
    period: "last-30-days",
    data: Array.from(grouped.values()),
  });
}

/**
 * Top 10 products by total quantity sold.
 */
async function getTopProducts() {
  const products = await db.saleItem.groupBy({
    by: ["productId"],
    _sum: { qty: true, total: true },
    orderBy: { _sum: { qty: "desc" } },
    take: 10,
  });

  // Enrich with product details
  const enriched = await Promise.all(
    products.map(async (item) => {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: {
          name: true,
          sku: true,
          category: true,
          brand: true,
          price: true,
          stock: true,
        },
      });

      return {
        productId: item.productId,
        name: product?.name ?? "Unknown",
        sku: product?.sku ?? "",
        category: product?.category ?? "",
        brand: product?.brand ?? "",
        price: product?.price ?? 0,
        currentStock: product?.stock ?? 0,
        totalQtySold: item._sum.qty ?? 0,
        totalRevenue: item._sum.total ?? 0,
      };
    }),
  );

  return NextResponse.json({
    report: "top-products",
    data: enriched,
  });
}

/**
 * Top 10 customers by total amount spent.
 */
async function getTopCustomers() {
  const customers = await db.customer.findMany({
    orderBy: { totalSpent: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      group: true,
      loyaltyPoints: true,
      totalSpent: true,
      _count: {
        select: { sales: true, visits: true, prescriptions: true },
      },
    },
  });

  return NextResponse.json({
    report: "top-customers",
    data: customers,
  });
}

/**
 * Inventory turnover — products sorted by quantity sold, with current stock info.
 */
async function getInventoryTurnover() {
  const products = await db.saleItem.groupBy({
    by: ["productId"],
    _sum: { qty: true },
    orderBy: { _sum: { qty: "desc" } },
  });

  // Get all products and enrich
  const allProducts = await db.product.findMany({
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      brand: true,
      price: true,
      costPrice: true,
      stock: true,
      minStock: true,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });

  const salesMap = new Map(
    products.map((p) => [p.productId, p._sum.qty ?? 0]),
  );

  const data = allProducts.map((product) => ({
    productId: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    brand: product.brand,
    price: product.price,
    costPrice: product.costPrice,
    currentStock: product.stock,
    minStock: product.minStock,
    totalQtySold: salesMap.get(product.id) ?? 0,
    isActive: product.isActive,
    isLowStock: product.stock < product.minStock,
    turnoverRatio:
      product.stock > 0
        ? parseFloat(((salesMap.get(product.id) ?? 0) / product.stock).toFixed(2))
        : salesMap.get(product.id) > 0
          ? Infinity
          : 0,
  }));

  // Sort by qty sold descending
  data.sort((a, b) => b.totalQtySold - a.totalQtySold);

  return NextResponse.json({
    report: "inventory-turnover",
    totalProducts: allProducts.length,
    data,
  });
}

/**
 * Revenue comparison — this month vs last month (daily breakdown for chart).
 */
async function getRevenueComparison() {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [thisMonthSales, lastMonthSales] = await Promise.all([
    db.sale.findMany({
      where: { createdAt: { gte: thisMonthStart } },
      select: { createdAt: true, totalAmount: true, cgst: true, sgst: true, igst: true },
      orderBy: { createdAt: "asc" },
    }),
    db.sale.findMany({
      where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      select: { createdAt: true, totalAmount: true, cgst: true, sgst: true, igst: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Group this month by day of month
  const thisMonthMap = new Map<number, { day: number; revenue: number; orders: number; cgst: number; sgst: number; igst: number }>();
  const daysInThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= daysInThisMonth; d++) {
    thisMonthMap.set(d, { day: d, revenue: 0, orders: 0, cgst: 0, sgst: 0, igst: 0 });
  }
  for (const s of thisMonthSales) {
    const day = s.createdAt.getDate();
    const existing = thisMonthMap.get(day)!;
    existing.revenue += s.totalAmount;
    existing.orders += 1;
    existing.cgst += s.cgst || 0;
    existing.sgst += s.sgst || 0;
    existing.igst += s.igst || 0;
  }

  // Group last month by day of month
  const lastMonthMap = new Map<number, { day: number; revenue: number; orders: number; cgst: number; sgst: number; igst: number }>();
  const daysInLastMonth = lastMonthEnd.getDate();
  for (let d = 1; d <= daysInLastMonth; d++) {
    lastMonthMap.set(d, { day: d, revenue: 0, orders: 0, cgst: 0, sgst: 0, igst: 0 });
  }
  for (const s of lastMonthSales) {
    const day = s.createdAt.getDate();
    const existing = lastMonthMap.get(day)!;
    existing.revenue += s.totalAmount;
    existing.orders += 1;
    existing.cgst += s.cgst || 0;
    existing.sgst += s.sgst || 0;
    existing.igst += s.igst || 0;
  }

  const thisMonthData = Array.from(thisMonthMap.values());
  const lastMonthData = Array.from(lastMonthMap.values());

  const thisMonthTotal = thisMonthData.reduce((s, d) => s + d.revenue, 0);
  const lastMonthTotal = lastMonthData.reduce((s, d) => s + d.revenue, 0);
  const thisMonthOrders = thisMonthData.reduce((s, d) => s + d.orders, 0);
  const lastMonthOrders = lastMonthData.reduce((s, d) => s + d.orders, 0);
  const thisMonthCGST = thisMonthData.reduce((s, d) => s + d.cgst, 0);
  const thisMonthSGST = thisMonthData.reduce((s, d) => s + d.sgst, 0);
  const thisMonthIGST = thisMonthData.reduce((s, d) => s + d.igst, 0);
  const lastMonthCGST = lastMonthData.reduce((s, d) => s + d.cgst, 0);
  const lastMonthSGST = lastMonthData.reduce((s, d) => s + d.sgst, 0);
  const lastMonthIGST = lastMonthData.reduce((s, d) => s + d.igst, 0);

  const changePercent = lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : (thisMonthTotal > 0 ? 100 : 0);

  return NextResponse.json({
    report: "revenue-comparison",
    summary: {
      thisMonth: { total: thisMonthTotal, orders: thisMonthOrders, cgst: thisMonthCGST, sgst: thisMonthSGST, igst: thisMonthIGST },
      lastMonth: { total: lastMonthTotal, orders: lastMonthOrders, cgst: lastMonthCGST, sgst: lastMonthSGST, igst: lastMonthIGST },
      changePercent,
    },
    thisMonthData,
    lastMonthData,
  });
}

/**
 * Product performance — revenue by category, top/bottom performers.
 */
async function getProductPerformance() {
  const saleItems = await db.saleItem.findMany({
    select: { productId: true, qty: true, total: true },
  });

  const allProducts = await db.product.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      brand: true,
      price: true,
      costPrice: true,
      stock: true,
    },
  });

  const productMap = new Map(allProducts.map((p) => [p.id, p]));
  const salesByProduct = new Map<string, { qty: number; revenue: number }>();

  for (const item of saleItems) {
    const existing = salesByProduct.get(item.productId) || { qty: 0, revenue: 0 };
    existing.qty += item.qty || 0;
    existing.revenue += item.total || 0;
    salesByProduct.set(item.productId, existing);
  }

  // Category breakdown
  const categoryMap = new Map<string, { category: string; revenue: number; qty: number; products: number }>();
  for (const [productId, sales] of salesByProduct) {
    const product = productMap.get(productId);
    if (!product) continue;
    const cat = product.category || "Uncategorized";
    const existing = categoryMap.get(cat) || { category: cat, revenue: 0, qty: 0, products: 0 };
    existing.revenue += sales.revenue;
    existing.qty += sales.qty;
    existing.products += 1;
    categoryMap.set(cat, existing);
  }

  const categoryData = Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue);

  // Individual product performance
  const productData = Array.from(salesByProduct.entries())
    .map(([productId, sales]) => {
      const product = productMap.get(productId);
      return {
        productId,
        name: product?.name ?? "Unknown",
        category: product?.category ?? "",
        brand: product?.brand ?? "",
        price: product?.price ?? 0,
        costPrice: product?.costPrice ?? 0,
        currentStock: product?.stock ?? 0,
        totalQtySold: sales.qty,
        totalRevenue: sales.revenue,
        profitMargin: product?.costPrice && product?.costPrice > 0
          ? Math.round(((product.price - product.costPrice) / product.price) * 100)
          : 0,
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  return NextResponse.json({
    report: "product-performance",
    categoryData,
    productData,
    totalProducts: productData.length,
    totalRevenue: productData.reduce((s, p) => s + p.totalRevenue, 0),
  });
}

/**
 * Customer acquisition — new customers per day/week in a date range.
 */
async function getCustomerAcquisition() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const customers = await db.customer.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dailyMap = new Map<string, { date: string; newCustomers: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyMap.set(key, { date: key, newCustomers: 0 });
  }

  for (const c of customers) {
    const key = c.createdAt.toISOString().split("T")[0];
    const existing = dailyMap.get(key);
    if (existing) existing.newCustomers += 1;
  }

  const totalNew = customers.length;
  const thisWeekNew = customers.filter((c) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return c.createdAt >= weekAgo;
  }).length;

  return NextResponse.json({
    report: "customer-acquisition",
    period: "last-30-days",
    totalNew,
    thisWeekNew,
    data: Array.from(dailyMap.values()),
  });
}