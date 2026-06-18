#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync } from 'fs';

const db = new PrismaClient();
(async () => {
  const indexes = await db.$queryRaw`
    SELECT m.name as table_name, il.name as index_name
    FROM sqlite_master m
    JOIN pragma_index_list(m.name) il
    WHERE m.type='table' ORDER BY m.name`;
  mkdirSync('artifacts', { recursive: true });
  writeFileSync('artifacts/indexes.json', JSON.stringify(indexes, null, 2));
  console.log('Found ' + indexes.length + ' indexes');
})().finally(() => db.$disconnect());