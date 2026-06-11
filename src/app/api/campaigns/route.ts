import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/campaigns - List campaigns with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '25', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.campaign.count({ where }),
    ]);

    return NextResponse.json({
      data: campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, message, scheduledAt, budget, reach, targetGroup, status } = body;

    if (!name || !type || !message) {
      return NextResponse.json(
        { error: 'name, type, and message are required' },
        { status: 400 },
      );
    }

    // Validate type
    const allowedTypes = ['SMS', 'WhatsApp', 'Print', 'Online'];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${allowedTypes.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate status
    const allowedStatuses = ['Planned', 'Active', 'Completed', 'Cancelled'];
    const campaignStatus = status || (scheduledAt ? 'Planned' : 'Planned');

    const campaign = await db.campaign.create({
      data: {
        name,
        type,
        message,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        budget: budget !== undefined && budget !== null ? Number(budget) : 0,
        reach: reach !== undefined && reach !== null ? Number(reach) : 0,
        targetGroup: targetGroup || null,
        status: campaignStatus,
      },
    });

    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 },
    );
  }
}

// DELETE /api/campaigns?id=xxx - Delete a campaign (legacy, use [id] route)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Campaign id is required' }, { status: 400 });
    }

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
