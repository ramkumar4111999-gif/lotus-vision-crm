import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const allProducts = await db.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    const lowStockItems = allProducts.filter(
      (p: { stock: number; minStock: number }) => p.stock < p.minStock
    )

    // Group by category
    const byCategory: Record<string, number> = {}
    for (const item of lowStockItems) {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1
    }

    // Calculate total reorder value
    const totalReorderValue = lowStockItems.reduce(
      (sum: number, p: { costPrice: number | null; minStock: number; stock: number }) => {
        const needed = p.minStock - p.stock
        const unitCost = p.costPrice ?? 0
        return sum + (needed * unitCost)
      },
      0
    )

    return NextResponse.json({
      total: lowStockItems.length,
      byCategory,
      totalReorderValue,
      items: lowStockItems.map((p: { id: string; name: string; category: string; brand: string | null; stock: number; minStock: number; sku: string; costPrice: number | null; supplier: string | null; supplierPhone: string | null }) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        brand: p.brand,
        stock: p.stock,
        minStock: p.minStock,
        needed: p.minStock - p.stock,
        sku: p.sku,
        costPrice: p.costPrice,
        reorderCost: (p.minStock - p.stock) * (p.costPrice ?? 0),
        supplier: p.supplier,
        supplierPhone: p.supplierPhone,
      })),
    })
  } catch (error) {
    console.error('Low stock report error:', error)
    return NextResponse.json({ error: 'Failed to generate low-stock report' }, { status: 500 })
  }
}