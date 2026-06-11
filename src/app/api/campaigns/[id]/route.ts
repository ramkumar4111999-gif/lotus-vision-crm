import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/campaigns/[id] - Get a single campaign
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id } = await params;

    const campaign = await db.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ data: campaign });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 },
    );
  }
}

// PUT /api/campaigns/[id] - Update a campaign
export async function PUT(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, message, scheduledAt, budget, reach, targetGroup, status } = body;

    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const allowedStatuses = ['Planned', 'Active', 'Completed', 'Cancelled'];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${allowedStatuses.join(', ')}` },
        { status: 400 },
      );
    }

    const allowedTypes = ['SMS', 'WhatsApp', 'Print', 'Online'];
    if (type && !allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${allowedTypes.join(', ')}` },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (message !== undefined) updateData.message = message;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (budget !== undefined) updateData.budget = Number(budget);
    if (reach !== undefined) updateData.reach = Number(reach);
    if (targetGroup !== undefined) updateData.targetGroup = targetGroup || null;
    if (status !== undefined) updateData.status = status;

    const campaign = await db.campaign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: campaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 },
    );
  }
}

// DELETE /api/campaigns/[id] - Delete a campaign
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { id } = await params;

    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    await db.campaign.delete({ where: { id } });
    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 },
    );
  }
}
