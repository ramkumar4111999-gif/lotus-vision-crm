import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/staff/salary - List salary records (filter by staffId, month, status)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const staffId = searchParams.get('staffId');
    const month = searchParams.get('month'); // YYYY-MM
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (staffId) where.staffId = staffId;
    if (month) where.month = month;
    if (status) where.status = status;

    const records = await db.salaryRecord.findMany({
      where,
      include: {
        staff: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json({ data: records });
  } catch (error) {
    console.error('Error fetching salary records:', error);
    return NextResponse.json({ error: 'Failed to fetch salary records' }, { status: 500 });
  }
}

// POST /api/staff/salary - Create or update salary record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffId, month, basicSalary, commission, deductions, advance, netPay, notes } = body;

    if (!staffId || !month) {
      return NextResponse.json({ error: 'staffId and month are required' }, { status: 400 });
    }

    // Check for existing record for this staff+month
    const existing = await db.salaryRecord.findFirst({
      where: { staffId, month },
    });

    if (existing) {
      // Update existing
      const updated = await db.salaryRecord.update({
        where: { id: existing.id },
        data: {
          basicSalary: Number(basicSalary) || 0,
          commission: Number(commission) || 0,
          deductions: Number(deductions) || 0,
          advance: Number(advance) || 0,
          netPay: Number(netPay) || 0,
          notes: notes || null,
        },
      });
      return NextResponse.json({ data: updated });
    }

    const record = await db.salaryRecord.create({
      data: {
        staffId,
        month,
        basicSalary: Number(basicSalary) || 0,
        commission: Number(commission) || 0,
        deductions: Number(deductions) || 0,
        advance: Number(advance) || 0,
        netPay: Number(netPay) || 0,
        notes: notes || null,
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error('Error creating salary record:', error);
    return NextResponse.json({ error: 'Failed to create salary record' }, { status: 500 });
  }
}

// PATCH /api/staff/salary - Mark as paid
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updated = await db.salaryRecord.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(status === 'Paid' && { paidAt: new Date() }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating salary record:', error);
    return NextResponse.json({ error: 'Failed to update salary record' }, { status: 500 });
  }
}