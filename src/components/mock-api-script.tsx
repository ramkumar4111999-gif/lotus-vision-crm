'use client';

import Script from 'next/script';

export function MockApiScript() {
  return <Script src="/lotus-vision-crm/mock-api-init.js" strategy="beforeInteractive" />;
}