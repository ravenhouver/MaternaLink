'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { NotificationCenter } from '@/components/layout/notification-center';
import { RoleLogoutButton } from '@/components/layout/role-logout-button';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { getCurrentUser, getUsers, type AdminUserRecord, type CurrentUser } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './super-admin-dashboard.module.css';

type UserRoleFilter = 'All' | 'Super Admin' | 'Midwife' | 'IFK Officer';

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

const roleFilters: UserRoleFilter[] = ['All', 'Super Admin', 'Midwife', 'IFK Officer'];

function mapRole(role: AdminUserRecord['role']): AccountRow['role'] {
  if (role === 'SUPER_ADMIN') return 'Super Admin';
  if (role === 'IFK_ADMIN') return 'IFK Officer';
  return 'Midwife';
}

function userTone(role: AccountRow['role']): AccountRow['tone'] {
  if (role === 'Super Admin') return 'blue';
  if (role === 'IFK Officer') return 'green';
  return 'indigo';
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
}

function mapAccountRows(rows: AdminUserRecord[]): AccountRow[] {
  return rows.map((row) => {
    const role = mapRole(row.role);
    const name = row.displayName || row.username;
    return {
      initials: initials(name),
      name,
      role,
      facility: row.puskesmas?.nama ?? (row.role === 'IFK_ADMIN' ? 'IFK' : 'System'),
      email: row.username,
      active: row.active,
      tone: userTone(role),
    };
  });
}

export function SuperAdminUsersContent() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<UserRoleFilter>('All');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getCurrentUser(), getUsers()]).then(([nextUser, userRows]) => {
      if (!mounted) return;
      setUser(nextUser);
      setRows(mapAccountRows(userRows));
    }).catch((loadError) => {
      if (!mounted) return;
      setError(loadError instanceof Error ? loadError.message : 'Unable to load users');
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    if (activeFilter === 'All') return rows;
    return rows.filter((row) => row.role === activeFilter);
  }, [activeFilter, rows]);

  const displayName = user?.displayName ?? user?.username ?? 'Siti Aminah';

  function explainUnavailable(feature: string) {
    setNotice(`${feature} akan diaktifkan pada batch integrasi data berikutnya.`);
  }

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
          <button type="button" className={styles.navItem} onClick={() => explainUnavailable('Help')}><AppIcon name="info" width={20} height={20} /><span>Help</span></button>
          <RoleLogoutButton className={styles.navItem} />
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
            {user ? <NotificationCenter user={user} /> : null}
            <button className={styles.iconButton} type="button" aria-label="Settings" onClick={() => explainUnavailable('Settings')}><AppIcon name="settings" width={20} height={20} /></button>
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
            <button type="button" className={styles.primaryButton} onClick={() => explainUnavailable('Add user')}><AppIcon name="plus" width={16} height={16} /> Add User</button>
          </section>

          {notice ? <p role="status" className={styles.noticeText}>{notice}</p> : null}
          {error ? <p className={styles.error}>{error}. User list unavailable.</p> : null}

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
                          <button type="button" aria-label={`Edit ${row.name}`} onClick={() => explainUnavailable(`Edit ${row.name}`)}><AppIcon name="edit" width={16} height={16} /></button>
                          <button type="button" aria-label={`Delete ${row.name}`} onClick={() => explainUnavailable(`Delete ${row.name}`)}><AppIcon name="trash" width={16} height={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 ? <tr><td colSpan={6}>Belum ada user dari database untuk filter ini.</td></tr> : null}
                </tbody>
              </table>
            </div>

            <footer className={styles.registryPagination}>
              <p>Showing {filteredRows.length} of {rows.length} users</p>
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
