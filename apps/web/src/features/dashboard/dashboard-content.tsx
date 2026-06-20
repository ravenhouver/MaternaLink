'use client';

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import { NotificationCenter } from '@/components/layout/notification-center';
import { getCurrentUser, getDashboardSummary, getPuskesmas, getQueue, getRecommendations, type CurrentUser, type DashboardSummary } from '@/lib/api';
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
  labelKey: string;
  icon: AppIconName;
  href: string;
};

const quickActions: QuickAction[] = [
  { labelKey: 'newPatient', icon: 'users', href: routes.newPatient },
  { labelKey: 'forecastCalendar', icon: 'calendar', href: routes.forecastCalendar },
  { labelKey: 'medicineNeeds', icon: 'plus', href: routes.medicineNeeds },
  { labelKey: 'deliveries', icon: 'package', href: routes.deliveries },
];

function getAlertHref(summary: DashboardSummary | null) {
  if (!summary) return routes.patients;
  if (summary.role === 'IFK_ADMIN') return routes.ifkRecommendations;
  if ((summary.queue?.waiting ?? 0) + (summary.queue?.examining ?? 0) > 0) return routes.queue;
  if ((summary.medicine?.criticalCount ?? 0) > 0) return routes.medicineNeeds;
  return routes.patients;
}

function getAlertCopyKey(summary: DashboardSummary | null) {
  if (!summary) return 'loadingSummary';
  if (summary.role === 'IFK_ADMIN') return 'reviewDistribution';
  if ((summary.queue?.waiting ?? 0) + (summary.queue?.examining ?? 0) > 0) return 'processQueue';
  if ((summary.medicine?.criticalCount ?? 0) > 0) return 'checkCriticalMedicine';
  return 'noPriority';
}

