import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface BackupBlob {
  version: string
  exportedAt: string
  data: {
    customers?: Record<string, unknown>[]
    products?: Record<string, unknown>[]
    sales?: Record<string, unknown>[]
    returns?: Record<string, unknown>[]
    labOrders?: Record<string, unknown>[]
    prescriptions?: Record<string, unknown>[]
    visits?: Record<string, unknown>[]
    appointments?: Record<string, unknown>[]
    expenses?: Record<string, unknown>[]
    dues?: Record<string, unknown>[]
    staff?: Record<string, unknown>[]
    campaigns?: Record<string, unknown>[]
  }
}

function stripIds(records: Record<string, unknown>[], fields: string[]): Record<string, unknown>[] {
  return records.map((r) => {
    const cleaned = { ...r }
    for (const f of fields) {
      delete cleaned[f]
    }
    return cleaned
  })
}

export async function POST(req: NextRequest) {
  try {
    const body: BackupBlob = await req.json()

    if (!body.version || !body.data) {
      return NextResponse.json(
        { error: 'Invalid backup format. Missing version or data.' },
        { status: 400 }
      )
    }

    const d = body.data
    const restored: Record<string, number> = {}

    await db.$transaction(async (tx) => {
      // Delete in reverse dependency order (respect foreign keys)
      await tx.return.deleteMany()
      await tx.saleItem.deleteMany()
      await tx.sale.deleteMany()
      await tx.prescription.deleteMany()
      await tx.visit.deleteMany()
      await tx.appointment.deleteMany()
      await tx.due.deleteMany()
      await tx.labOrder.deleteMany()
      await tx.expense.deleteMany()
      await tx.customer.deleteMany()
      await tx.product.deleteMany()
      await tx.staff.deleteMany()
      await tx.campaign.deleteMany()

      // Insert in dependency order

      // Staff (no dependencies)
      if (d.staff?.length) {
        const rows = stripIds(d.staff, ['createdAt', 'updatedAt', 'joinDate'])
        for (const row of rows) {
          await tx.staff.create({
            data: {
              name: String(row.name || ''),
              phone: String(row.phone || ''),
              role: String(row.role || 'Staff'),
              email: row.email ? String(row.email) : null,
              salary: Number(row.salary || 0),
              commission: Number(row.commission || 0),
              isActive: Boolean(row.isActive ?? true),
              joinDate: row.joinDate ? new Date(String(row.joinDate)) : null,
              loginId: row.loginId ? String(row.loginId) : null,
            },
          })
        }
        restored.staff = rows.length
      }

      // Products (no dependencies)
      if (d.products?.length) {
        const rows = stripIds(d.products, ['createdAt', 'updatedAt', 'lastRestocked', 'expiryDate'])
        for (const row of rows) {
          await tx.product.create({
            data: {
              name: String(row.name || ''),
              category: String(row.category || ''),
              brand: row.brand ? String(row.brand) : null,
              model: row.model ? String(row.model) : null,
              color: row.color ? String(row.color) : null,
              size: row.size ? String(row.size) : null,
              frameWidth: row.frameWidth ? Number(row.frameWidth) : null,
              bridge: row.bridge ? Number(row.bridge) : null,
              temple: row.temple ? Number(row.temple) : null,
              price: Number(row.price || 0),
              costPrice: row.costPrice ? Number(row.costPrice) : null,
              stock: Number(row.stock || 0),
              minStock: Number(row.minStock || 5),
              supplier: row.supplier ? String(row.supplier) : null,
              supplierPhone: row.supplierPhone ? String(row.supplierPhone) : null,
              lastRestocked: row.lastRestocked ? new Date(String(row.lastRestocked)) : null,
              sku: String(row.sku || ''),
              barcode: row.barcode ? String(row.barcode) : null,
              type: row.type ? String(row.type) : null,
              duration: row.duration ? String(row.duration) : null,
              expiryDate: row.expiryDate ? new Date(String(row.expiryDate)) : null,
              description: row.description ? String(row.description) : null,
              isActive: Boolean(row.isActive ?? true),
            },
          })
        }
        restored.products = rows.length
      }

      // Customers (no dependencies)
      if (d.customers?.length) {
        const rows = stripIds(d.customers, ['createdAt', 'updatedAt', 'dob'])
        for (const row of rows) {
          await tx.customer.create({
            data: {
              name: String(row.name || ''),
              phone: String(row.phone || ''),
              email: row.email ? String(row.email) : null,
              dob: row.dob ? new Date(String(row.dob)) : null,
              address: row.address ? String(row.address) : null,
              aadhar: row.aadhar ? String(row.aadhar) : null,
              group: String(row.group || 'New'),
              loyaltyPoints: Number(row.loyaltyPoints || 0),
              totalSpent: Number(row.totalSpent || 0),
            },
          })
        }
        restored.customers = rows.length
      }

      // Campaigns (no dependencies)
      if (d.campaigns?.length) {
        const rows = stripIds(d.campaigns, ['createdAt', 'updatedAt', 'scheduledAt'])
        for (const row of rows) {
          await tx.campaign.create({
            data: {
              name: String(row.name || ''),
              type: String(row.type || ''),
              message: String(row.message || ''),
              status: String(row.status || 'Planned'),
              budget: Number(row.budget || 0),
              reach: Number(row.reach || 0),
              targetGroup: row.targetGroup ? String(row.targetGroup) : null,
              scheduledAt: row.scheduledAt ? new Date(String(row.scheduledAt)) : null,
              sentCount: Number(row.sentCount || 0),
            },
          })
        }
        restored.campaigns = rows.length
      }

      // Visits (depends on customers)
      if (d.visits?.length) {
        const rows = stripIds(d.visits, ['createdAt'])
        const allCustomers = await tx.customer.findMany({ select: { id: true, phone: true, name: true } })
        let count = 0
        for (const row of rows) {
          const origId = String(row.customerId || '')
          const customer = allCustomers.find((c) => c.id === origId)
          if (!customer) continue
          await tx.visit.create({
            data: {
              customerId: customer.id,
              date: row.date ? new Date(String(row.date)) : new Date(),
              purpose: row.purpose ? String(row.purpose) : null,
              notes: row.notes ? String(row.notes) : null,
            },
          })
          count++
        }
        restored.visits = count
      }

      // Prescriptions (depends on customers)
      if (d.prescriptions?.length) {
        const rows = stripIds(d.prescriptions, ['createdAt'])
        const allCustomers = await tx.customer.findMany({ select: { id: true, phone: true, name: true } })
        let count = 0
        for (const row of rows) {
          const origId = String(row.customerId || '')
          const customer = allCustomers.find((c) => c.id === origId)
          if (!customer) continue
          await tx.prescription.create({
            data: {
              customerId: customer.id,
              date: row.date ? new Date(String(row.date)) : new Date(),
              leftSPH: row.leftSPH ? Number(row.leftSPH) : null,
              leftCYL: row.leftCYL ? Number(row.leftCYL) : null,
              leftAXIS: row.leftAXIS ? Number(row.leftAXIS) : null,
              leftPD: row.leftPD ? Number(row.leftPD) : null,
              rightSPH: row.rightSPH ? Number(row.rightSPH) : null,
              rightCYL: row.rightCYL ? Number(row.rightCYL) : null,
              rightAXIS: row.rightAXIS ? Number(row.rightAXIS) : null,
              rightPD: row.rightPD ? Number(row.rightPD) : null,
              notes: row.notes ? String(row.notes) : null,
            },
          })
          count++
        }
        restored.prescriptions = count
      }

      // Appointments (depends on customers)
      if (d.appointments?.length) {
        const rows = stripIds(d.appointments, ['createdAt', 'updatedAt'])
        const allCustomers = await tx.customer.findMany({ select: { id: true } })
        let count = 0
        for (const row of rows) {
          const origId = String(row.customerId || '')
          const customer = allCustomers.find((c) => c.id === origId)
          if (!customer) continue
          await tx.appointment.create({
            data: {
              customerId: customer.id,
              date: row.date ? new Date(String(row.date)) : new Date(),
              time: row.time ? String(row.time) : null,
              purpose: row.purpose ? String(row.purpose) : null,
              status: String(row.status || 'Scheduled'),
              notes: row.notes ? String(row.notes) : null,
            },
          })
          count++
        }
        restored.appointments = count
      }

      // Expenses (no dependencies)
      if (d.expenses?.length) {
        const rows = stripIds(d.expenses, ['createdAt'])
        for (const row of rows) {
          await tx.expense.create({
            data: {
              category: String(row.category || ''),
              description: String(row.description || ''),
              amount: Number(row.amount || 0),
              date: row.date ? new Date(String(row.date)) : new Date(),
              vendor: row.vendor ? String(row.vendor) : null,
            },
          })
        }
        restored.expenses = rows.length
      }

      // Dues (depends on customers)
      if (d.dues?.length) {
        const rows = stripIds(d.dues, ['createdAt', 'updatedAt'])
        const allCustomers = await tx.customer.findMany({ select: { id: true } })
        let count = 0
        for (const row of rows) {
          const origId = String(row.customerId || '')
          const customer = allCustomers.find((c) => c.id === origId)
          if (!customer) continue
          await tx.due.create({
            data: {
              customerId: customer.id,
              amount: Number(row.amount || 0),
              paid: Number(row.paid || 0),
              status: String(row.status || 'Pending'),
              dueDate: row.dueDate ? new Date(String(row.dueDate)) : null,
              notes: row.notes ? String(row.notes) : null,
            },
          })
          count++
        }
        restored.dues = count
      }

      // Lab Orders (no FK dependencies in our schema)
      if (d.labOrders?.length) {
        const rows = stripIds(d.labOrders, ['createdAt', 'updatedAt'])
        for (const row of rows) {
          await tx.labOrder.create({
            data: {
              customerId: row.customerId ? String(row.customerId) : null,
              saleId: row.saleId ? String(row.saleId) : null,
              lensType: String(row.lensType || ''),
              leftSPH: row.leftSPH ? Number(row.leftSPH) : null,
              leftCYL: row.leftCYL ? Number(row.leftCYL) : null,
              leftAXIS: row.leftAXIS ? Number(row.leftAXIS) : null,
              rightSPH: row.rightSPH ? Number(row.rightSPH) : null,
              rightCYL: row.rightCYL ? Number(row.rightCYL) : null,
              rightAXIS: row.rightAXIS ? Number(row.rightAXIS) : null,
              leftPD: row.leftPD ? Number(row.leftPD) : null,
              rightPD: row.rightPD ? Number(row.rightPD) : null,
              frameId: row.frameId ? String(row.frameId) : null,
              status: String(row.status || 'Pending'),
              costPrice: Number(row.costPrice || 0),
              sellingPrice: Number(row.sellingPrice || 0),
              dueDate: row.dueDate ? new Date(String(row.dueDate)) : null,
              notes: row.notes ? String(row.notes) : null,
            },
          })
        }
        restored.labOrders = rows.length
      }

      // Sales + SaleItems (sales depends on customers, items depend on sales & products)
      if (d.sales?.length) {
        const rows = stripIds(d.sales, ['createdAt', 'updatedAt'])
        const allCustomers = await tx.customer.findMany({ select: { id: true } })
        const allProducts = await tx.product.findMany({ select: { id: true, sku: true } })
        let salesCount = 0
        let saleItemsCount = 0

        // Build a saleId mapping from old id to new id for returns
        const saleIdMap = new Map<string, string>()

        for (const row of rows) {
          const origCustId = String(row.customerId || '')
          const customer = allCustomers.find((c) => c.id === origCustId)

          // Items may be nested inside the sale (from backup) or in a separate saleItems array
          const nestedItems = Array.isArray(row.items) ? row.items as Record<string, unknown>[] : []

          const sale = await tx.sale.create({
            data: {
              invoiceNo: String(row.invoiceNo || `INV-${Date.now()}`),
              customerId: customer?.id || null,
              subtotal: Number(row.subtotal || 0),
              discount: Number(row.discount || 0),
              cgst: Number(row.cgst || 0),
              sgst: Number(row.sgst || 0),
              igst: Number(row.igst || 0),
              totalAmount: Number(row.totalAmount || 0),
              paymentMode: String(row.paymentMode || 'Cash'),
              status: String(row.status || 'Completed'),
              notes: row.notes ? String(row.notes) : null,
              staffId: row.staffId ? String(row.staffId) : null,
            },
          })

          // Store mapping for returns
          const origSaleId = String(row.id || '')
          saleIdMap.set(origSaleId, sale.id)

          // Create items from nested data
          for (const si of nestedItems) {
            const origProdId = String(si.productId || '')
            const product = allProducts.find((p) => p.id === origProdId || p.sku === origProdId)
            if (!product) continue
            await tx.saleItem.create({
              data: {
                saleId: sale.id,
                productId: product.id,
                qty: Number(si.qty || 1),
                price: Number(si.price || 0),
                total: Number(si.total || 0),
              },
            })
            saleItemsCount++
          }

          salesCount++
        }
        restored.sales = salesCount

        // Returns (depends on sales)
        if (d.returns?.length) {
          const retRows = stripIds(d.returns, ['createdAt'])
          let returnCount = 0
          for (const row of retRows) {
            const origSaleId = String(row.saleId || '')
            const newSaleId = saleIdMap.get(origSaleId)
            if (!newSaleId) continue
            await tx.return.create({
              data: {
                saleId: newSaleId,
                reason: String(row.reason || ''),
                amount: Number(row.amount || 0),
                status: String(row.status || 'Pending'),
              },
            })
            returnCount++
          }
          restored.returns = returnCount
        }
      } else if (d.returns?.length) {
        // Fallback: handle returns if sales section is empty
        const retRows = stripIds(d.returns, ['createdAt'])
        const allSales = await tx.sale.findMany({ select: { id: true, invoiceNo: true } })
        let returnCount = 0
        for (const row of retRows) {
          const origSaleId = String(row.saleId || '')
          const sale = allSales.find((s) => s.id === origSaleId)
          if (!sale) continue
          await tx.return.create({
            data: {
              saleId: sale.id,
              reason: String(row.reason || ''),
              amount: Number(row.amount || 0),
              status: String(row.status || 'Pending'),
            },
          })
          returnCount++
        }
        restored.returns = returnCount
      }
    })

    return NextResponse.json({ success: true, restored })
  } catch (error) {
    console.error('Restore failed:', error)
    return NextResponse.json(
      { error: 'Failed to restore backup: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}