import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/products — list with category filter, search, pagination, lowStock filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || searchParams.get('limit') || '10', 10);
    const category = searchParams.get('category') || '';
    const lowStock = searchParams.get('lowStock') === 'true';
    const sortField = searchParams.get('sort') || 'createdAt';
    const sortOrder = searchParams.get('order') || 'desc';

    const skip = (page - 1) * pageSize;

    let products;
    let total;

    if (lowStock) {
      // Use raw SQL for column comparison: stock < minStock
      const searchCond = search
        ? `AND (p.name LIKE '%${search.replace(/'/g, "''")}%' OR p.brand LIKE '%${search.replace(/'/g, "''")}%' OR p.model LIKE '%${search.replace(/'/g, "''")}%' OR p.sku LIKE '%${search.replace(/'/g, "''")}%' OR p.barcode LIKE '%${search.replace(/'/g, "''")}%')`
        : '';
      const categoryCond = category
        ? `AND p.category = '${category.replace(/'/g, "''")}'`
        : '';

      const countSql = `SELECT COUNT(*) as count FROM Product p WHERE p.stock < p.minStock ${searchCond} ${categoryCond}`;
      const dataSql = `SELECT p.* FROM Product p WHERE p.stock < p.minStock ${searchCond} ${categoryCond} ORDER BY p."createdAt" DESC LIMIT ${pageSize} OFFSET ${skip}`;

      const [countResult, dataResult] = await Promise.all([
        db.$queryRawUnsafe<Array<{ count: number }>>(countSql),
        db.$queryRawUnsafe<(typeof products)[]>(dataSql),
      ]);

      total = Number(countResult[0]?.count ?? 0);
      products = dataResult;
    } else {
      const where: Record<string, unknown> = {};

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { brand: { contains: search } },
          { model: { contains: search } },
          { sku: { contains: search } },
          { barcode: { contains: search } },
        ];
      }

      if (category) {
        where.category = category;
      }

      // Build orderBy
      const validSortFields = ['createdAt', 'name', 'price', 'stock', 'category', 'brand', 'sku'];
      const validOrders = ['asc', 'desc'];
      const safeSort = validSortFields.includes(sortField) ? sortField : 'createdAt';
      const safeOrder = validOrders.includes(sortOrder) ? sortOrder : 'desc';
      const orderBy: Record<string, string> = { [safeSort]: safeOrder };

      const [resultProducts, resultTotal] = await Promise.all([
        db.product.findMany({
          where,
          skip,
          take: pageSize,
          orderBy,
        }),
        db.product.count({ where }),
      ]);

      products = resultProducts;
      total = Number(resultTotal);
    }

    // Fetch low-stock items for the alert section
    const allProducts = await db.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    const lowStockItems = allProducts.filter((p: { stock: number; minStock: number }) => p.stock < p.minStock);

    const headers = new Headers({ 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' });
    return NextResponse.json({
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(Number(total) / pageSize),
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.slice(0, 20),
    }, { headers });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products — create product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      category,
      brand,
      model,
      color,
      size,
      frameWidth,
      bridge,
      temple,
      price,
      costPrice,
      stock,
      minStock,
      supplier,
      supplierPhone,
      lastRestocked,
      sku,
      barcode,
      type,
      duration,
      expiryDate,
      description,
      isActive,
    } = body;

    if (!name || !category || price === undefined || !sku) {
      return NextResponse.json(
        { error: 'name, category, price, and sku are required' },
        { status: 400 }
      );
    }

    const existingProduct = await db.product.findUnique({ where: { sku } });
    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this SKU already exists' },
        { status: 409 }
      );
    }

    const product = await db.product.create({
      data: {
        name,
        category,
        brand: brand || null,
        model: model || null,
        color: color || null,
        size: size || null,
        frameWidth: frameWidth ? parseInt(frameWidth) : null,
        bridge: bridge ? parseInt(bridge) : null,
        temple: temple ? parseInt(temple) : null,
        price: parseFloat(price),
        costPrice: costPrice ? parseFloat(costPrice) : null,
        stock: typeof stock === 'number' ? stock : 0,
        minStock: typeof minStock === 'number' ? minStock : 5,
        supplier: supplier || null,
        supplierPhone: supplierPhone || null,
        lastRestocked: lastRestocked ? new Date(lastRestocked) : null,
        sku,
        barcode: barcode || null,
        type: type || null,
        duration: duration || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}