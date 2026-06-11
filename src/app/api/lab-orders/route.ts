import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchType = searchParams.get('searchType')
    const query = searchParams.get('q')?.trim() || ''

    // ── Customer search endpoint (with latest prescription) ──
    if (searchType === 'customers') {
      if (!query) return NextResponse.json({ results: [] })

      const customers = await db.customer.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { phone: { contains: query } },
          ],
        },
        select: { id: true, name: true, phone: true },
        take: 15,
        orderBy: { name: 'asc' },
      })

      // Fetch latest prescription for each customer
      const customerIds = customers.map((c) => c.id)
      const prescriptions = customerIds.length > 0
        ? await db.prescription.findMany({
            where: { customerId: { in: customerIds } },
            orderBy: { date: 'desc' },
            distinct: ['customerId'],
          })
        : []

      const rxMap = new Map(prescriptions.map((p) => [p.customerId, p]))

      const results = customers.map((c) => {
        const rx = rxMap.get(c.id)
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          lastPrescription: rx ? {
            leftSPH: rx.leftSPH,
            leftCYL: rx.leftCYL,
            leftAXIS: rx.leftAXIS,
            rightSPH: rx.rightSPH,
            rightCYL: rx.rightCYL,
            rightAXIS: rx.rightAXIS,
            date: rx.date.toISOString(),
          } : null,
        }
      })

      return NextResponse.json({ results })
    }

    // ── Frame search endpoint ──
    if (searchType === 'frames') {
      if (!query) return NextResponse.json({ results: [] })

      const frames = await db.product.findMany({
        where: {
          category: 'Frames',
          isActive: true,
          OR: [
            { name: { contains: query } },
            { brand: { contains: query } },
          ],
        },
        select: { id: true, name: true, brand: true, price: true, frameWidth: true, bridge: true, temple: true },
        take: 15,
        orderBy: { name: 'asc' },
      })

      return NextResponse.json({ results: frames })
    }

    // ── List lab orders ──
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))

    const where: Record<string, unknown> = {}
    if (status && status !== 'all') {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      db.labOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.labOrder.count({ where }),
    ])

    // Batch-fetch customer names/phones
    const customerIds = orders.map((o) => o.customerId).filter(Boolean) as string[]
    let customerMap = new Map<string, { name: string; phone: string }>()
    if (customerIds.length > 0) {
      const customers = await db.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, phone: true },
      })
      customerMap = new Map(customers.map((c) => [c.id, { name: c.name, phone: c.phone }]))
    }

    const formatted = orders.map((o) => {
      const cust = o.customerId ? customerMap.get(o.customerId) : null
      return {
        id: o.id,
        customerId: o.customerId,
        customerName: cust?.name ?? null,
        customerPhone: cust?.phone ?? null,
        lensType: o.lensType,
        leftSPH: o.leftSPH,
        leftCYL: o.leftCYL,
        leftAXIS: o.leftAXIS,
        rightSPH: o.rightSPH,
        rightCYL: o.rightCYL,
        rightAXIS: o.rightAXIS,
        frameId: o.frameId,
        frameName: null as string | null,
        status: o.status,
        costPrice: o.costPrice,
        sellingPrice: o.sellingPrice,
        dueDate: o.dueDate?.toISOString() ?? null,
        notes: o.notes,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      }
    })

    // Fetch frame names in batch if any orders have frames
    const frameIds = orders.map((o) => o.frameId).filter(Boolean) as string[]
    if (frameIds.length > 0) {
      const frames = await db.product.findMany({
        where: { id: { in: frameIds } },
        select: { id: true, name: true },
      })
      const frameMap = new Map(frames.map((f) => [f.id, f.name]))
      for (const order of formatted) {
        if (order.frameId) {
          order.frameName = frameMap.get(order.frameId) ?? null
        }
      }
    }

    return NextResponse.json({
      orders: formatted,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      total,
    })
  } catch (error) {
    console.error('GET /api/lab-orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      customerId,
      lensType,
      leftSPH,
      leftCYL,
      leftAXIS,
      rightSPH,
      rightCYL,
      rightAXIS,
      frameId,
      costPrice,
      sellingPrice,
      dueDate,
      notes,
    } = body

    if (!customerId) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 })
    }
    if (!lensType) {
      return NextResponse.json({ error: 'Lens type is required' }, { status: 400 })
    }
    if (costPrice === undefined || costPrice < 0) {
      return NextResponse.json({ error: 'Valid cost price is required' }, { status: 400 })
    }
    if (sellingPrice === undefined || sellingPrice < 0) {
      return NextResponse.json({ error: 'Valid selling price is required' }, { status: 400 })
    }

    // Validate customer exists
    const customer = await db.customer.findUnique({ where: { id: customerId } })
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Validate frame if provided
    if (frameId) {
      const frame = await db.product.findUnique({ where: { id: frameId } })
      if (!frame) {
        return NextResponse.json({ error: 'Frame not found' }, { status: 404 })
      }
    }

    const order = await db.labOrder.create({
      data: {
        customerId,
        lensType,
        leftSPH: leftSPH ?? null,
        leftCYL: leftCYL ?? null,
        leftAXIS: leftAXIS ?? null,
        rightSPH: rightSPH ?? null,
        rightCYL: rightCYL ?? null,
        rightAXIS: rightAXIS ?? null,
        frameId: frameId || null,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        status: 'Pending',
      },
    })

    return NextResponse.json({
      id: order.id,
      customerId: order.customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      lensType: order.lensType,
      leftSPH: order.leftSPH,
      leftCYL: order.leftCYL,
      leftAXIS: order.leftAXIS,
      rightSPH: order.rightSPH,
      rightCYL: order.rightCYL,
      rightAXIS: order.rightAXIS,
      frameId: order.frameId,
      status: order.status,
      costPrice: order.costPrice,
      sellingPrice: order.sellingPrice,
      dueDate: order.dueDate?.toISOString() ?? null,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/lab-orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}