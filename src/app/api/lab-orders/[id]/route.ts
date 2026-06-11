import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VALID_STATUSES = ['Received', 'Pending', 'In Lab', 'Ready', 'Delivered']

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const existing = await db.labOrder.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Lab order not found' }, { status: 404 })
    }

    const order = await db.labOrder.update({
      where: { id },
      data: { status },
    })

    // Fetch customer info separately since there's no relation
    let customerName: string | null = null
    let customerPhone: string | null = null
    if (order.customerId) {
      const customer = await db.customer.findUnique({
        where: { id: order.customerId },
        select: { name: true, phone: true },
      })
      if (customer) {
        customerName = customer.name
        customerPhone = customer.phone
      }
    }

    // Fetch frame name
    let frameName: string | null = null
    if (order.frameId) {
      const frame = await db.product.findUnique({
        where: { id: order.frameId },
        select: { name: true },
      })
      if (frame) frameName = frame.name
    }

    return NextResponse.json({
      id: order.id,
      customerId: order.customerId,
      customerName,
      customerPhone,
      lensType: order.lensType,
      leftSPH: order.leftSPH,
      leftCYL: order.leftCYL,
      leftAXIS: order.leftAXIS,
      rightSPH: order.rightSPH,
      rightCYL: order.rightCYL,
      rightAXIS: order.rightAXIS,
      frameId: order.frameId,
      frameName,
      status: order.status,
      costPrice: order.costPrice,
      sellingPrice: order.sellingPrice,
      dueDate: order.dueDate?.toISOString() ?? null,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('PUT /api/lab-orders/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}