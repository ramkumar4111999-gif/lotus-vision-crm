import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/products/import — bulk import products from CSV
export async function POST(req: NextRequest) {
  try {
    const { csv } = await req.json()

    if (!csv || typeof csv !== 'string') {
      return NextResponse.json({ error: 'CSV data is required' }, { status: 400 })
    }

    const lines = csv.trim().split('\n')
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 })
    }

    const header = lines[0].split(',').map((h: string) => h.trim().toLowerCase().replace(/"/g, ''))

    // Find column indices
    const nameIdx = header.findIndex((h: string) => h === 'name' || h === 'product_name')
    const categoryIdx = header.findIndex((h: string) => h === 'category')
    const brandIdx = header.findIndex((h: string) => h === 'brand')
    const modelIdx = header.findIndex((h: string) => h === 'model')
    const priceIdx = header.findIndex((h: string) => h === 'price' || h === 'selling_price')
    const costPriceIdx = header.findIndex((h: string) => h === 'cost_price' || h === 'costprice')
    const stockIdx = header.findIndex((h: string) => h === 'stock' || h === 'quantity')
    const minStockIdx = header.findIndex((h: string) => h === 'min_stock' || h === 'minstock')
    const skuIdx = header.findIndex((h: string) => h === 'sku')
    const supplierIdx = header.findIndex((h: string) => h === 'supplier')
    const colorIdx = header.findIndex((h: string) => h === 'color')
    const typeIdx = header.findIndex((h: string) => h === 'type' || h === 'lens_type')

    if (nameIdx === -1 || categoryIdx === -1 || priceIdx === -1) {
      return NextResponse.json(
        { error: 'CSV must have at least: name, category, price columns' },
        { status: 400 }
      )
    }

    let created = 0
    let skipped = 0
    let errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Simple CSV parsing (handles quoted fields)
      const values: string[] = []
      let current = ''
      let inQuotes = false
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())

      const name = values[nameIdx]
      const category = values[categoryIdx]
      const price = parseFloat(values[priceIdx])

      if (!name || !category || isNaN(price)) {
        errors.push(`Row ${i + 1}: Missing name, category, or invalid price`)
        skipped++
        continue
      }

      const sku = skuIdx >= 0 && values[skuIdx]
        ? values[skuIdx]
        : `SKO-${category.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${i}`

      // Check for duplicate SKU
      const existing = await db.product.findUnique({ where: { sku } })
      if (existing) {
        errors.push(`Row ${i + 1}: SKU "${sku}" already exists`)
        skipped++
        continue
      }

      try {
        await db.product.create({
          data: {
            name,
            category,
            brand: brandIdx >= 0 ? (values[brandIdx] || null) : null,
            model: modelIdx >= 0 ? (values[modelIdx] || null) : null,
            color: colorIdx >= 0 ? (values[colorIdx] || null) : null,
            price,
            costPrice: costPriceIdx >= 0 ? (parseFloat(values[costPriceIdx]) || null) : null,
            stock: stockIdx >= 0 ? (parseInt(values[stockIdx]) || 0) : 0,
            minStock: minStockIdx >= 0 ? (parseInt(values[minStockIdx]) || 5) : 5,
            sku,
            supplier: supplierIdx >= 0 ? (values[supplierIdx] || null) : null,
            type: typeIdx >= 0 ? (values[typeIdx] || null) : null,
            lastRestocked: new Date(),
          },
        })
        created++
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Failed to create'}`)
        skipped++
      }
    }

    return NextResponse.json({
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      total: lines.length - 1,
    })
  } catch (error) {
    console.error('POST /api/products/import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}