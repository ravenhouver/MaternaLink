import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const layoutMenu = readFileSync('apps/web/src/components/layout/layout-menu.ts', 'utf8');
const middleware = readFileSync('apps/web/src/middleware.ts', 'utf8');
const deliveriesMenuLine = layoutMenu.split(/\r?\n/).find((line) => line.includes('routes.deliveries')) ?? '';
const deliveriesGuardLine = middleware.split(/\r?\n/).find((line) => line.includes("href: '/deliveries'")) ?? '';

assert.match(
  deliveriesMenuLine,
  /roles:\s*\['BIDAN_PUSKESMAS'\]/,
  'deliveries menu item must belong to BIDAN_PUSKESMAS',
);
assert.doesNotMatch(
  deliveriesMenuLine,
  /roles:\s*\['IFK_ADMIN'\]/,
  'deliveries menu item must not belong to IFK_ADMIN',
);
assert.match(
  deliveriesGuardLine,
  /roles:\s*\['BIDAN_PUSKESMAS'\]/,
  'deliveries route guard must allow BIDAN_PUSKESMAS',
);
assert.doesNotMatch(
  deliveriesGuardLine,
  /roles:\s*\['IFK_ADMIN'\]/,
  'deliveries route guard must not allow IFK_ADMIN',
);
