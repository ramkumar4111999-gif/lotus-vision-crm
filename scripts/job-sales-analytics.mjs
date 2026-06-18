#!/usr/bin/env node
import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync } from 'fs';

const db = new PrismaClient();
(async () => {
  const modes = await db.$queryRaw`SELECT paymentMode, COUNT(*) as count, SUM(totalAmount) as total FROM Sale GROUP BY paymentMode`;
  const top = await db.$queryRaw`
    SELECT p.name, p.sku, SUM(si.qty) as qty, SUM(si.total) as revenue
    FROM SaleItem si JOIN Product p ON si.productId = p.id
    GROUP BY si.productId ORDER BY revenue DESC LIMIT 10`;
  const analytics = { paymentModes: modes, topProducts: top };
  mkdirSync('artifacts', { recursive: true });
  writeFileSync('artifacts/sales-analytics.json', JSON.stringify(analytics, null, 2));
  console.log('Payment modes:', modes.map(m => m.paymentMode).join(', '));
  console.log('Top products:', top.length);
})().finally(() => db.$disconnect());