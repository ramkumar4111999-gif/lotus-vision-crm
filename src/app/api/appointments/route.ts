import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/appointments - List appointments with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { purpose: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) {
        (where.date as Record<string, unknown>).gte = new Date(fromDate);
      }
      if (toDate) {
        (where.date as Record<string, unknown>).lte = new Date(toDate);
      }
    }

    const [appointments, total] = await Promise.all([
      db.appointment.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      db.appointment.count({ where }),
    ]);

    return NextResponse.json({
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, date, purpose, notes } = body;

    // Validate required fields
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Appointment date is required' },
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

    const appointment = await db.appointment.create({
      data: {
        customerId,
        date: new Date(date),
        purpose: purpose || null,
        notes: notes || null,
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json({ data: appointment }, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}