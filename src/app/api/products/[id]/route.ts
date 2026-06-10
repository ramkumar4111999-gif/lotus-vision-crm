import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET single product by ID
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({
      where: { id },
      include: {
        saleItems: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT update a product by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const product = await db.product.update({
      where: { id },
      data: {
        name: body.name,
        category: body.category,
        brand: body.brand ?? null,
        model: body.model ?? null,
        color: body.color ?? null,
        size: body.size ?? null,
        price: body.price,
        costPrice: body.costPrice ?? null,
        stock: body.stock,
        minStock: body.minStock,
        sku: body.sku,
        barcode: body.barcode ?? null,
        type: body.type ?? null,
        duration: body.duration ?? null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        isActive: body.isActive,
      },
    })

    return NextResponse.json(product)
  } catch (error: unknown) {
    console.error('Error updating product:', error)

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE a product by ID
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.product.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error: unknown) {
    console.error('Error deleting product:', error)

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2003'
    ) {
      return NextResponse.json(
        { error: 'Cannot delete product: it is referenced by sale items' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}