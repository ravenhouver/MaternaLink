'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { getCurrentUser, getDashboardSummary, type CurrentUser, type DashboardSummary } from '@/lib/api';
import { AdminShell } from './admin-shell';
import styles from './super-admin-dashboard.module.css';

type Stat = { label: string; value: number; tag: string; icon: AppIconName; tone: 'blue' | 'green' | 'neutral' | 'red' };

function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(date);
}

function formatRelative(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.round(hours / 24)} hari lalu`;
}

function activityTitle(action: string, entityType: string) {
  const verb = action.split('.').pop() ?? action;
  const label = verb === 'create' ? 'dibuat' : verb === 'update' ? 'diperbarui' : verb === 'delete' ? 'dihapus' : verb === 'deactivate' ? 'dinonaktifkan' : action;
  return `${entityType} ${label}`;
}

export function SuperAdminDashboardContent() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activityLimit, setActivityLimit] = useState(5);
  const t = useTranslations('admin');

  useEffect(() => {
    let mounted = true;
    Promise.all([getDashboardSummary(), getCurrentUser()])
      .then(([nextSummary, nextUser]) => {
        if (!mounted) return;
        setSummary(nextSummary);
        setUser(nextUser);
        setUpdatedAt(new Date());
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard data');
        setUpdatedAt(new Date());
      });
    return () => { mounted = false; };
  }, []);

  const masterData = summary?.masterData;
  const stats = useMemo<Stat[]>(() => [
    { label: t('totalHealthCenters'), value: masterData?.healthCenters ?? 0, tag: t('last30Days', { count: masterData?.newHealthCenters ?? 0 }), icon: 'briefcase', tone: 'blue' },
    { label: t('totalUsers'), value: masterData?.users ?? 0, tag: t('last30Days', { count: masterData?.newUsers ?? 0 }), icon: 'users', tone: 'green' },
    { label: t('totalMedicines'), value: masterData?.medicines ?? 0, tag: t('last30Days', { count: masterData?.newMedicines ?? 0 }), icon: 'clipboard', tone: 'neutral' },
    { label: t('inactiveAccounts'), value: masterData?.inactiveAccounts ?? 0, tag: masterData?.inactiveAccounts ? t('needsReview') : t('safe'), icon: 'alert', tone: 'red' },
  ], [masterData, t]);

  const recentActivity = summary?.recentActivity ?? [];

  return (
    <AdminShell active="dashboard" breadcrumb="Dashboard" user={user}>
      <div className={styles.content}>
        <section className={styles.pageHeader}>
          <div><h1>{t('dashboardTitle')}</h1><p>{t('dashboardSubtitle')}</p></div>
          <div className={styles.updatedAt}><span>{t('lastUpdated')}</span><strong>{updatedAt ? formatUpdatedAt(updatedAt) : '-'}</strong></div>
        </section>

        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.statsGrid} aria-label="Master data summary">
          {stats.map((stat) => (
            <article className={styles.statCard} data-tone={stat.tone} key={stat.label}>
              <div className={styles.statTopline}><span className={styles.statIcon}><AppIcon name={stat.icon} width={24} height={24} /></span><span className={styles.statTag}>{stat.tag}</span></div>
              <h2>{stat.label}</h2><strong>{stat.value}</strong>
            </article>
          ))}
        </section>

        <section className={styles.dashboardGrid}>
          <article className={styles.activityPanel}>
            <header className={styles.panelHeader}>
              <h2>{t('recentActivity')}</h2>
              <button type="button" onClick={() => setActivityLimit(recentActivity.length)}>{t('allActivity')}</button>
            </header>
            <div className={styles.activityList}>
              {recentActivity.slice(0, activityLimit).map((activity) => (
                <div className={styles.activityRow} key={activity.id}>
                  <span className={styles.activityIcon} data-tone="blue"><AppIcon name="edit" width={18} height={18} /></span>
                  <div className={styles.activityCopy}>
                    <p><strong>{activityTitle(activity.action, activity.entityType)}</strong><span> oleh {activity.actor}</span></p>
                    <small>{activity.entityId ? `ID: ${activity.entityId}` : activity.action}</small>
                  </div>
                  <time>{formatRelative(activity.createdAt)}</time>
                </div>
              ))}
              {recentActivity.length === 0 ? <p className={styles.emptyState}>{t('noAuditLogs')}</p> : null}
            </div>
            <footer className={styles.panelFooter}>
              <button type="button" disabled={activityLimit >= recentActivity.length} onClick={() => setActivityLimit((value) => value + 10)}>{t('loadMoreActivities')}</button>
            </footer>
          </article>
        </section>
      </div>
    </AdminShell>
  );
}
