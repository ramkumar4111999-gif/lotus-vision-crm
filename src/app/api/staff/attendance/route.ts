import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/staff/attendance - List today's attendance (or by date range)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date'); // YYYY-MM-DD
    const staffId = searchParams.get('staffId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let startDate: Date;
    let endDate: Date;

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else if (date) {
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default: today
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    const where: Record<string, unknown> = {
      date: { gte: startDate, lte: endDate },
    };

    if (staffId) {
      where.staffId = staffId;
    }

    const records = await db.attendance.findMany({
      where,
      include: {
        staff: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { clockIn: 'desc' },
    });

    const data = records.map((r) => ({
      id: r.id,
      staffId: r.staffId,
      staffName: r.staff.name,
      staffRole: r.staff.role,
      clockIn: r.clockIn.toISOString(),
      clockOut: r.clockOut ? r.clockOut.toISOString() : null,
      date: r.date.toISOString(),
      notes: r.notes,
      hoursWorked: r.clockOut
        ? Math.round(((r.clockOut.getTime() - r.clockIn.getTime()) / (1000 * 60 * 60)) * 100) / 100
        : Math.round(((Date.now() - r.clockIn.getTime()) / (1000 * 60 * 60)) * 100) / 100,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

// POST /api/staff/attendance - Clock in
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffId, action, notes } = body; // action: 'clock-in' | 'clock-out'

    if (!staffId) {
      return NextResponse.json({ error: 'staffId is required' }, { status: 400 });
    }

    const staff = await db.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    if (action === 'clock-in') {
      // Check if already clocked in today
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const existing = await db.attendance.findFirst({
        where: {
          staffId,
          date: { gte: startOfDay },
          clockOut: null,
        },
      });

      if (existing) {
        return NextResponse.json({ error: 'Already clocked in', data: existing }, { status: 409 });
      }

      const record = await db.attendance.create({
        data: {
          staffId,
          notes: notes || null,
        },
      });

      return NextResponse.json({ data: record }, { status: 201 });
    }

    if (action === 'clock-out') {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const active = await db.attendance.findFirst({
        where: {
          staffId,
          date: { gte: startOfDay },
          clockOut: null,
        },
      });

      if (!active) {
        return NextResponse.json({ error: 'No active clock-in found' }, { status: 404 });
      }

      const updated = await db.attendance.update({
        where: { id: active.id },
        data: { clockOut: new Date() },
      });

      return NextResponse.json({ data: updated });
    }

    return NextResponse.json({ error: 'Invalid action. Use clock-in or clock-out' }, { status: 400 });
  } catch (error) {
    console.error('Error recording attendance:', error);
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
  }
}