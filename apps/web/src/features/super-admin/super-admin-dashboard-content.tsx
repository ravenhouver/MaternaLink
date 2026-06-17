'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { NotificationCenter } from '@/components/layout/notification-center';
import { RoleLogoutButton } from '@/components/layout/role-logout-button';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { getCurrentUser, getDashboardSummary, type CurrentUser, type DashboardSummary } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './super-admin-dashboard.module.css';

type Stat = {
  label: string;
  value: number;
  tag: string;
  icon: AppIconName;
  tone: 'blue' | 'green' | 'neutral' | 'red';
};

type NavItem = {
  label: string;
  icon: AppIconName;
  href: string;
  active?: boolean;
};

type Activity = {
  title: string;
  highlight?: string;
  detail: string;
  time: string;
  icon: AppIconName;
  tone: 'blue' | 'indigo' | 'green' | 'neutral';
};

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'grid', href: routes.admin, active: true },
  { label: 'Health Centers', icon: 'briefcase', href: routes.adminHealthCenters },
  { label: 'User Accounts', icon: 'users', href: routes.adminUsers },
  { label: 'Medicine List', icon: 'clipboard', href: routes.adminMedicines },
  { label: 'Facility Profiles', icon: 'archive', href: routes.adminFacilityProfiles },
];

const activities: Activity[] = [
  { title: 'New user added', highlight: 'dr. Sari (Health Center Cangkringan)', detail: 'Status: Awaiting document verification', time: '2 hours ago', icon: 'userPlus', tone: 'blue' },
  { title: 'Berbah Health Center profile updated', detail: 'Changes in location coordinates & operational hours', time: '5 hours ago', icon: 'edit', tone: 'indigo' },
  { title: 'Minimum stock for Oxytocin changed: 15 -> 20', detail: 'Updated by: Logistics Admin (Iwan)', time: 'Yesterday, 02:30 PM', icon: 'archive', tone: 'green' },
  { title: 'Midwife account Mlati password reset', detail: 'Reason: Forgot password & device change', time: 'Yesterday, 09:00 AM', icon: 'rotateCcw', tone: 'neutral' },
  { title: 'Pakem Health Center added to system', detail: 'Facility ID: PKM-YGY-009', time: '3 days ago', icon: 'briefcase', tone: 'blue' },
];

const fallbackMasterData = {
  healthCenters: 30,
  users: 87,
  medicines: 30,
  inactiveAccounts: 3,
};

function formatUpdatedAt(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(date);
}

export function SuperAdminDashboardContent() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

    return () => {
      mounted = false;
    };
  }, []);

  const masterData = summary?.masterData ?? fallbackMasterData;
  const stats = useMemo<Stat[]>(() => [
    { label: 'Total Health Centers', value: masterData.healthCenters, tag: '+2 this month', icon: 'briefcase', tone: 'blue' },
    { label: 'Total Users', value: masterData.users, tag: '+12 this month', icon: 'users', tone: 'green' },
    { label: 'Total Medicines', value: masterData.medicines, tag: 'Stable', icon: 'clipboard', tone: 'neutral' },
    { label: 'Inactive Accounts', value: masterData.inactiveAccounts, tag: 'Action Needed', icon: 'alert', tone: 'red' },
  ], [masterData.healthCenters, masterData.inactiveAccounts, masterData.medicines, masterData.users]);

  const displayName = user?.displayName ?? user?.username ?? 'Siti Aminah';
  const lastUpdated = updatedAt ? formatUpdatedAt(updatedAt) : '12 Oct 2023, 10:45 AM WIB';

  function explainUnavailable(feature: string) {
    setNotice(`${feature} akan diaktifkan pada batch integrasi data berikutnya.`);
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Super admin navigation">
        <Link href={routes.admin} className={styles.brand} aria-label="MaternaLink super admin dashboard">
          <span className={styles.brandIcon}><AppIcon name="briefcase" width={20} height={20} /></span>
          <span className={styles.brandText}>
            <strong>MaternaLink</strong>
            <small>SUPER ADMIN</small>
          </span>
        </Link>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link href={item.href} className={[styles.navItem, item.active ? styles.activeNav : ''].filter(Boolean).join(' ')} key={item.label}>
              <AppIcon name={item.icon} width={20} height={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.navItem} onClick={() => explainUnavailable('Help')}><AppIcon name="info" width={20} height={20} /><span>Help</span></button>
          <RoleLogoutButton className={styles.navItem} />
        </div>
      </aside>

      <section className={styles.mainArea}>
        <header className={styles.topbar}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href={routes.admin}>Home</Link>
            <AppIcon name="chevronRight" width={14} height={14} />
            <strong>Dashboard</strong>
          </nav>
          <div className={styles.topbarActions}>
            {user ? <NotificationCenter user={user} /> : null}
            <button className={styles.iconButton} type="button" aria-label="Settings" onClick={() => explainUnavailable('Settings')}>
              <AppIcon name="settings" width={20} height={20} />
            </button>
            <div className={styles.profile}>
              <span>
                <strong>{displayName}</strong>
                <small>Superadmin</small>
              </span>
              <span className={styles.avatar} aria-hidden="true">SA</span>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <section className={styles.pageHeader}>
            <div>
              <h1>Admin Dashboard</h1>
              <p>MaternaLink system master data summary</p>
            </div>
            <div className={styles.updatedAt}>
              <span>Last updated</span>
              <strong>{lastUpdated}</strong>
            </div>
          </section>

          {error ? <p className={styles.error}>{error}. Showing design fallback data.</p> : null}
          {notice ? <p role="status" className={styles.noticeText}>{notice}</p> : null}

          <section className={styles.statsGrid} aria-label="Master data summary">
            {stats.map((stat) => (
              <article className={styles.statCard} data-tone={stat.tone} key={stat.label}>
                <div className={styles.statTopline}>
                  <span className={styles.statIcon}><AppIcon name={stat.icon} width={24} height={24} /></span>
                  <span className={styles.statTag}>{stat.tag}</span>
                </div>
                <h2>{stat.label}</h2>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </section>

          <section className={styles.dashboardGrid}>
            <article className={styles.activityPanel}>
              <header className={styles.panelHeader}>
                <h2>Recent Activity</h2>
                <button type="button" onClick={() => explainUnavailable('All activity')}>All Activity</button>
              </header>

              <div className={styles.activityList}>
                {activities.map((activity) => (
                  <div className={styles.activityRow} key={`${activity.title}-${activity.time}`}>
                    <span className={styles.activityIcon} data-tone={activity.tone}><AppIcon name={activity.icon} width={18} height={18} /></span>
                    <div className={styles.activityCopy}>
                      <p>
                        <strong>{activity.title}</strong>
                        {activity.highlight ? <span> — {activity.highlight}</span> : null}
                      </p>
                      <small>{activity.detail}</small>
                    </div>
                    <time>{activity.time}</time>
                  </div>
                ))}
              </div>

              <footer className={styles.panelFooter}>
                <button type="button" onClick={() => explainUnavailable('Load more activities')}>Load 10 More Activities</button>
              </footer>
            </article>

            <aside className={styles.sidePanel} style={{ '--panel-progress': `${Math.min(100, masterData.users)}%` } as CSSProperties}>
              <h2>Account Health</h2>
              <p>{masterData.inactiveAccounts} inactive accounts need review before monthly audit.</p>
              <div className={styles.progressTrack}><span /></div>
              <Link href={routes.adminUsers}><AppIcon name="userPlus" width={18} height={18} /> Review users</Link>
            </aside>
          </section>
        </div>
      </section>
    </main>
  );
}
