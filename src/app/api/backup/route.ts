import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [
      customers,
      products,
      sales,
      returns,
      labOrders,
      prescriptions,
      visits,
      appointments,
      expenses,
      dues,
      staff,
      campaigns,
    ] = await Promise.all([
      db.customer.findMany(),
      db.product.findMany(),
      db.sale.findMany({ include: { items: true } }),
      db.return.findMany(),
      db.labOrder.findMany(),
      db.prescription.findMany(),
      db.visit.findMany(),
      db.appointment.findMany(),
      db.expense.findMany(),
      db.due.findMany(),
      db.staff.findMany(),
      db.campaign.findMany(),
    ])

    const data = {
      customers: customers.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        dob: c.dob?.toISOString() ?? null,
      })),
      products: products.map((p) => ({
        ...p,
        lastRestocked: p.lastRestocked?.toISOString() ?? null,
        expiryDate: p.expiryDate?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      sales: sales.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        items: s.items.map((item) => ({ ...item })),
      })),
      returns: returns.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      labOrders: labOrders.map((lo) => ({
        ...lo,
        dueDate: lo.dueDate?.toISOString() ?? null,
        createdAt: lo.createdAt.toISOString(),
        updatedAt: lo.updatedAt.toISOString(),
      })),
      prescriptions: prescriptions.map((p) => ({
        ...p,
        date: p.date.toISOString(),
        createdAt: p.createdAt.toISOString(),
      })),
      visits: visits.map((v) => ({
        ...v,
        date: v.date.toISOString(),
        createdAt: v.createdAt.toISOString(),
      })),
      appointments: appointments.map((a) => ({
        ...a,
        date: a.date.toISOString(),
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
      expenses: expenses.map((e) => ({
        ...e,
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
      })),
      dues: dues.map((d) => ({
        ...d,
        dueDate: d.dueDate?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      staff: staff.map((s) => ({
        ...s,
        joinDate: s.joinDate?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      campaigns: campaigns.map((c) => ({
        ...c,
        scheduledAt: c.scheduledAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    }

    return NextResponse.json({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data,
    })
  } catch (error) {
    console.error('Backup failed:', error)
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    )
  }
}