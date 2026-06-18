#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync } from 'fs';

const db = new PrismaClient();
(async () => {
  const tables = await db.$queryRaw`SELECT sql FROM sqlite_master WHERE type='table' AND sql IS NOT NULL ORDER BY name`;
  const schema = tables.map(t => t.sql).join('\n\n');
  mkdirSync('artifacts', { recursive: true });
  writeFileSync('artifacts/schema.sql', schema);
  console.log('Exported ' + tables.length + ' table definitions');
})().finally(() => db.$disconnect());