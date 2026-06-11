import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

// GET /api/dues - List dues with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { notes: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [dues, total, aggResult] = await Promise.all([
      db.due.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.due.count({ where }),
      db.due.aggregate({
        where,
        _sum: { amount: true, paid: true },
      }),
    ]);

    return NextResponse.json({
      data: dues,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalDue: aggResult._sum?.amount || 0,
        totalPaid: aggResult._sum?.paid || 0,
        totalOutstanding:
          (aggResult._sum?.amount || 0) - (aggResult._sum?.paid || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching dues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dues' },
      { status: 500 }
    );
  }
}

// POST /api/dues - Create a new due
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, amount, dueDate, notes } = body;

    // Validate required fields
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null || isNaN(amount) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'A valid positive amount is required' },
        { status: 400 }
      );
    }

    // Verify customer exists
    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const due = await db.due.create({
      data: {
        customerId,
        amount: Number(amount),
        paid: 0,
        status: 'Pending',
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    // Fire notification (fire-and-forget)
    createNotification({
      title: `New due ₹${Number(amount).toLocaleString('en-IN')}`,
      message: `For ${customer.name}`,
      type: 'warning',
      link: 'accounting',
    });

    return NextResponse.json({ data: due }, { status: 201 });
  } catch (error) {
    console.error('Error creating due:', error);
    return NextResponse.json(
      { error: 'Failed to create due' },
      { status: 500 }
    );
  }
}

// PUT /api/dues - Mark a due as paid (accepts { id, paidAmount } or { id, status })
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, paidAmount, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Due ID is required' },
        { status: 400 }
      );
    }

    // Verify the due exists
    const existing = await db.due.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Due record not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // Handle partial payment or full payment via paidAmount
    if (paidAmount !== undefined && paidAmount !== null) {
      const payment = Number(paidAmount);
      if (isNaN(payment) || payment <= 0) {
        return NextResponse.json(
          { error: 'Paid amount must be a positive number' },
          { status: 400 }
        );
      }

      const newPaid = existing.paid + payment;

      if (newPaid >= existing.amount) {
        // Fully paid
        updateData.paid = existing.amount;
        updateData.status = 'Paid';
      } else {
        // Partially paid
        updateData.paid = newPaid;
        updateData.status = 'Partial';
      }
    }

    // Handle direct status update
    if (status !== undefined) {
      const allowedStatuses = ['Pending', 'Partial', 'Paid', 'Overdue'];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Status must be one of: ${allowedStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = status;

      // If marking as paid, set paid = amount
      if (status === 'Paid') {
        updateData.paid = existing.amount;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update. Provide paidAmount or status.' },
        { status: 400 }
      );
    }

    const due = await db.due.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json({ data: due });
  } catch (error) {
    console.error('Error updating due:', error);
    return NextResponse.json(
      { error: 'Failed to update due' },
      { status: 500 }
    );
  }
}