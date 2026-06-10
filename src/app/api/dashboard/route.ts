import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();

    // Start of today (00:00:00 local time)
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // Start of this month (1st of the month, 00:00:00)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all aggregations in parallel
    const [
      totalCustomers,
      todaySalesResult,
      monthlyRevenueResult,
      lowStockCount,
      pendingDuesResult,
      totalProducts,
      todayAppointments,
      pendingLabOrders,
    ] = await Promise.all([
      // Total customers
      db.customer.count(),

      // Today's sales sum
      db.sale.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: todayStart } },
      }),

      // This month's revenue
      db.sale.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: monthStart } },
      }),

      // Low stock products (stock < minStock)
      db.product.count({
        where: {
          isActive: true,
          stock: { lt: db.product.fields.minStock },
        },
      }),

      // Pending dues (unpaid amount = amount - paid)
      db.due.aggregate({
        _sum: { amount: true, paid: true },
        where: { status: "Pending" },
      }),

      // Total products
      db.product.count(),

      // Today's appointments
      db.appointment.count({
        where: { date: { gte: todayStart } },
      }),

      // Pending lab orders (status != 'Delivered')
      db.labOrder.count({
        where: { status: { not: "Delivered" } },
      }),
    ]);

    // Calculate pending dues: sum of (amount - paid) for pending dues
    const pendingDues =
      (pendingDuesResult._sum.amount ?? 0) -
      (pendingDuesResult._sum.paid ?? 0);

    return NextResponse.json({
      totalCustomers,
      todaySales: todaySalesResult._sum.totalAmount ?? 0,
      monthlyRevenue: monthlyRevenueResult._sum.totalAmount ?? 0,
      lowStockProducts: lowStockCount,
      pendingDues,
      totalProducts,
      todayAppointments,
      pendingLabOrders,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}