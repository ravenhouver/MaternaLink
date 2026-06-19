import type { AppIconName } from '@/components/ui/app-icon';
import type { DashboardSummary, DistributionRecommendation, QueueRecord } from '@/lib/api';
import { routes } from '@/lib/routes';

export type DashboardActivity = {
  key: string;
  name: string;
  title: string;
  meta: string;
  icon: AppIconName;
  tone: 'blue' | 'green' | 'red';
  href: string;
};

const queueStatusLabels: Record<QueueRecord['status'], string> = {
  WAITING: 'Menunggu Pemeriksaan',
  EXAMINING: 'Sedang Diperiksa',
  COMPLETED: 'Pemeriksaan Selesai',
  CANCELLED: 'Antrian Dibatalkan',
};

export function buildDashboardActivities(
  queueRows: QueueRecord[],
  recommendations: DistributionRecommendation[],
): DashboardActivity[] {
  return [
    ...queueRows.slice(0, 2).map((row): DashboardActivity => ({
      key: `queue-${row.id}`,
      name: row.patient.fullName,
      title: queueStatusLabels[row.status],
      meta: `${row.queueNo} - ${new Date(row.queuedAt).toLocaleString('id-ID')}`,
      icon: 'clipboard',
      tone: row.status === 'WAITING' ? 'blue' : 'green',
      href: routes.patientDetail(row.patient.id),
    })),
    ...recommendations.slice(0, 2).map((row): DashboardActivity => ({
      key: `recommendation-${row.id}`,
      name: row.puskesmas?.nama ?? row.puskesmasId,
      title: `Distribution ${row.status}`,
      meta: row.justification ?? row.source,
      icon: row.urgency === 'CRITICAL' ? 'alert' : 'package',
      tone: row.urgency === 'CRITICAL' ? 'red' : 'green',
      href: routes.ifkRecommendations,
    })),
  ];
}

export function getDashboardAttentionCount(summary: DashboardSummary | null): number {
  if (!summary) return 0;
  if (summary.role === 'IFK_ADMIN') return summary.recommendations?.pending ?? 0;

  return (
    (summary.queue?.waiting ?? 0) +
    (summary.queue?.examining ?? 0) +
    (summary.medicine?.criticalCount ?? 0)
  );
}
