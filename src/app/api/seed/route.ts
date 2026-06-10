import { NextResponse } from 'next/server';
import { seedCRMData } from '@/lib/seed';

export async function POST() {
  try {
    const result = await seedCRMData();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      {
        error: 'Failed to seed CRM data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}