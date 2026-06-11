import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/prescriptions?customerId=xxx — fetch customer's prescription history
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 })
    }

    const prescriptions = await db.prescription.findMany({
      where: { customerId },
      orderBy: { date: 'desc' },
      take: 10,
    })

    return NextResponse.json({ prescriptions })
  } catch (error) {
    console.error('GET /api/prescriptions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}