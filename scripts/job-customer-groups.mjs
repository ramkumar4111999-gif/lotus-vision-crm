#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync } from 'fs';

const db = new PrismaClient();
(async () => {
  const groups = await db.$queryRaw`
    SELECT "group" as name, COUNT(*) as count, SUM(totalSpent) as totalSpent
    FROM Customer GROUP BY "group" ORDER BY count DESC`;
  mkdirSync('artifacts', { recursive: true });
  writeFileSync('artifacts/customer-groups.json', JSON.stringify(groups, null, 2));
  console.log('Customer groups:');
  groups.forEach(g => console.log('  ' + g.name + ': ' + g.count + ' customers'));
})().finally(() => db.$disconnect());