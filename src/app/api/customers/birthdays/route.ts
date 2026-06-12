import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/customers/birthdays?days=30
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    const allCustomers = await prisma.customer.findMany({
      where: { dob: { not: null } },
      select: { id: true, name: true, phone: true, dob: true, group: true, email: true },
    });

    const today = new Date();
    const currentYear = today.getFullYear();

    const upcoming: Array<{
      id: string;
      name: string;
      phone: string;
      email: string | null;
      group: string;
      daysUntil: number;
      nextBirthday: string;
      age: number;
    }> = [];

    for (const customer of allCustomers) {
      if (!customer.dob) continue;
      const dob = new Date(customer.dob);
      const birthMonth = dob.getMonth();
      const birthDay = dob.getDate();

      let nextBirthday = new Date(currentYear, birthMonth, birthDay);
      if (nextBirthday < today) {
        nextBirthday = new Date(currentYear + 1, birthMonth, birthDay);
      }

      const diffTime = nextBirthday.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysUntil <= days) {
        upcoming.push({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          group: customer.group,
          daysUntil,
          nextBirthday: nextBirthday.toISOString(),
          age: nextBirthday.getFullYear() - dob.getFullYear(),
        });
      }
    }

    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

    return NextResponse.json({ birthdays: upcoming, total: upcoming.length, daysRange: days });
  } catch (error) {
    console.error('GET /api/customers/birthdays error:', error);
    return NextResponse.json({ error: 'Failed to fetch birthdays' }, { status: 500 });
  }
}