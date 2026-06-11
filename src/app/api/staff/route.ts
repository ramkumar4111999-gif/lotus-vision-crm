import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/staff - List staff members with search and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const role = searchParams.get('role') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { role: { contains: search } },
        { email: { contains: search } },
        { loginId: { contains: search } },
      ];
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (role) {
      where.role = role;
    }

    const [staff, total] = await Promise.all([
      db.staff.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.staff.count({ where }),
    ]);

    const headers = new Headers({ 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' });
    return NextResponse.json({
      data: staff,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { headers });
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff' },
      { status: 500 }
    );
  }
}

// POST /api/staff - Create a new staff member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, role, email, salary, commission, joinDate, loginId } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check for duplicate loginId if provided
    if (loginId) {
      const existingLogin = await db.staff.findUnique({
        where: { loginId: loginId.trim() },
      });

      if (existingLogin) {
        return NextResponse.json(
          { error: 'A staff member with this login ID already exists' },
          { status: 409 }
        );
      }
    }

    const staff = await db.staff.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        role: role ? role.trim() : 'Staff',
        email: email ? email.trim() : null,
        salary: salary !== undefined && salary !== null ? Number(salary) : 0,
        commission:
          commission !== undefined && commission !== null
            ? Number(commission)
            : 0,
        joinDate: joinDate ? new Date(joinDate) : new Date(),
        loginId: loginId ? loginId.trim() : null,
        isActive: true,
      },
    });

    return NextResponse.json({ data: staff }, { status: 201 });
  } catch (error) {
    console.error('Error creating staff member:', error);
    return NextResponse.json(
      { error: 'Failed to create staff member' },
      { status: 500 }
    );
  }
}
