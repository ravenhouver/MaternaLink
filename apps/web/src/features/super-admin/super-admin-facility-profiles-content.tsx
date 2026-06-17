'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { getCurrentUser, getPuskesmas, type CurrentUser, type PuskesmasRecord } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './super-admin-dashboard.module.css';

type NavItem = {
  label: string;
  icon: AppIconName;
  href: string;
  active?: boolean;
};

type ProfileRow = {
  name: string;
  leadTime: string;
  access: string;
  score?: string;
  accessTone: 'easy' | 'medium' | 'missing';
  coldChain?: boolean;
  distance: string;
  mmr: string;
  capacity: string;
  statusTone: 'green' | 'neutral';
  action: 'Edit' | 'Complete now';
  highlighted?: boolean;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'grid', href: routes.admin },
  { label: 'Health Centers', icon: 'briefcase', href: routes.adminHealthCenters },
  { label: 'User Accounts', icon: 'users', href: routes.adminUsers },
  { label: 'Medicine List', icon: 'clipboard', href: routes.adminMedicines },
  { label: 'Facility Profiles', icon: 'archive', href: routes.adminFacilityProfiles, active: true },
];

function mapAccess(score: number): Pick<ProfileRow, 'access' | 'accessTone' | 'score'> {
  if (score >= 3) return { access: 'Easy', accessTone: 'easy', score: String(score) };
  if (score >= 2) return { access: 'Medium', accessTone: 'medium', score: String(score) };
  return { access: 'Difficult', accessTone: 'missing', score: String(score) };
}

function isIncomplete(row: PuskesmasRecord) {
  return row.leadTimeHari == null || row.jarakKeIfkKm == null || row.kapasitasSimpanObat == null;
}

function mapProfileRows(rows: PuskesmasRecord[]): ProfileRow[] {
  return rows.map((row) => {
    const access = mapAccess(row.skorAksesibilitas);
    const incomplete = isIncomplete(row);
    return {
      name: row.nama,
      leadTime: row.leadTimeHari == null ? '-' : `${row.leadTimeHari} days`,
      access: incomplete ? 'Not filled' : access.access,
      score: incomplete ? undefined : access.score,
      accessTone: incomplete ? 'missing' : access.accessTone,
      coldChain: row.coldChainReady,
      distance: row.jarakKeIfkKm == null ? '-' : `${row.jarakKeIfkKm} km`,
      mmr: row.statusEndemisMalaria ? 'Endemic area' : 'Non-endemic',
      capacity: row.kapasitasSimpanObat == null ? '-' : `${row.kapasitasSimpanObat} units`,
      statusTone: incomplete ? 'neutral' : 'green',
      action: incomplete ? 'Complete now' : 'Edit',
      highlighted: incomplete,
    };
  });
}

export function SuperAdminFacilityProfilesContent() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getCurrentUser(), getPuskesmas()])
      .then(([nextUser, puskesmasRows]) => {
        if (!mounted) return;
        setUser(nextUser);
        setRows(mapProfileRows(puskesmasRows));
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load facility profiles');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const displayName = user?.displayName ?? user?.username ?? 'Siti Aminah';
  const incompleteCount = useMemo(() => rows.filter((row) => row.highlighted).length, [rows]);

  function explainUnavailable(feature: string) {
    setNotice(`${feature} akan diaktifkan pada batch integrasi data berikutnya.`);
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Super admin navigation">
        <Link href={routes.admin} className={styles.brand} aria-label="MaternaLink super admin dashboard">
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
          <button type="button" className={styles.navItem} onClick={() => explainUnavailable('Settings')}><AppIcon name="settings" width={20} height={20} /><span>Settings</span></button>
          <button type="button" className={styles.navItem} onClick={() => explainUnavailable('Help')}><AppIcon name="info" width={20} height={20} /><span>Help</span></button>
        </div>
      </aside>

      <section className={styles.mainArea}>
        <header className={styles.topbar}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href={routes.admin}>Home</Link>
            <AppIcon name="chevronRight" width={14} height={14} />
            <strong>Facility Profiles</strong>
          </nav>
          <div className={styles.topbarActions}>
            <button className={styles.iconButton} type="button" aria-label="Notifications" onClick={() => explainUnavailable('Notifications')}><AppIcon name="bell" width={20} height={20} /><span aria-hidden="true" /></button>
            <button className={styles.iconButton} type="button" aria-label="Settings" onClick={() => explainUnavailable('Settings')}><AppIcon name="settings" width={20} height={20} /></button>
            <div className={styles.profile}>
              <span><strong>{displayName}</strong><small>Superadmin</small></span>
              <span className={styles.avatar} aria-hidden="true">SA</span>
            </div>
          </div>
        </header>

        <div className={[styles.content, styles.profileContent].join(' ')}>
          <section className={[styles.pageHeader, styles.registryHeader].join(' ')}>
            <div>
              <h1>Facility Profiles</h1>
              <p>Logistics and accessibility configuration for each health center</p>
            </div>
            <span className={styles.incompletePill}>
              <AppIcon name="alert" width={14} height={14} />
              {incompleteCount} profiles incomplete
            </span>
          </section>

          {notice ? <p role="status" className={styles.noticeText}>{notice}</p> : null}
          {error ? <p className={styles.error}>{error}. Facility profile list unavailable.</p> : null}

          <section className={styles.registryCard} aria-label="Facility profile configuration table">
            <div className={styles.tableScroller}>
              <table className={[styles.registryTable, styles.profileTable].join(' ')}>
                <thead>
                  <tr>
                    <th>Health Center</th>
                    <th>Lead Time</th>
                    <th>Accessibility</th>
                    <th>Cold Chain</th>
                    <th>Distance to IFK</th>
                    <th>MMR Area</th>
                    <th>Capacity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr className={row.highlighted ? styles.highlightedProfileRow : undefined} key={row.name}>
                      <td>
                        <span className={styles.facilityNameCell}>
                          <span className={styles.statusDot} data-tone={row.statusTone} />
                          <strong>{row.name}</strong>
                        </span>
                      </td>
                      <td>{row.leadTime}</td>
                      <td>
                        <span className={styles.accessibilityCell}>
                          <span className={styles.accessibilityBadge} data-tone={row.accessTone}>{row.access}</span>
                          {row.score ? <small>({row.score})</small> : null}
                        </span>
                      </td>
                      <td>{row.coldChain ? <span className={styles.coldChainIcon}><AppIcon name="checkCircle" width={18} height={18} /></span> : '-'}</td>
                      <td>{row.distance}</td>
                      <td>{row.mmr}</td>
                      <td>{row.capacity}</td>
                      <td>
                        {row.action === 'Complete now' ? (
                          <button type="button" className={styles.completeButton} onClick={() => explainUnavailable(`Complete ${row.name}`)}>Complete now</button>
                        ) : (
                          <button type="button" className={styles.linkButton} onClick={() => explainUnavailable(`Edit ${row.name}`)}>Edit</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 ? <tr><td colSpan={8}>Belum ada profil fasilitas dari database.</td></tr> : null}
                </tbody>
              </table>
            </div>

            <footer className={styles.registryPagination}>
              <p>Showing {rows.length} health centers</p>
              <div className={styles.pages}>
                <button type="button" aria-label="Previous page" disabled><AppIcon name="chevronLeft" width={14} height={14} /></button>
                <button type="button" className={styles.currentPage}>1</button>
                <button type="button" aria-label="Next page" disabled><AppIcon name="chevronRight" width={14} height={14} /></button>
              </div>
            </footer>
          </section>
        </div>
      </section>
    </main>
  );
}
