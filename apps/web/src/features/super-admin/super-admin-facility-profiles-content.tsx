'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { getCurrentUser, type CurrentUser } from '@/lib/api';
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

const profileRows: ProfileRow[] = [
  {
    name: 'Pkm. Cangkringan',
    leadTime: '7 days',
    access: 'Medium',
    score: '0.6',
    accessTone: 'medium',
    coldChain: true,
    distance: '24 km',
    mmr: '490/100k',
    capacity: '500 units',
    statusTone: 'green',
    action: 'Edit',
  },
  {
    name: 'Pkm. Berbah',
    leadTime: '3 days',
    access: 'Easy',
    score: '0.9',
    accessTone: 'easy',
    coldChain: true,
    distance: '12 km',
    mmr: '320/100k',
    capacity: '800 units',
    statusTone: 'green',
    action: 'Edit',
  },
  {
    name: 'Pkm. Pakem',
    leadTime: '-',
    access: 'Not filled',
    accessTone: 'missing',
    distance: '-',
    mmr: '-',
    capacity: '-',
    statusTone: 'neutral',
    action: 'Complete now',
    highlighted: true,
  },
];

export function SuperAdminFacilityProfilesContent() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let mounted = true;
    getCurrentUser()
      .then((nextUser) => {
        if (!mounted) return;
        setUser(nextUser);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const displayName = user?.displayName ?? user?.username ?? 'Siti Aminah';

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
          <a href="#settings" className={styles.navItem}><AppIcon name="settings" width={20} height={20} /><span>Settings</span></a>
          <a href="#help" className={styles.navItem}><AppIcon name="info" width={20} height={20} /><span>Help</span></a>
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
            <button className={styles.iconButton} type="button" aria-label="Notifications"><AppIcon name="bell" width={20} height={20} /><span aria-hidden="true" /></button>
            <button className={styles.iconButton} type="button" aria-label="Settings"><AppIcon name="settings" width={20} height={20} /></button>
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
              2 profiles incomplete
            </span>
          </section>

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
                  {profileRows.map((row) => (
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
                          <button type="button" className={styles.completeButton}>Complete now</button>
                        ) : (
                          <button type="button" className={styles.linkButton}>Edit</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className={styles.registryPagination}>
              <p>Showing 3 of 42 health centers</p>
              <div className={styles.pages}>
                <button type="button" aria-label="Previous page"><AppIcon name="chevronLeft" width={14} height={14} /></button>
                <button type="button" aria-label="Next page"><AppIcon name="chevronRight" width={14} height={14} /></button>
              </div>
            </footer>
          </section>
        </div>
      </section>
    </main>
  );
}
