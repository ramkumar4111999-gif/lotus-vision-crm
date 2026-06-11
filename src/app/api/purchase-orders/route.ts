import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/purchase-orders
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { supplier: { contains: search } },
        { poNumber: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return NextResponse.json({
      purchaseOrders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('GET /api/purchase-orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

// POST /api/purchase-orders
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supplier, supplierPhone, items, notes, expectedDate } = body;

    if (!supplier || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Supplier and items are required' }, { status: 400 });
    }

    // Generate PO number
    const count = await prisma.purchaseOrder.count();
    const poNumber = `PO-${String(count + 1).padStart(4, '0')}`;

    const totalAmount = items.reduce((sum: number, item: { qty: number; costPrice: number }) => sum + item.qty * item.costPrice, 0);

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplier,
        supplierPhone: supplierPhone || null,
        items: JSON.stringify(items),
        totalAmount,
        notes: notes || null,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
      },
    });

    // Create notification
    try {
      await prisma.notification.create({
        data: {
          title: 'New Purchase Order',
          message: `PO ${poNumber} created for ${supplier} — ₹${totalAmount.toLocaleString('en-IN')}`,
          type: 'info',
          link: 'inventory',
        },
      });
    } catch {}

    return NextResponse.json(purchaseOrder, { status: 201 });
  } catch (error) {
    console.error('POST /api/purchase-orders error:', error);
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 });
  }
}