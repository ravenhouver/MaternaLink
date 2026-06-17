'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { getCurrentUser, getObat, type CurrentUser, type ObatRecord } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './super-admin-dashboard.module.css';

type MedicineRow = {
  id: string;
  name: string;
  unit: string;
  category: string;
  dailyDosage: string;
  coldChain: boolean;
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
  { label: 'User Accounts', icon: 'users', href: routes.adminUsers },
  { label: 'Medicine List', icon: 'clipboard', href: routes.adminMedicines, active: true },
  { label: 'Facility Profiles', icon: 'archive', href: routes.adminFacilityProfiles },
];

const fallbackRows: MedicineRow[] = [
  { id: 'OBT-001', name: 'Oxytocin 10IU', unit: 'ampul', category: 'Emergency', dailyDosage: '2.5 unit/day', coldChain: true },
  { id: 'OBT-002', name: 'MgSO4 40%', unit: 'vial', category: 'Emergency', dailyDosage: '1.2 unit/day', coldChain: true },
  { id: 'OBT-003', name: 'Tablet Fe 60mg', unit: 'strip', category: 'Essential', dailyDosage: '2.5 unit/day', coldChain: false },
  { id: 'OBT-010', name: 'Folic Acid', unit: 'tablet', category: 'Routine', dailyDosage: '1 unit/day', coldChain: false },
];

function formatDailyDosage(row: ObatRecord) {
  if (!row.dosisStandarHarian) return '-';
  return `${row.dosisStandarHarian} ${row.satuan}/day`;
}

function mapMedicineRows(rows: ObatRecord[]): MedicineRow[] {
  if (!rows.length) return fallbackRows;
  return rows.map((row) => ({
    id: row.id,
    name: row.nama,
    unit: row.satuan,
    category: row.kategori,
    dailyDosage: formatDailyDosage(row),
    coldChain: row.perluColdChain,
  }));
}

function normalizeCategory(category: string) {
  const normalized = category.trim().toLowerCase();
  if (normalized.includes('emergency') || normalized.includes('darurat')) return 'Emergency';
  if (normalized.includes('essential') || normalized.includes('esensial')) return 'Essential';
  if (normalized.includes('routine') || normalized.includes('rutin')) return 'Routine';
  return category || 'Routine';
}

function categoryTone(category: string) {
  const normalized = normalizeCategory(category);
  if (normalized === 'Emergency') return 'emergency';
  if (normalized === 'Essential') return 'essential';
  return 'routine';
}

function downloadCsv(filename: string, rows: MedicineRow[]) {
  const header = ['id', 'name', 'category', 'unit', 'dailyDosage', 'coldChain'].join(',');
  const body = rows.map((row) => [row.id, row.name, row.category, row.unit, row.dailyDosage, row.coldChain ? 'yes' : 'no'].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function SuperAdminMedicinesContent() {
  const [rows, setRows] = useState<MedicineRow[]>(fallbackRows);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([getObat(), getCurrentUser()])
      .then(([medicineRows, nextUser]) => {
        if (!mounted) return;
        setRows(mapMedicineRows(medicineRows));
        setUser(nextUser);
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load medicine data');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => ['All', ...Array.from(new Set(rows.map((row) => normalizeCategory(row.category))))], [rows]);
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      const categoryMatch = category === 'All' || normalizeCategory(row.category) === category;
      const queryMatch = !normalizedQuery || [row.id, row.name, row.unit, row.category].some((value) => value.toLowerCase().includes(normalizedQuery));
      return categoryMatch && queryMatch;
    });
  }, [category, query, rows]);

  const displayName = user?.displayName ?? user?.username ?? 'Siti Aminah';
  const totalCount = rows.length;

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
            <strong>Medicine List</strong>
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

        <div className={[styles.content, styles.registryContent, styles.medicineContent].join(' ')}>
          <section className={[styles.pageHeader, styles.registryHeader].join(' ')}>
            <div>
              <h1>Maternal Medicine Registry</h1>
              <p>Catalog of {totalCount} maternal medicines used in the system</p>
            </div>
            <button type="button" className={styles.primaryButton} onClick={() => explainUnavailable('Add medicine')}><AppIcon name="plus" width={16} height={16} /> Add Medicine</button>
          </section>

          {notice ? <p role="status" className={styles.noticeText}>{notice}</p> : null}

          <section className={styles.medicineToolbar} aria-label="Medicine filters">
            <div className={styles.medicineFilterGroup}>
              <label className={styles.searchBox}>
                <AppIcon name="search" width={18} height={18} />
                <input aria-label="Search medicine name" placeholder="Search medicine name..." value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <label className={styles.categoryFilter}>
                <span>Filter Category:</span>
                <select aria-label="Filter medicine category" value={category} onChange={(event) => setCategory(event.target.value)}>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <AppIcon name="chevronDown" width={18} height={18} />
              </label>
            </div>
            <div className={styles.toolbarIconActions}>
              <button type="button" aria-label="Open advanced filters" onClick={() => explainUnavailable('Advanced filters')}><AppIcon name="filter" width={18} height={18} /></button>
              <button type="button" aria-label="Download medicine list" onClick={() => downloadCsv('maternalink-medicines.csv', filteredRows)}><AppIcon name="download" width={18} height={18} /></button>
            </div>
          </section>

          {error ? <p className={styles.error}>{error}. Showing design fallback data.</p> : null}

          <section className={[styles.registryCard, styles.medicineCard].join(' ')} aria-label="Medicine registry table">
            <div className={styles.tableScroller}>
              <table className={[styles.registryTable, styles.medicineTable].join(' ')}>
                <thead>
                  <tr><th>ID</th><th>Name</th><th>Unit</th><th>Category</th><th>Daily Dosage</th><th>Cold Chain</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredRows.slice(0, 8).map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td><strong>{row.name}</strong></td>
                      <td>{row.unit}</td>
                      <td><span className={styles.categoryBadge} data-tone={categoryTone(row.category)}>{normalizeCategory(row.category)}</span></td>
                      <td>{row.dailyDosage}</td>
                      <td>
                        <span className={styles.coldChainStatus} data-active={row.coldChain}>
                          <AppIcon name={row.coldChain ? 'checkCircle' : 'circleStop'} width={15} height={15} />
                          {row.coldChain ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td><div className={styles.textActions}><button type="button" onClick={() => explainUnavailable(`Edit ${row.name}`)}>Edit</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className={[styles.registryPagination, styles.compactPagination].join(' ')}>
              <p>{totalCount} registered medicines</p>
              <div className={styles.pages}>
                <button type="button" disabled aria-label="Previous page"><AppIcon name="chevronLeft" width={14} height={14} /></button>
                <span>Page 1 of 1</span>
                <button type="button" disabled aria-label="Next page"><AppIcon name="chevronRight" width={14} height={14} /></button>
              </div>
            </footer>
          </section>
        </div>
      </section>
    </main>
  );
}
