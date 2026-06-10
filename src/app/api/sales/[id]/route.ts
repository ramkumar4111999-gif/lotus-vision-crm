import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET single sale by ID with items and product details
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const sale = await db.sale.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                brand: true,
                category: true,
              },
            },
          },
        },
        returns: true,
      },
    })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    return NextResponse.json(sale)
  } catch (error) {
    console.error('Error fetching sale:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sale' },
      { status: 500 }
    )
  }
}

// PATCH update a sale (e.g., toggle status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!status || !['Completed', 'Pending', 'Return'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (Completed, Pending, Return)' },
        { status: 400 }
      )
    }

    const sale = await db.sale.findUnique({ where: { id } })
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    const updated = await db.sale.update({
      where: { id },
      data: { status },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating sale:', error)
    return NextResponse.json(
      { error: 'Failed to update sale' },
      { status: 500 }
    )
  }
}