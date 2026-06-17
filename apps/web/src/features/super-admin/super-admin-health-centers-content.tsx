'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { RoleLogoutButton } from '@/components/layout/role-logout-button';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { getCurrentUser, getPuskesmas, syncAiMasterData, type CurrentUser, type PuskesmasRecord } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './super-admin-dashboard.module.css';

type RegistryRow = {
  id: string;
  name: string;
  district: string;
  active: boolean;
  users: number;
  muted?: boolean;
  actions: 'text' | 'icons' | 'single';
};

type NavItem = {
  label: string;
  icon: AppIconName;
  href: string;
  active?: boolean;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'grid', href: routes.admin },
  { label: 'Health Centers', icon: 'briefcase', href: routes.adminHealthCenters, active: true },
  { label: 'User Accounts', icon: 'users', href: routes.adminUsers },
  { label: 'Medicine List', icon: 'clipboard', href: routes.adminMedicines },
  { label: 'Facility Profiles', icon: 'archive', href: routes.adminFacilityProfiles },
];

function mapPuskesmasRows(rows: PuskesmasRecord[]): RegistryRow[] {
  return rows.map((row, index) => ({
    id: row.id,
    name: row.nama,
    district: row.kecamatan,
    active: true,
    users: index === 0 ? 4 : index === 1 ? 3 : Math.max(1, 5 - index),
    actions: index === 1 ? 'icons' : index > 2 ? 'single' : 'text',
    muted: index > 2,
  }));
}

export function SuperAdminHealthCentersContent() {
  const [rows, setRows] = useState<RegistryRow[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([getPuskesmas(), getCurrentUser()])
      .then(([puskesmasRows, nextUser]) => {
        if (!mounted) return;
        setRows(mapPuskesmasRows(puskesmasRows));
        setUser(nextUser);
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load health centers');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter((row) => [row.id, row.name, row.district].some((value) => value.toLowerCase().includes(normalizedQuery)));
  }, [query, rows]);

  const totalCount = rows.length;
  const displayName = user?.displayName ?? user?.username ?? 'Siti Aminah';

  function explainUnavailable(feature: string) {
    setNotice(`${feature} akan diaktifkan pada batch integrasi data berikutnya.`);
  }

  async function syncMasterData() {
    setIsSyncing(true);
    setError(null);
    setNotice('Sinkronisasi master data AI sedang berjalan.');
    try {
      const result = await syncAiMasterData();
      const puskesmasRows = await getPuskesmas();
      setRows(mapPuskesmasRows(puskesmasRows));
      setNotice(`Master data AI tersinkron: ${result.puskesmas} puskesmas, ${result.obat} obat, ${result.kondisi} kondisi.`);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Gagal sinkronisasi master data AI');
    } finally {
      setIsSyncing(false);
    }
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
          <RoleLogoutButton className={styles.navItem} />
        </div>
      </aside>

      <section className={styles.mainArea}>
        <header className={styles.topbar}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href={routes.admin}>Home</Link>
            <AppIcon name="chevronRight" width={14} height={14} />
            <strong>Health Centers</strong>
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

        <div className={[styles.content, styles.registryContent].join(' ')}>
          <section className={[styles.pageHeader, styles.registryHeader].join(' ')}>
            <div>
              <h1>Health Center Registry</h1>
              <p>Manage healthcare facility data within the system</p>
            </div>
            <div className={styles.registryActions}>
              <label className={styles.searchBox}>
                <AppIcon name="search" width={18} height={18} />
                <input aria-label="Search health center name" placeholder="Search health center name..." value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <button type="button" className={styles.primaryButton} disabled={isSyncing} onClick={() => void syncMasterData()}><AppIcon name="download" width={16} height={16} /> {isSyncing ? 'Syncing AI Data' : 'Sync AI Master'}</button>
              <button type="button" className={styles.primaryButton} onClick={() => explainUnavailable('Add health center')}><AppIcon name="plus" width={16} height={16} /> Add Health Center</button>
            </div>
          </section>

          {notice ? <p role="status" className={styles.noticeText}>{notice}</p> : null}

          {error ? <p className={styles.error}>{error}. Health center list unavailable.</p> : null}

          <section className={styles.registryCard} aria-label="Health center registry table">
            <div className={styles.tableScroller}>
              <table className={styles.registryTable}>
                <thead>
                  <tr><th>ID</th><th>Name</th><th>District</th><th>Status</th><th>Users</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr className={row.muted ? styles.mutedRow : undefined} key={row.id}>
                      <td><strong className={styles.registryId}>{row.id}</strong></td>
                      <td><strong>{row.name}</strong></td>
                      <td>{row.district}</td>
                      <td><span className={row.active ? styles.activeBadge : styles.inactiveBadge}>{row.active ? 'Active' : 'Inactive'}</span></td>
                      <td>{row.users} users</td>
                      <td>{renderActions(row, explainUnavailable)}</td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 ? <tr><td colSpan={6}>Belum ada puskesmas dari database untuk filter ini.</td></tr> : null}
                </tbody>
              </table>
            </div>

            <footer className={styles.registryPagination}>
              <p>Showing <strong>{filteredRows.length}</strong> of <strong>{totalCount}</strong> health centers</p>
              <div className={styles.pages}>
                <button type="button" disabled aria-label="Previous page"><AppIcon name="chevronLeft" width={14} height={14} /></button>
                <button type="button" className={styles.currentPage}>1</button>
                <button type="button" disabled aria-label="Next page"><AppIcon name="chevronRight" width={14} height={14} /></button>
              </div>
            </footer>
          </section>
        </div>
      </section>
    </main>
  );
}

function renderActions(row: RegistryRow, explainUnavailable: (feature: string) => void) {
  if (row.actions === 'icons') {
    return (
      <div className={styles.iconActions}>
        <button type="button" aria-label={`Edit ${row.name}`} onClick={() => explainUnavailable(`Edit ${row.name}`)}><AppIcon name="edit" width={16} height={16} /></button>
        <button type="button" aria-label={`View ${row.name}`} onClick={() => explainUnavailable(`Detail ${row.name}`)}><AppIcon name="eye" width={17} height={17} /></button>
        <button type="button" aria-label={`Deactivate ${row.name}`} onClick={() => explainUnavailable(`Deactivate ${row.name}`)}><AppIcon name="circleStop" width={17} height={17} /></button>
      </div>
    );
  }

  if (row.actions === 'single') return <div className={styles.textActions}><button type="button" onClick={() => explainUnavailable(`Edit ${row.name}`)}>Edit</button></div>;

  return (
    <div className={styles.textActions}>
      <button type="button" onClick={() => explainUnavailable(`Edit ${row.name}`)}>Edit</button>
      <button type="button" onClick={() => explainUnavailable(`Detail ${row.name}`)}>Detail</button>
      <button type="button" data-danger={!row.active} onClick={() => explainUnavailable(`${row.active ? 'Deactivate' : 'Activate'} ${row.name}`)}>{row.active ? 'Deactivate' : 'Activate'}</button>
    </div>
  );
}
