import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/purchase-orders/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(po);
  } catch (error) {
    console.error('GET /api/purchase-orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// PUT /api/purchase-orders/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes, items, receivedAt } = body;

    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (items) {
      updateData.items = JSON.stringify(items);
      const totalAmount = items.reduce((sum: number, item: { qty: number; costPrice: number }) => sum + item.qty * item.costPrice, 0);
      updateData.totalAmount = totalAmount;
    }
    if (status === 'Received' || status === 'PartiallyReceived') {
      updateData.receivedAt = receivedAt ? new Date(receivedAt) : new Date();
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
    });

    // When received, update product stock
    if (status === 'Received' && items) {
      for (const item of items) {
        try {
          await prisma.product.updateMany({
            where: { id: item.productId },
            data: { stock: { increment: item.qty }, lastRestocked: new Date() },
          });
        } catch {}
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/purchase-orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE /api/purchase-orders/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.status !== 'Pending' && existing.status !== 'Cancelled') {
      return NextResponse.json({ error: 'Can only delete pending or cancelled orders' }, { status: 400 });
    }
    await prisma.purchaseOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/purchase-orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}