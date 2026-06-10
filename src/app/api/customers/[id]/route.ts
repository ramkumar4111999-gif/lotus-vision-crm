import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/customers/[id] — single customer with relations
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        prescriptions: {
          orderBy: { date: 'desc' },
        },
        visits: {
          orderBy: { date: 'desc' },
        },
        sales: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    category: true,
                  },
                },
              },
            },
          },
        },
        dues: {
          orderBy: { createdAt: 'desc' },
        },
        appointments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: customer });
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] — update customer
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const { name, phone, email, dob, address, aadhar, group, loyaltyPoints, totalSpent } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // Verify customer exists
    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = await db.customer.update({
      where: { id },
      data: {
        name,
        phone,
        email: email ?? undefined,
        dob: dob ? new Date(dob) : undefined,
        address: address ?? undefined,
        aadhar: aadhar ?? undefined,
        group: group ?? undefined,
        loyaltyPoints: loyaltyPoints ?? undefined,
        totalSpent: totalSpent ?? undefined,
      },
      include: {
        _count: {
          select: {
            prescriptions: true,
            visits: true,
            sales: true,
          },
        },
      },
    });

    return NextResponse.json({ data: customer });
  } catch (error) {
    console.error('Failed to update customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] — delete customer
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    await db.customer.delete({ where: { id } });

    return NextResponse.json({ data: { id }, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Failed to delete customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
