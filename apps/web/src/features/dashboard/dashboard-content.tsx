'use client';

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  label: string;
  icon: AppIconName;
  href: string;
};

const quickActions: QuickAction[] = [
  { label: 'Pasien Baru', icon: 'users', href: routes.newPatient },
  { label: 'Kalender Prediksi', icon: 'calendar', href: routes.forecastCalendar },
  { label: 'Kebutuhan Obat', icon: 'plus', href: routes.medicineNeeds },
  { label: 'Pengiriman', icon: 'package', href: routes.deliveries },
];

function getAlertHref(summary: DashboardSummary | null) {
  if (!summary) return routes.patients;
  if (summary.role === 'IFK_ADMIN') return routes.ifkRecommendations;
  if ((summary.queue?.waiting ?? 0) + (summary.queue?.examining ?? 0) > 0) return routes.queue;
  if ((summary.medicine?.criticalCount ?? 0) > 0) return routes.medicineNeeds;
  return routes.patients;
}

function getAlertCopy(summary: DashboardSummary | null) {
  if (!summary) return 'Memuat ringkasan aktivitas puskesmas.';
  if (summary.role === 'IFK_ADMIN') return 'Tinjau rekomendasi distribusi yang masih menunggu keputusan.';
  if ((summary.queue?.waiting ?? 0) + (summary.queue?.examining ?? 0) > 0) return 'Proses pasien yang sedang menunggu atau dalam pemeriksaan.';
  if ((summary.medicine?.criticalCount ?? 0) > 0) return 'Periksa kebutuhan obat yang sudah masuk ambang kritis.';
  return 'Belum ada item prioritas; lanjutkan pemantauan pasien dan stok.';
}

export function DashboardContent() {
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
        setClinicName(puskesmas?.nama ?? nextUser?.puskesmasId ?? 'Puskesmas');
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
      { label: 'Total Pasien Terdaftar', value: String(summary?.patients?.total ?? 0), tag: 'Data Pasien', icon: 'users', accent: '#1a73e8' },
      { label: 'Antrean Menunggu', value: String(summary?.queue?.waiting ?? 0), tag: 'Antrean', icon: 'calendar', accent: '#006948' },
      { label: 'Sedang Diperiksa', value: String(summary?.queue?.examining ?? 0), tag: 'Aktif', icon: 'clipboard', accent: '#a33d23' },
      { label: 'Obat Perlu Restok', value: String(summary?.medicine?.criticalCount ?? 0), tag: 'Kritis', icon: 'package', accent: '#f59e0b' },
    ];
  }, [summary]);

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
          <h1>Selamat datang, {user?.displayName ?? user?.username ?? 'Bidan'}</h1>
          <p>{summary?.role === 'IFK_ADMIN' ? 'Ringkasan distribusi IFK dari data terbaru.' : `Ringkasan aktivitas ${clinicName} dari data terbaru.`}</p>
        </div>
        <div className={styles.headerActions}>
          {user ? <NotificationCenter user={user} buttonClassName={styles.bellButton} /> : null}
          <div className={styles.clinicPill} aria-label={`Puskesmas aktif: ${clinicName}`}>
            <span>{summary?.role === 'IFK_ADMIN' ? 'IFK' : clinicName}</span>
            <strong>{summary?.role === 'IFK_ADMIN' ? 'IFK' : clinicInitials}</strong>
          </div>
        </div>
      </header>

      {error ? <p className={styles.dashboardError}>{error}</p> : null}

      <section className={styles.alertBanner} aria-label="Ringkasan item prioritas">
        <div className={styles.alertCopy}>
          <span className={styles.alertIcon}>
            <AppIcon name="alert" width={28} height={28} />
          </span>
          <div>
            <h2>{attentionCount} item perlu perhatian</h2>
            <p>{getAlertCopy(summary)}</p>
          </div>
        </div>
        <Link href={alertHref} className={styles.alertButton}>Cek Sekarang</Link>
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
          <h2 className={styles.sectionTitle}><AppIcon name="zap" width={18} height={18} />Aksi Cepat</h2>
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
            <h2 className={styles.sectionTitle}>Aktivitas Terkini</h2>
            <Link href={routes.queue}>Lihat Semua</Link>
          </div>
          <div className={styles.activityCard}>
            {activities.length === 0 ? <div className={styles.activityRow}><span className={[styles.activityIcon, styles.blue].join(' ')}><AppIcon name="clipboard" width={22} height={22} /></span><span className={styles.activityText}><span><strong>Belum ada aktivitas</strong></span><small>Aktivitas antrean pasien akan tampil di sini.</small></span></div> : null}
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

      <Link href={routes.newPatient} className={styles.fab} aria-label="Tambah pasien">
        <AppIcon name="plus" width={28} height={28} />
      </Link>
    </PageContainer>
  );
}

