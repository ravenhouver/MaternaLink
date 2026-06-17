import assert from 'node:assert/strict';
import { buildDashboardActivities } from './dashboard-activities';
import type { DistributionRecommendation, QueueRecord } from '@/lib/api';

const queueRows = [
  {
    id: 'queue-1',
    queueNo: 'A-001',
    status: 'WAITING',
    queuedAt: '2026-06-17T01:00:00.000Z',
    patient: { id: 'patient-1', fullName: 'Ny. Test Flow', nik: '1' },
    pregnancy: { id: 'pregnancy-1', riskLevel: 'LOW' },
  },
  {
    id: 'queue-2',
    queueNo: 'A-002',
    status: 'EXAMINING',
    queuedAt: '2026-06-17T02:00:00.000Z',
    patient: { id: 'patient-2', fullName: 'Ny. Test Flow', nik: '2' },
    pregnancy: { id: 'pregnancy-2', riskLevel: 'LOW' },
  },
] satisfies QueueRecord[];

const recommendations = [
  {
    id: 'recommendation-1',
    puskesmasId: 'PKM-001',
    periode: '2026-06-01T00:00:00.000Z',
    urgency: 'ROUTINE',
    status: 'PENDING',
    source: 'AI',
    priorityRank: 1,
    puskesmas: { id: 'PKM-001', nama: 'Puskesmas MaternaLink 001' },
    items: [],
  },
  {
    id: 'recommendation-2',
    puskesmasId: 'PKM-001',
    periode: '2026-06-01T00:00:00.000Z',
    urgency: 'CRITICAL',
    status: 'PENDING',
    source: 'AI',
    priorityRank: 2,
    puskesmas: { id: 'PKM-001', nama: 'Puskesmas MaternaLink 001' },
    items: [],
  },
] satisfies DistributionRecommendation[];

const activities = buildDashboardActivities(queueRows, recommendations);

assert.deepEqual(
  activities.map((activity) => activity.key),
  ['queue-queue-1', 'queue-queue-2', 'recommendation-recommendation-1', 'recommendation-recommendation-2'],
);
assert.equal(new Set(activities.map((activity) => activity.key)).size, activities.length);
