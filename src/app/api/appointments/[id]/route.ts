import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/appointments/[id] - Get a single appointment
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const appointment = await db.appointment.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, date, time, purpose, customerId, notes } = body;

    // Validate allowed status values
    const allowedStatuses = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-Show'];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${allowedStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate allowed purposes
    const allowedPurposes = ['Eye Exam', 'Frame Selection', 'Lens Fitting', 'Delivery', 'Follow-up', 'Other'];
    if (purpose && !allowedPurposes.includes(purpose)) {
      return NextResponse.json(
        { error: `Purpose must be one of: ${allowedPurposes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify appointment exists
    const existing = await db.appointment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (date !== undefined) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time || null;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (customerId !== undefined) updateData.customerId = customerId;
    if (notes !== undefined) updateData.notes = notes;

    const appointment = await db.appointment.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });

    return NextResponse.json({ data: appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// PATCH /api/appointments/[id] - Patch appointment (for quick status updates)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const allowedStatuses = ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-Show'];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${allowedStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const existing = await db.appointment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;

    const appointment = await db.appointment.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });

    return NextResponse.json({ data: appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Delete an appointment
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify appointment exists
    const existing = await db.appointment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    await db.appointment.delete({ where: { id } });

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
