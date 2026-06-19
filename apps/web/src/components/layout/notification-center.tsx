'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { getAlerts, getDashboardSummary, getRecommendations, type AlertRecord, type CurrentUser, type DashboardSummary, type DistributionRecommendation } from '@/lib/api';
import styles from './notification-center.module.css';

type NotificationTone = 'critical' | 'warning' | 'success' | 'info';

type NotificationItem = {
  id: string;
  legacyIds?: string[];
  title: string;
  body: string;
  tone: NotificationTone;
  time: string;
};

type NotificationCenterProps = {
  user: CurrentUser;
  buttonClassName?: string;
};

const storageVersion = 'v1';

function getStorageKey(userId: string) {
  return `maternalink.notifications.${storageVersion}.${userId}`;
}

function readStoredIds(storageKey: string) {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(storageKey);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeStoredIds(storageKey: string, ids: string[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(ids));
  } catch {
    // The UI state still updates even when storage is unavailable.
  }
}

function isItemRead(item: NotificationItem, readIds: string[]) {
  return [item.id, ...(item.legacyIds ?? [])].some((id) => readIds.includes(id));
}

function formatTime(value?: string) {
  if (!value) return 'Baru saja';
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function buildSummaryItems(summary: DashboardSummary): NotificationItem[] {
  const items: NotificationItem[] = [];

  if (summary.queue?.waiting) {
    items.push({ id: 'queue-waiting', legacyIds: [`queue-waiting-${summary.queue.waiting}`], title: 'Antrean pasien menunggu', body: `${summary.queue.waiting} pasien perlu dipanggil atau diproses.`, tone: 'info', time: 'Hari ini' });
  }

  if (summary.medicine?.criticalCount) {
    items.push({ id: 'medicine-critical', legacyIds: [`medicine-critical-${summary.medicine.criticalCount}`], title: 'Stok obat kritis', body: `${summary.medicine.criticalCount} item obat butuh perhatian.`, tone: 'critical', time: 'Hari ini' });
  }

  if (summary.recommendations?.pending) {
    items.push({ id: 'recommendation-pending', legacyIds: [`recommendation-pending-${summary.recommendations.pending}`], title: 'Rekomendasi menunggu review', body: `${summary.recommendations.pending} rekomendasi distribusi belum diputuskan.`, tone: 'warning', time: 'Hari ini' });
  }

  if (summary.deliveries?.active) {
    items.push({ id: 'delivery-active', legacyIds: [`delivery-active-${summary.deliveries.active}`], title: 'Pengiriman aktif', body: `${summary.deliveries.active} pengiriman sedang berjalan.`, tone: 'success', time: 'Hari ini' });
  }

  if (summary.masterData?.inactiveAccounts) {
    items.push({ id: 'inactive-accounts', legacyIds: [`inactive-accounts-${summary.masterData.inactiveAccounts}`], title: 'Akun tidak aktif', body: `${summary.masterData.inactiveAccounts} akun perlu ditinjau super admin.`, tone: 'warning', time: 'Hari ini' });
  }

  return items;
}

function buildAlertItems(alerts: AlertRecord[]): NotificationItem[] {
  return alerts.filter((alert) => !alert.resolved).slice(0, 4).map((alert) => ({
    id: `alert-${alert.id}-${alert.resolved ? 'closed' : 'open'}`,
    title: alert.type.replaceAll('_', ' '),
    body: alert.message,
    tone: alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'critical' : 'warning',
    time: formatTime(alert.createdAt),
  }));
}

function buildRecommendationItems(recommendations: DistributionRecommendation[]): NotificationItem[] {
  return recommendations.slice(0, 3).map((item) => ({
    id: `recommendation-${item.id}-${item.status}`,
    title: item.urgency === 'CRITICAL' ? 'Distribusi prioritas kritis' : 'Distribusi menunggu keputusan',
    body: `${item.puskesmas?.nama ?? item.puskesmasId} - ${item.items.length} item obat.`,
    tone: item.urgency === 'CRITICAL' ? 'critical' : 'warning',
    time: item.periode,
  }));
}

export function NotificationCenter({ user, buttonClassName }: NotificationCenterProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [recommendations, setRecommendations] = useState<DistributionRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const storageKey = getStorageKey(user.id);
  const [readIds, setReadIds] = useState<string[]>(() => readStoredIds(storageKey));

  useEffect(() => {
    setReadIds(readStoredIds(storageKey));
  }, [storageKey]);

  useEffect(() => {
    let cancelled = false;
    const alertsPromise = user.role === 'IFK_ADMIN' ? getAlerts() : Promise.resolve([]);
    const recommendationsPromise = user.role === 'IFK_ADMIN' ? getRecommendations({ status: 'PENDING' }) : Promise.resolve([]);

    Promise.all([getDashboardSummary(), alertsPromise, recommendationsPromise])
      .then(([nextSummary, nextAlerts, nextRecommendations]) => {
        if (cancelled) return;
        setSummary(nextSummary);
        setAlerts(nextAlerts);
        setRecommendations(nextRecommendations);
        setError(null);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat notifikasi');
      });

    return () => {
      cancelled = true;
    };
  }, [user.role]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  const items = useMemo(() => {
    const summaryItems = summary ? buildSummaryItems(summary) : [];
    return [...buildAlertItems(alerts), ...buildRecommendationItems(recommendations), ...summaryItems].slice(0, 8);
  }, [alerts, recommendations, summary]);

  const unreadCount = items.filter((item) => !isItemRead(item, readIds)).length;

  const markAllRead = () => {
    const nextReadIds = Array.from(new Set([...readIds, ...items.map((item) => item.id)]));
    setReadIds(nextReadIds);
    writeStoredIds(storageKey, nextReadIds);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button type="button" className={buttonClassName ?? styles.trigger} aria-label={`Notifikasi, ${unreadCount} belum dibaca`} aria-expanded={isOpen} onClick={() => setIsOpen((current) => !current)}>
        <AppIcon name="bell" width={20} height={20} />
        {unreadCount ? <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
      </button>

      {isOpen ? (
        <section className={styles.panel} aria-label="Pusat notifikasi">
          <div className={styles.panelHeader}>
            <div>
              <strong>Notifikasi</strong>
              <span>{unreadCount ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}</span>
            </div>
            {items.length ? <button type="button" className={styles.markRead} onClick={markAllRead}>Tandai dibaca</button> : null}
          </div>

          {items.length ? (
            <div className={styles.list}>
              {items.map((item) => {
                const isUnread = !isItemRead(item, readIds);
                return (
                  <article className={[styles.item, styles[item.tone], isUnread ? styles.unread : ''].filter(Boolean).join(' ')} key={item.id}>
                    <span className={styles.dot} />
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                      <time>{item.time}</time>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.empty}>
              <strong>Tidak ada notifikasi</strong>
              <p>Aktivitas penting akan muncul di sini.</p>
            </div>
          )}

          {error ? <p className={styles.error}>{error}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
