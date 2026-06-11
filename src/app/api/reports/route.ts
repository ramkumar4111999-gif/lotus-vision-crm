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
      default:
        return NextResponse.json(
          { error: "Invalid report type. Use: sales-trend, top-products, top-customers, inventory-turnover" },
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
    // Turnover ratio = qty sold / avg stock (using current stock as proxy)
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