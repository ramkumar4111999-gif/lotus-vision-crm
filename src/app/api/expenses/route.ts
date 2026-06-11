import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/expenses - List expenses with filters, pagination, and optional grouping
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;
    const groupBy = searchParams.get('groupBy') || ''; // 'month' | 'year' | 'category'

    // If grouping is requested, return aggregated data instead
    if (groupBy === 'month' || groupBy === 'year' || groupBy === 'category') {
      const where: Record<string, unknown> = {};

      if (fromDate || toDate) {
        where.date = {};
        if (fromDate) {
          (where.date as Record<string, unknown>).gte = new Date(fromDate);
        }
        if (toDate) {
          (where.date as Record<string, unknown>).lte = new Date(toDate);
        }
      }

      if (category) {
        where.category = category;
      }

      const expenses = await db.expense.findMany({
        where,
        select: {
          id: true,
          category: true,
          description: true,
          amount: true,
          date: true,
          vendor: true,
        },
        orderBy: { date: 'desc' },
      });

      // Group expenses in-memory by the requested dimension
      const grouped: Record<string, { group: string; total: number; count: number; items: typeof expenses }> = {};

      for (const expense of expenses) {
        let key: string;
        if (groupBy === 'month') {
          const d = new Date(expense.date);
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        } else if (groupBy === 'year') {
          key = `${new Date(expense.date).getFullYear()}`;
        } else {
          key = expense.category;
        }

        if (!grouped[key]) {
          grouped[key] = { group: key, total: 0, count: 0, items: [] };
        }
        grouped[key].total += expense.amount;
        grouped[key].count += 1;
        grouped[key].items.push(expense);
      }

      // Sort groups by key descending
      const sortedGroups = Object.values(grouped).sort((a, b) =>
        b.group.localeCompare(a.group)
      );

      // Calculate overall totals
      const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

      return NextResponse.json({
        data: sortedGroups,
        meta: {
          groupBy,
          grandTotal,
          totalRecords: expenses.length,
        },
      });
    }

    // Standard paginated listing
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { category: { contains: search } },
        { vendor: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
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

    const [expenses, total, totalAmount] = await Promise.all([
      db.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      db.expense.count({ where }),
      db.expense.aggregate({
        where,
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalAmount: totalAmount._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create a new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, description, amount, date, vendor } = body;

    // Validate required fields
    if (!category || !category.trim()) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null || isNaN(amount) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: 'A valid positive amount is required' },
        { status: 400 }
      );
    }

    const expense = await db.expense.create({
      data: {
        category: category.trim(),
        description: description.trim(),
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        vendor: vendor ? vendor.trim() : null,
      },
    });

    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}

// PUT /api/expenses?id=xxx - Update an expense
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Expense ID is required (pass as ?id=xxx query param)' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { category, description, amount, date, vendor } = body;

    const existing = await db.expense.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (category) updateData.category = category.trim();
    if (description) updateData.description = description.trim();
    if (amount !== undefined && !isNaN(Number(amount)) && Number(amount) > 0) updateData.amount = Number(amount);
    if (date) updateData.date = new Date(date);
    if (vendor !== undefined) updateData.vendor = vendor ? vendor.trim() : null;

    const updated = await db.expense.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses?id=xxx - Delete an expense
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Expense ID is required (pass as ?id=xxx query param)' },
        { status: 400 }
      );
    }

    await db.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}