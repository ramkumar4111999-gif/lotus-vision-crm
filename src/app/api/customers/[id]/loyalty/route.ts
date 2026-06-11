import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/customers/[id]/loyalty — Earn or redeem loyalty points
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { points, reason, type } = body as {
      points: number;
      reason?: string;
      type: 'earn' | 'redeem';
    };

    if (!points || points === 0) {
      return NextResponse.json(
        { error: 'Points value must be non-zero' },
        { status: 400 }
      );
    }

    if (!['earn', 'redeem'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "earn" or "redeem"' },
        { status: 400 }
      );
    }

    // Fetch customer
    const customer = await db.customer.findUnique({ where: { id } });
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // For redeem: ensure enough points
    if (type === 'redeem' && customer.loyaltyPoints + points < 0) {
      return NextResponse.json(
        { error: `Insufficient points. Customer has ${customer.loyaltyPoints} points.` },
        { status: 400 }
      );
    }

    // Update loyalty points
    const updatedCustomer = await db.customer.update({
      where: { id },
      data: {
        loyaltyPoints: {
          increment: type === 'earn' ? Math.abs(points) : -Math.abs(points),
        },
      },
    });

    // If redeeming points (negative adjustment), optionally create a Due
    if (type === 'redeem') {
      const discountAmount = Math.abs(points) * 0.5; // 100 points = ₹50
      if (discountAmount > 0) {
        await db.due.create({
          data: {
            customerId: id,
            amount: discountAmount,
            status: 'Pending',
            notes: `Loyalty points redemption: ${Math.abs(points)} points redeemed. ${reason || ''}`.trim(),
          },
        });
      }
    }

    return NextResponse.json({
      loyaltyPoints: updatedCustomer.loyaltyPoints,
      message:
        type === 'earn'
          ? `Earned ${Math.abs(points)} loyalty points`
          : `Redeemed ${Math.abs(points)} loyalty points (₹${(Math.abs(points) * 0.5).toFixed(0)} discount)`,
    });
  } catch (error) {
    console.error('Error updating loyalty points:', error);
    return NextResponse.json(
      { error: 'Failed to update loyalty points' },
      { status: 500 }
    );
  }
}