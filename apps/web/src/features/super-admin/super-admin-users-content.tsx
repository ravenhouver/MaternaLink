'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { getCurrentUser, type CurrentUser } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './super-admin-dashboard.module.css';

type UserRoleFilter = 'All' | 'Doctor' | 'Midwife' | 'Staff' | 'IFK Officer';

type AccountRow = {
  initials: string;
  name: string;
  role: Exclude<UserRoleFilter, 'All'>;
  facility: string;
  email: string;
  active: boolean;
  tone: 'blue' | 'indigo' | 'green';
};

type NavItem = {
  label: string;
  icon: AppIconName;
  href: string;
  active?: boolean;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'grid', href: routes.admin },
  { label: 'Health Centers', icon: 'briefcase', href: routes.adminHealthCenters },
  { label: 'User Accounts', icon: 'users', href: routes.adminUsers, active: true },
  { label: 'Medicine List', icon: 'clipboard', href: routes.adminMedicines },
  { label: 'Facility Profiles', icon: 'archive', href: routes.adminFacilityProfiles },
];

const roleFilters: UserRoleFilter[] = ['All', 'Doctor', 'Midwife', 'Staff', 'IFK Officer'];

const accountRows: AccountRow[] = [
  { initials: 'SA', name: 'dr. Siti Aminah', role: 'Doctor', facility: 'Pkm. Cangkringan', email: 'siti@pkm-cgk.id', active: true, tone: 'blue' },
  { initials: 'MU', name: 'Bd. Maria Ulfa', role: 'Midwife', facility: 'Pkm. Berbah', email: 'maria@pkm-brb.id', active: true, tone: 'indigo' },
  { initials: 'SW', name: 'Apt. Sarah W.', role: 'IFK Officer', facility: 'IFK Kab. Sleman', email: 'sarah@ifk-slm.id', active: true, tone: 'green' },
];

export function SuperAdminUsersContent() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [activeFilter, setActiveFilter] = useState<UserRoleFilter>('All');

  useEffect(() => {
    let mounted = true;
    getCurrentUser().then((nextUser) => {
      if (!mounted) return;
      setUser(nextUser);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    if (activeFilter === 'All') return accountRows;
    return accountRows.filter((row) => row.role === activeFilter);
  }, [activeFilter]);

  const displayName = user?.displayName ?? user?.username ?? 'Siti Aminah';

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Super admin navigation">
        <Link href={routes.admin} className={styles.brand} aria-label="MaternaLink super admin dashboard">
          <span className={styles.brandIcon}><AppIcon name="grid" width={20} height={20} /></span>
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
            <strong>User Accounts</strong>
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

        <div className={[styles.content, styles.usersContent].join(' ')}>
          <section className={[styles.pageHeader, styles.registryHeader].join(' ')}>
            <div>
              <h1>User Accounts</h1>
              <p>Manage healthcare personnel and IFK officer accounts</p>
            </div>
            <button type="button" className={styles.primaryButton}><AppIcon name="plus" width={16} height={16} /> Add User</button>
          </section>

          <section className={styles.userCard} aria-label="User account table">
            <div className={styles.roleTabs} role="tablist" aria-label="User role filters">
              {roleFilters.map((filter) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === filter}
                  className={activeFilter === filter ? styles.activeTab : undefined}
                  onClick={() => setActiveFilter(filter)}
                  key={filter}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className={styles.tableScroller}>
              <table className={[styles.registryTable, styles.userTable].join(' ')}>
                <thead>
                  <tr><th>Name</th><th>Role</th><th>Facility</th><th>Email</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.email}>
                      <td>
                        <span className={styles.userNameCell}>
                          <span className={styles.userInitials} data-tone={row.tone}>{row.initials}</span>
                          <strong>{row.name}</strong>
                        </span>
                      </td>
                      <td>{row.role}</td>
                      <td>{row.facility}</td>
                      <td><em>{row.email}</em></td>
                      <td><span className={row.active ? styles.activeBadge : styles.inactiveBadge}>{row.active ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div className={styles.iconActions}>
                          <button type="button" aria-label={`Edit ${row.name}`}><AppIcon name="edit" width={16} height={16} /></button>
                          <button type="button" aria-label={`Delete ${row.name}`}><AppIcon name="trash" width={16} height={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className={styles.registryPagination}>
              <p>Showing {filteredRows.length} of 124 users</p>
              <div className={styles.pages}>
                <button type="button" aria-label="Previous page"><AppIcon name="chevronLeft" width={14} height={14} /></button>
                <button type="button" className={styles.currentPage}>1</button>
                <button type="button">2</button>
                <button type="button">3</button>
                <button type="button" aria-label="Next page"><AppIcon name="chevronRight" width={14} height={14} /></button>
              </div>
            </footer>
          </section>
        </div>
      </section>
    </main>
  );
}
