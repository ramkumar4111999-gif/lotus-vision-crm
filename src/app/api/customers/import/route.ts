import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/customers/import — Bulk import customers from CSV
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV must have a header row and at least one data row' },
        { status: 400 }
      );
    }

    // Parse header
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
    const nameIdx = header.indexOf('name');
    const phoneIdx = header.indexOf('phone');
    const emailIdx = header.indexOf('email');
    const groupIdx = header.indexOf('group');
    const addressIdx = header.indexOf('address');

    if (nameIdx === -1 || phoneIdx === -1) {
      return NextResponse.json(
        { error: 'CSV must have "name" and "phone" columns' },
        { status: 400 }
      );
    }

    const validGroups = ['New', 'Regular', 'Wholesale', 'Premium'];
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Simple CSV parsing (handles quoted fields)
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current.trim());

      const name = fields[nameIdx] || '';
      const phone = fields[phoneIdx] || '';
      const email = emailIdx !== -1 ? fields[emailIdx] || null : null;
      const group = groupIdx !== -1 && validGroups.includes(fields[groupIdx])
        ? fields[groupIdx]
        : 'New';
      const address = addressIdx !== -1 ? fields[addressIdx] || null : null;

      if (!name || !phone) {
        skipped++;
        errors.push(`Row ${i + 1}: Missing name or phone`);
        continue;
      }

      // Check for duplicate phone
      const existing = await db.customer.findFirst({
        where: { phone },
      });
      if (existing) {
        skipped++;
        errors.push(`Row ${i + 1}: Phone "${phone}" already exists (${existing.name})`);
        continue;
      }

      await db.customer.create({
        data: {
          name,
          phone,
          email: email || undefined,
          group,
          address: address || undefined,
        },
      });
      imported++;
    }

    return NextResponse.json({
      imported,
      skipped,
      total: imported + skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error importing customers:', error);
    return NextResponse.json(
      { error: 'Failed to import customers' },
      { status: 500 }
    );
  }
}