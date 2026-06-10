import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/prescriptions — list with search, pagination & optional customerId filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const customerId = searchParams.get('customerId') || '';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { notes: { contains: search } },
        {
          customer: {
            OR: [
              { name: { contains: search } },
              { phone: { contains: search } },
            ],
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      db.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
      }),
      db.prescription.count({ where }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Failed to fetch prescriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}

// POST /api/prescriptions — create prescription
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      customerId,
      date,
      leftSPH,
      leftCYL,
      leftAXIS,
      leftPD,
      rightSPH,
      rightCYL,
      rightAXIS,
      rightPD,
      notes,
    } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      );
    }

    // Verify customer exists
    const customer = await db.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const prescription = await db.prescription.create({
      data: {
        customerId,
        date: date ? new Date(date) : new Date(),
        leftSPH: leftSPH ?? null,
        leftCYL: leftCYL ?? null,
        leftAXIS: leftAXIS ?? null,
        leftPD: leftPD ?? null,
        rightSPH: rightSPH ?? null,
        rightCYL: rightCYL ?? null,
        rightAXIS: rightAXIS ?? null,
        rightPD: rightPD ?? null,
        notes: notes || null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ data: prescription }, { status: 201 });
  } catch (error) {
    console.error('Failed to create prescription:', error);
    return NextResponse.json(
      { error: 'Failed to create prescription' },
      { status: 500 }
    );
  }
}