export function DashboardContent() {
  const t = useTranslations('dashboard');
  const tNav = useTranslations('nav');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [clinicName, setClinicName] = useState<string>('Puskesmas');
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getDashboardSummary(), getCurrentUser()])
      .then(async ([nextSummary, nextUser]) => {
        const isBidan = nextSummary.role === 'BIDAN_PUSKESMAS';
        const [queueRows, recommendations, puskesmasRows] = await Promise.all([
          isBidan ? getQueue({ puskesmasId: nextUser?.puskesmasId ?? undefined }).catch(() => []) : Promise.resolve([]),
          nextSummary.role === 'IFK_ADMIN' ? getRecommendations().catch(() => []) : Promise.resolve([]),
          isBidan && nextUser?.puskesmasId ? getPuskesmas().catch(() => []) : Promise.resolve([]),
        ]);
        if (!mounted) return;
        setSummary(nextSummary);
        setUser(nextUser);
        const puskesmas = puskesmasRows.find((row) => row.id === nextUser?.puskesmasId);
        setClinicName(puskesmas?.nama ?? nextUser?.puskesmasId ?? t('defaultClinic'));
        setActivities(buildDashboardActivities(queueRows, recommendations));
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : t('loadError'));
      });
    return () => { mounted = false; };
  }, []);

  const statCards = useMemo<StatCard[]>(() => {
    if (summary?.role === 'IFK_ADMIN') {
      return [
        { label: t('stats.pendingRecommendations'), value: String(summary.recommendations?.pending ?? 0), tag: t('tags.needsReview'), icon: 'clipboard', accent: '#1a73e8' },
        { label: t('stats.approvedRecommendations'), value: String(summary.recommendations?.approved ?? 0), tag: t('tags.approved'), icon: 'heart', accent: '#006948' },
        { label: t('stats.rejectedRecommendations'), value: String(summary.recommendations?.rejected ?? 0), tag: t('tags.rejected'), icon: 'alert', accent: '#a33d23' },
        { label: t('stats.activeDeliveries'), value: String(summary.deliveries?.active ?? 0), tag: t('tags.inProgress'), icon: 'package', accent: '#f59e0b' },
      ];
    }
    return [
      { label: t('stats.totalPatients'), value: String(summary?.patients?.total ?? 0), tag: t('tags.patientData'), icon: 'users', accent: '#1a73e8' },
      { label: t('stats.waitingQueue'), value: String(summary?.queue?.waiting ?? 0), tag: t('tags.queue'), icon: 'calendar', accent: '#006948' },
      { label: t('stats.examining'), value: String(summary?.queue?.examining ?? 0), tag: t('tags.active'), icon: 'clipboard', accent: '#a33d23' },
      { label: t('stats.criticalMedicine'), value: String(summary?.medicine?.criticalCount ?? 0), tag: t('tags.critical'), icon: 'package', accent: '#f59e0b' },
    ];
  }, [summary, t]);

  const attentionCount = getDashboardAttentionCount(summary);
  const alertHref = getAlertHref(summary);
  const clinicInitials = clinicName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'PKM';

  return (
    <PageContainer size="wide" className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t('welcome', { name: user?.displayName ?? user?.username ?? t('defaultUser') })}</h1>
          <p>{summary?.role === 'IFK_ADMIN' ? t('ifkSummary') : t('clinicSummary', { clinic: clinicName })}</p>
        </div>
        <div className={styles.headerActions}>
          {user ? <NotificationCenter user={user} buttonClassName={styles.bellButton} /> : null}
          <div className={styles.clinicPill} aria-label={t('activeClinic', { clinic: clinicName })}>
            <span>{summary?.role === 'IFK_ADMIN' ? 'IFK' : clinicName}</span>
            <strong>{summary?.role === 'IFK_ADMIN' ? 'IFK' : clinicInitials}</strong>
          </div>
        </div>
      </header>

      {error ? <p className={styles.dashboardError}>{error}</p> : null}

      <section className={styles.alertBanner} aria-label={t('prioritySummary')}>
        <div className={styles.alertCopy}>
          <span className={styles.alertIcon}>
            <AppIcon name="alert" width={28} height={28} />
          </span>
          <div>
            <h2>{t('attentionTitle', { count: attentionCount })}</h2>
            <p>{t(`alerts.${getAlertCopyKey(summary)}`)}</p>
          </div>
        </div>
        <Link href={alertHref} className={styles.alertButton}>{t('checkNow')}</Link>
      </section>

      <section className={styles.statsGrid} aria-label={t('metricsLabel')}>
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
          <h2 className={styles.sectionTitle}><AppIcon name="zap" width={18} height={18} />{t('quickActions')}</h2>
          <div className={styles.quickGrid}>
            {quickActions.map((action) => (
              <Link href={action.href} className={styles.quickAction} key={action.labelKey}>
                <span><AppIcon name={action.icon} width={24} height={24} /></span>
                {tNav(action.labelKey)}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.activityColumn}>
          <div className={styles.activityHeader}>
            <h2 className={styles.sectionTitle}>{t('recentActivity')}</h2>
            <Link href={routes.queue}>{t('viewAll')}</Link>
          </div>
          <div className={styles.activityCard}>
            {activities.length === 0 ? <div className={styles.activityRow}><span className={[styles.activityIcon, styles.blue].join(' ')}><AppIcon name="clipboard" width={22} height={22} /></span><span className={styles.activityText}><span><strong>{t('emptyActivityTitle')}</strong></span><small>{t('emptyActivityBody')}</small></span></div> : null}
            {activities.map((activity) => (
              <Link href={activity.href} className={styles.activityRow} key={activity.key}>
                <span className={[styles.activityIcon, styles[activity.tone]].join(' ')}>
                  <AppIcon name={activity.icon} width={22} height={22} />
                </span>
                <span className={styles.activityText}>
                  <span><strong>{activity.name}</strong> - {activity.title}</span>
                  <small>{activity.meta}</small>
                </span>
                <AppIcon name="chevronRight" width={18} height={18} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Link href={routes.newPatient} className={styles.fab} aria-label={tNav('newPatient')}>
        <AppIcon name="plus" width={28} height={28} />
      </Link>
    </PageContainer>
  );
}

