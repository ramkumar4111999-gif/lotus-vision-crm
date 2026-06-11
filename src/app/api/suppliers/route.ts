import { NextRequest, NextResponse } from 'next/server';

// GET /api/suppliers — list suppliers (no Supplier model in schema yet)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') || '';

    // No Supplier model exists in the Prisma schema yet.
    // Returning empty array so the UI does not crash.
    // TODO: Add a Supplier model to schema.prisma and replace this with Prisma queries.

    return NextResponse.json({
      suppliers: [],
      total: 0,
      page: 1,
      limit,
      totalPages: 0,
    });
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}