import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/customers — list with search & pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const group = searchParams.get('group') || '';
    const filter = searchParams.get('filter') || '';
    const sortParam = searchParams.get('sort') || '';
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';

    // Birthday this week filter: return raw array
    if (filter === 'birthday_this_week') {
      const today = new Date();
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

      const customers = await db.customer.findMany({
        where: {
          dob: {
            not: null,
          },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          dob: true,
        },
      });

      // Filter birthdays falling this week by month/day comparison
      const birthdayThisWeek = customers.filter((c) => {
        if (!c.dob) return false;
        const dob = new Date(c.dob);
        const month = dob.getMonth();
        const day = dob.getDate();

        // Check each day this week
        for (let d = new Date(today); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
          if (d.getMonth() === month && d.getDate() === day) {
            return true;
          }
        }
        return false;
      });

      return NextResponse.json(birthdayThisWeek);
    }

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (group) {
      where.group = group;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(fromDate);
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, unknown>).lte = endDate;
      }
    }

    // Parse sort parameter (format: "field:direction")
    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (sortParam) {
      const [sortField, sortDir] = sortParam.split(':');
      const validFields = ['name', 'phone', 'group', 'loyaltyPoints', 'totalSpent', 'createdAt'];
      if (validFields.includes(sortField)) {
        orderBy = { [sortField]: sortDir === 'desc' ? 'desc' : 'asc' };
      }
    }

    const [data, total] = await Promise.all([
      db.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              prescriptions: true,
              visits: true,
              sales: true,
            },
          },
        },
      }),
      db.customer.count({ where }),
    ]);

    const headers = new Headers({ 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' });
    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }, { headers });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers — create customer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name, phone, email, dob, address, aadhar, group } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const customer = await db.customer.create({
      data: {
        name,
        phone,
        email: email || null,
        dob: dob ? new Date(dob) : null,
        address: address || null,
        aadhar: aadhar || null,
        group: group || 'New',
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

    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (error) {
    console.error('Failed to create customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
