'use client';

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import { getCurrentUser, getDashboardSummary, getQueue, getRecommendations, type CurrentUser, type DashboardSummary } from '@/lib/api';
import { routes } from '@/lib/routes';
import { buildDashboardActivities, getDashboardAttentionCount, type DashboardActivity } from './dashboard-activities';
import styles from './dashboard.module.css';

type StatCard = {
  label: string;
  value: string;
  tag: string;
  icon: AppIconName;
  accent: string;
};

type QuickAction = {
  label: string;
  icon: AppIconName;
  href: string;
};

const quickActions: QuickAction[] = [
  { label: 'New Patient', icon: 'users', href: routes.newPatient },
  { label: 'Calendar', icon: 'calendar', href: routes.forecastCalendar },
  { label: 'Add Medicines', icon: 'plus', href: routes.medicineNeeds },
  { label: 'Delivering', icon: 'package', href: routes.deliveries },
];

export function DashboardContent() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getDashboardSummary(), getCurrentUser(), getQueue().catch(() => []), getRecommendations().catch(() => [])])
      .then(([nextSummary, nextUser, queueRows, recommendations]) => {
        if (!mounted) return;
        setSummary(nextSummary);
        setUser(nextUser);
        setActivities(buildDashboardActivities(queueRows, recommendations));
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat dashboard');
      });
    return () => { mounted = false; };
  }, []);

  const statCards = useMemo<StatCard[]>(() => {
    if (summary?.role === 'IFK_ADMIN') {
      return [
        { label: 'Pending Recommendations', value: String(summary.recommendations?.pending ?? 0), tag: 'Needs Review', icon: 'clipboard', accent: '#1a73e8' },
        { label: 'Approved Recommendations', value: String(summary.recommendations?.approved ?? 0), tag: 'Approved', icon: 'heart', accent: '#006948' },
        { label: 'Rejected Recommendations', value: String(summary.recommendations?.rejected ?? 0), tag: 'Rejected', icon: 'alert', accent: '#a33d23' },
        { label: 'Active Deliveries', value: String(summary.deliveries?.active ?? 0), tag: 'In Progress', icon: 'package', accent: '#f59e0b' },
      ];
    }
    return [
      { label: 'Total Registered Patients', value: String(summary?.patients?.total ?? 0), tag: 'Database', icon: 'users', accent: '#1a73e8' },
      { label: 'Waiting Queue', value: String(summary?.queue?.waiting ?? 0), tag: 'Today', icon: 'calendar', accent: '#006948' },
      { label: 'In Examination', value: String(summary?.queue?.examining ?? 0), tag: 'Active', icon: 'clipboard', accent: '#a33d23' },
      { label: 'Medications To Restock', value: String(summary?.medicine?.criticalCount ?? 0), tag: 'Critical', icon: 'package', accent: '#f59e0b' },
    ];
  }, [summary]);

  const attentionCount = getDashboardAttentionCount(summary);

  return (
    <PageContainer size="wide" className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Welcome, {user?.displayName ?? user?.username ?? 'User'}</h1>
          <p>{summary?.role === 'IFK_ADMIN' ? 'IFK distribution report from live data' : 'Puskesmas activity report from live data'}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.bellButton} aria-label="Notifications">
            <AppIcon name="bell" width={20} height={20} />
          </button>
          <button type="button" className={styles.clinicPill} aria-label="Current clinic: Sejahtera Clinic">
            <span>{user?.puskesmasId ?? 'IFK'}</span>
            <strong>{summary?.role === 'IFK_ADMIN' ? 'IFK' : 'PKM'}</strong>
          </button>
        </div>
      </header>

      {error ? <p className={styles.dashboardError}>{error}</p> : null}

      <section className={styles.alertBanner} aria-label="Delivery date alert">
        <div className={styles.alertCopy}>
          <span className={styles.alertIcon}>
            <AppIcon name="alert" width={28} height={28} />
          </span>
          <div>
            <h2>{attentionCount} items need attention</h2>
            <p>{summary?.role === 'IFK_ADMIN' ? 'Review pending distribution recommendations.' : 'Check queue and medication availability now.'}</p>
          </div>
        </div>
        <button type="button" className={styles.alertButton}>Check Now</button>
      </section>

      <section className={styles.statsGrid} aria-label="Dashboard metrics">
        {statCards.map((stat) => (
          <article className={styles.statCard} style={{ '--accent': stat.accent } as CSSProperties} key={stat.label}>
            <div className={styles.statTopline}>
              <span className={styles.statIcon}><AppIcon name={stat.icon} width={22} height={22} /></span>
              <span className={styles.statTag}>{stat.tag}</span>
            </div>
            <h3>{stat.label}</h3>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className={styles.lowerGrid}>
        <div className={styles.quickColumn}>
          <h2 className={styles.sectionTitle}><AppIcon name="zap" width={18} height={18} />Quick Actions</h2>
          <div className={styles.quickGrid}>
            {quickActions.map((action) => (
              <Link href={action.href} className={styles.quickAction} key={action.label}>
                <span><AppIcon name={action.icon} width={24} height={24} /></span>
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.activityColumn}>
          <div className={styles.activityHeader}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <button type="button">View All</button>
          </div>
          <div className={styles.activityCard}>
            {activities.length === 0 ? <button type="button" className={styles.activityRow}><span className={[styles.activityIcon, styles.blue].join(' ')}><AppIcon name="clipboard" width={22} height={22} /></span><span className={styles.activityText}><span><strong>No activity</strong> - database kosong</span><small>Tambah pasien atau rekomendasi untuk melihat aktivitas.</small></span></button> : null}
            {activities.map((activity) => (
              <button type="button" className={styles.activityRow} key={activity.key}>
                <span className={[styles.activityIcon, styles[activity.tone]].join(' ')}>
                  <AppIcon name={activity.icon} width={22} height={22} />
                </span>
                <span className={styles.activityText}>
                  <span><strong>{activity.name}</strong> - {activity.title}</span>
                  <small>{activity.meta}</small>
                </span>
                <AppIcon name="chevronRight" width={18} height={18} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <button type="button" className={styles.fab} aria-label="Tambah data">
        <AppIcon name="plus" width={28} height={28} />
      </button>
    </PageContainer>
  );
}

