import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateSKU(category: string): string {
  const catPrefix = category.substring(0, 3).toUpperCase()
  const suffix = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase()
  return `SKO-${catPrefix}-${suffix}`
}

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

    // Parse header
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase().replace(/['"]/g, ''))

    // Required column indices
    const nameIdx = headers.findIndex((h: string) => h === 'name' || h === 'product')
    const categoryIdx = headers.findIndex((h: string) => h === 'category' || h === 'cat')
    const priceIdx = headers.findIndex((h: string) => h === 'price' || h === 'selling_price')
    const stockIdx = headers.findIndex((h: string) => h === 'stock' || h === 'qty' || h === 'quantity')

    if (nameIdx === -1 || categoryIdx === -1 || priceIdx === -1) {
      return NextResponse.json(
        { error: 'CSV must have at least name, category, and price columns' },
        { status: 400 }
      )
    }

    // Optional column indices
    const brandIdx = headers.findIndex((h: string) => h === 'brand')
    const modelIdx = headers.findIndex((h: string) => h === 'model')
    const colorIdx = headers.findIndex((h: string) => h === 'color')
    const sizeIdx = headers.findIndex((h: string) => h === 'size')
    const costPriceIdx = headers.findIndex((h: string) => h === 'cost_price' || h === 'costprice' || h === 'cost')
    const minStockIdx = headers.findIndex((h: string) => h === 'min_stock' || h === 'minstock')
    const skuIdx = headers.findIndex((h: string) => h === 'sku')
    const supplierIdx = headers.findIndex((h: string) => h === 'supplier')
    const supplierPhoneIdx = headers.findIndex((h: string) => h === 'supplier_phone' || h === 'supplierphone')
    const typeIdx = headers.findIndex((h: string) => h === 'type')
    const durationIdx = headers.findIndex((h: string) => h === 'duration')

    const results = { created: 0, skipped: 0, errors: [] as string[] }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const cols = parseCSVLine(line)
      if (cols.length <= Math.max(nameIdx, categoryIdx, priceIdx)) {
        results.errors.push(`Row ${i + 1}: Not enough columns`)
        results.skipped++
        continue
      }

      const name = (cols[nameIdx] || '').trim().replace(/['"]/g, '')
      const category = (cols[categoryIdx] || '').trim().replace(/['"]/g, '')
      const price = parseFloat((cols[priceIdx] || '0').replace(/['"]/g, ''))

      if (!name || !category || isNaN(price)) {
        results.errors.push(`Row ${i + 1}: Missing name, category, or invalid price`)
        results.skipped++
        continue
      }

      const sku = skuIdx >= 0 && cols[skuIdx]?.trim()
        ? cols[skuIdx].trim().replace(/['"]/g, '')
        : generateSKU(category)

      // Check for duplicate SKU
      const existing = await db.product.findUnique({ where: { sku } })
      if (existing) {
        results.errors.push(`Row ${i + 1}: SKU "${sku}" already exists`)
        results.skipped++
        continue
      }

      const stock = stockIdx >= 0 ? parseInt((cols[stockIdx] || '0').replace(/['"]/g, '')) || 0 : 0

      try {
        await db.product.create({
          data: {
            name,
            category,
            brand: brandIdx >= 0 ? (cols[brandIdx] || '').trim().replace(/['"]/g, '') || null : null,
            model: modelIdx >= 0 ? (cols[modelIdx] || '').trim().replace(/['"]/g, '') || null : null,
            color: colorIdx >= 0 ? (cols[colorIdx] || '').trim().replace(/['"]/g, '') || null : null,
            size: sizeIdx >= 0 ? (cols[sizeIdx] || '').trim().replace(/['"]/g, '') || null : null,
            price,
            costPrice: costPriceIdx >= 0 ? parseFloat((cols[costPriceIdx] || '0').replace(/['"]/g, '')) || null : null,
            stock,
            minStock: minStockIdx >= 0 ? parseInt((cols[minStockIdx] || '5').replace(/['"]/g, '')) || 5 : 5,
            sku,
            supplier: supplierIdx >= 0 ? (cols[supplierIdx] || '').trim().replace(/['"]/g, '') || null : null,
            supplierPhone: supplierPhoneIdx >= 0 ? (cols[supplierPhoneIdx] || '').trim().replace(/['"]/g, '') || null : null,
            type: typeIdx >= 0 ? (cols[typeIdx] || '').trim().replace(/['"]/g, '') || null : null,
            duration: durationIdx >= 0 ? (cols[durationIdx] || '').trim().replace(/['"]/g, '') || null : null,
            lastRestocked: new Date(),
          },
        })
        results.created++
      } catch (err) {
        results.errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Failed to create'}`)
        results.skipped++
      }
    }

    return NextResponse.json(results, { status: 201 })
  } catch (error) {
    console.error('Bulk import error:', error)
    return NextResponse.json({ error: 'Bulk import failed' }, { status: 500 })
  }
}

// Simple CSV line parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}