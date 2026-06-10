import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET list of sales with filtering, pagination, date range, and search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const status = searchParams.get('status') || ''
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { notes: { contains: search } },
      ]
    }

    if (fromDate || toDate) {
      where.createdAt = {}
      if (fromDate) {
        ;(where.createdAt as Record<string, unknown>).gte = new Date(fromDate)
      }
      if (toDate) {
        const endDate = new Date(toDate)
        endDate.setHours(23, 59, 59, 999)
        ;(where.createdAt as Record<string, unknown>).lte = endDate
      }
    }

    const [sales, total] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.sale.count({ where }),
    ])

    const mapped = sales.map((s) => ({
      id: s.id,
      invoiceNo: s.invoiceNo,
      customerName: s.customer?.name || 'Walk-in',
      itemsCount: s.items.length,
      subtotal: s.subtotal,
      discount: s.discount,
      cgst: s.cgst,
      sgst: s.sgst,
      total: s.totalAmount,
      paymentMode: s.paymentMode,
      status: s.status,
      createdAt: s.createdAt.toISOString().split('T')[0],
    }))

    return NextResponse.json({
      sales: mapped,
      total,
      page,
      pageSize: limit,
    })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}

// POST create a new sale with sale items in a transaction
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      invoiceNo: bodyInvoiceNo,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerId,
      items,
      subtotal: bodySubtotal,
      discount = 0,
      discountType = 'flat',
      cgst: bodyCgst,
      sgst: bodySgst,
      total: bodyTotal,
      paymentMode = 'Cash',
      status: bodyStatus = 'Completed',
      notes,
      staffId,
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one sale item is required' },
        { status: 400 }
      )
    }

    for (const item of items) {
      if (!item.productId || !item.qty || !item.price) {
        return NextResponse.json(
          { error: 'Each item must have productId, qty, and price' },
          { status: 400 }
        )
      }
    }

    const subtotal = bodySubtotal ?? items.reduce(
      (sum: number, item: { qty: number; price: number }) =>
        sum + item.qty * item.price,
      0
    )

    const discountAmount =
      discountType === 'percentage'
        ? Math.round((subtotal * discount) / 100)
        : discount

    const taxable = Math.max(0, subtotal - discountAmount)
    const CGST_RATE = 0.09
    const SGST_RATE = 0.09
    const cgst = bodyCgst ?? Math.round(taxable * CGST_RATE * 100) / 100
    const sgst = bodySgst ?? Math.round(taxable * SGST_RATE * 100) / 100
    const totalAmount = bodyTotal ?? Math.round((taxable + cgst + sgst) * 100) / 100

    const invoiceNo =
      bodyInvoiceNo || `INV-${Date.now()}`

    const sale = await db.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          invoiceNo,
          customerId: customerId || null,
          subtotal,
          discount: discountAmount,
          cgst,
          sgst,
          totalAmount,
          paymentMode,
          status: bodyStatus,
          notes: notes || null,
          staffId: staffId || null,
          items: {
            create: items.map(
              (item: { productId: string; qty: number; price: number; total?: number }) => ({
                productId: item.productId,
                qty: item.qty,
                price: item.price,
                total: item.total ?? item.qty * item.price,
              })
            ),
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      })

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.qty,
            },
          },
        })
      }

      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            totalSpent: {
              increment: totalAmount,
            },
          },
        })
      }

      return newSale
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    console.error('Error creating sale:', error)

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2003'
    ) {
      return NextResponse.json(
        { error: 'Referenced product or customer not found' },
        { status: 400 }
      )
    }

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Invoice number already exists. Please retry.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    )
  }
}