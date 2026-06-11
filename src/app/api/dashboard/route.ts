import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { format, startOfDay } from "date-fns";

export async function GET() {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // ── Run all aggregation queries in parallel ────────────────────────
    const [
      totalCustomers,
      todaySalesResult,
      monthlyRevenueResult,
      lowStockCount,
      pendingDuesResult,
      pendingLabOrders,
      recentSales,
      todayAppointments,
      lowStockProducts,
      overdueAppointments,
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

      // Pending dues (amount - paid where status is Pending or Partial or Overdue)
      db.due.aggregate({
        _sum: { amount: true, paid: true },
        where: { status: { in: ["Pending", "Partial", "Overdue"] } },
      }),

      // Pending lab orders (status != 'Delivered')
      db.labOrder.count({
        where: { status: { not: "Delivered" } },
      }),

      // Recent 5 completed sales with customer name
      db.sale.findMany({
        where: { status: "Completed" },
        include: {
          customer: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Today's appointments with customer name (only today, not future)
      db.appointment.findMany({
        where: {
          date: { gte: todayStart, lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) },
        },
        include: {
          customer: { select: { name: true } },
        },
        orderBy: { date: "asc" },
      }),

      // Low stock products list
      db.product.findMany({
        where: {
          isActive: true,
          stock: { lt: db.product.fields.minStock },
        },
        select: {
          name: true,
          stock: true,
          minStock: true,
        },
        orderBy: { stock: "asc" },
      }),

      // Overdue appointments (before today, still Scheduled or Pending)
      db.appointment.count({
        where: {
          date: { lt: todayStart },
          status: { in: ["Scheduled", "Pending"] },
        },
      }),
    ]);

    // ── Calculate pending dues ─────────────────────────────────────────
    const pendingDues =
      (pendingDuesResult._sum.amount ?? 0) -
      (pendingDuesResult._sum.paid ?? 0);

    // ── Build stats object ─────────────────────────────────────────────
    const stats = {
      totalCustomers,
      todaySales: todaySalesResult._sum.totalAmount ?? 0,
      monthlyRevenue: monthlyRevenueResult._sum.totalAmount ?? 0,
      lowStockAlerts: lowStockCount,
      pendingLabOrders,
      pendingDues,
      overdueAppointments,
    };

    // ── Build recent sales array ───────────────────────────────────────
    const recentSalesFormatted = recentSales.map((sale) => ({
      invoiceNo: sale.invoiceNo,
      customerName: sale.customer?.name ?? "Walk-in",
      amount: sale.totalAmount,
      date: sale.createdAt.toISOString(),
      paymentMode: sale.paymentMode,
    }));

    // ── Build appointments array ────────────────────────────────────────
    const appointmentsFormatted = todayAppointments.map((appt) => ({
      time: format(appt.date, "hh:mm a"),
      customerName: appt.customer?.name ?? "Unknown",
      purpose: appt.purpose ?? "General Visit",
      status: mapAppointmentStatus(appt.status),
    }));

    // ── Build low stock array ──────────────────────────────────────────
    const lowStockFormatted = lowStockProducts.map((p) => ({
      name: p.name,
      stock: p.stock,
      minStock: p.minStock,
    }));

    const headers = new Headers({ 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' });
    return NextResponse.json({
      stats,
      recentSales: recentSalesFormatted,
      appointments: appointmentsFormatted,
      lowStock: lowStockFormatted,
    }, { headers });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}

/** Map seed/status values to the status enum the dashboard expects */
function mapAppointmentStatus(
  status: string,
): "confirmed" | "pending" | "cancelled" | "completed" {
  switch (status) {
    case "Completed":
      return "completed";
    case "Scheduled":
    case "Confirmed":
      return "confirmed";
    case "Cancelled":
      return "cancelled";
    case "Pending":
    case "Rescheduled":
    default:
      return "pending";
  }
}
