'use client';

import { useEffect, useMemo, useState } from 'react';
import { RoleLogoutButton } from '@/components/layout/role-logout-button';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { getIfkDecisionHistory, type IfkDecisionHistoryResponse } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './decision-history.module.css';

type Metric = { label: string; value: string; note: string; icon: AppIconName; tone: 'green' | 'blue' };
type Row = IfkDecisionHistoryResponse['rows'][number];

function downloadCsv(rows: Row[]) {
  const header = ['Tanggal', 'Petugas', 'Klinik', 'Tindakan', 'AI Prediction Stocks', 'Actual Decision'];
  const body = rows.map((row) => [row.date, row.officer, row.clinic, row.action, row.prediction, row.decision].map((value) => `"${value.replaceAll('"', '""')}"`).join(','));
  const blob = new Blob([[header.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'decision-history.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function Sidebar() {
  return (
    <aside className={styles.dhSidebar}>
      <div className={styles.dhBrand}><span><AppIcon name="briefcase" width={20} height={20} /></span><div><strong>IFK</strong><small>District Monitoring</small></div></div>
      <nav className={styles.dhNav}>
        <a href={routes.ifk}><AppIcon name="home" width={20} height={20} />Dashboard</a>
        <a className={styles.dhNavActive} href={routes.ifkRecommendations}><AppIcon name="userPlus" width={20} height={20} />Distribution</a>
        <a href={routes.ifkClinics}><AppIcon name="users" width={20} height={20} />Clinic List</a>
        <a href={routes.ifkEnvironment}><AppIcon name="calendar" width={20} height={20} />Environment Monitoring</a>
      </nav>
      <div className={styles.dhSidebarFooter}>
        <RoleLogoutButton className={styles.dhLogoutButton} />
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className={styles.dhTopbar}>
      <div className={styles.dhCrumbs}><span>Home</span><AppIcon name="chevronRight" width={14} height={14} /><span>IFK</span><AppIcon name="chevronRight" width={14} height={14} /><strong>Riwayat Keputusan</strong></div>
      <div className={styles.dhTopActions}><button type="button" aria-label="Notifikasi IFK" disabled><AppIcon name="bell" width={18} height={18} /></button><button type="button" aria-label="Pengaturan IFK" disabled><AppIcon name="settings" width={18} height={18} /></button><span /><div><strong>IFK Operations</strong><small>Audit Ledger</small></div><b>IF</b></div>
    </header>
  );
}

function MetricCard({ item }: { item: Metric }) {
  return <article className={styles.dhMetric}><div><span>{item.label}</span><AppIcon className={styles[item.tone]} name={item.icon} width={22} height={22} /></div><strong>{item.value}</strong><p className={styles[item.tone]}>{item.note}</p></article>;
}

export function DecisionHistoryContent() {
  const [ledgerRows, setLedgerRows] = useState<Row[]>([]);
  const [query, setQuery] = useState('');
  const [bars, setBars] = useState<IfkDecisionHistoryResponse['bars']>([]);
  const [compliance, setCompliance] = useState<IfkDecisionHistoryResponse['compliance'] | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: 'Stockouts Prevented', value: '0', note: 'Loaded from decisions', icon: 'settings', tone: 'green' },
    { label: 'Approved Decisions', value: '0', note: 'IFK recommendations', icon: 'clock', tone: 'blue' },
    { label: 'Total Dispatches', value: '0', note: 'Distribution records', icon: 'truck', tone: 'blue' },
  ]);

  useEffect(() => {
    getIfkDecisionHistory()
      .then((history) => {
        setLedgerRows(history.rows);
        setBars(history.bars);
        setCompliance(history.compliance);
        setMetrics(history.metrics.map((item) => ({ ...item, icon: item.icon as AppIconName })));
      })
      .catch(() => undefined);
  }, []);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return ledgerRows;
    return ledgerRows.filter((row) => [row.officer, row.clinic, row.action, row.decision].some((value) => value.toLowerCase().includes(normalized)));
  }, [ledgerRows, query]);

  return (
    <div className={styles.dhShell}>
      <Sidebar />
      <div className={styles.dhWorkspace}>
        <Topbar />
        <main className={styles.dhPage}>
          <section className={styles.dhHeader}><div><p>Operational Ledger</p><h1>Riwayat Keputusan</h1></div><div><button type="button" onClick={() => downloadCsv(filteredRows)}><AppIcon name="fileText" width={14} height={14} />Export CSV</button><button type="button" onClick={() => window.print()}><AppIcon name="fileText" width={14} height={14} />Print PDF</button></div></section>
          <section className={styles.dhMetrics}>{metrics.map((item) => <MetricCard item={item} key={item.label} />)}</section>
          <section className={styles.dhTablePanel}>
            <div className={styles.dhTableHeader}><h2>Chronological Intelligence Log</h2><div><label><AppIcon name="search" width={14} height={14} /><input aria-label="Search Petugas or Klinik" placeholder="Search Petugas or Klinik..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><button type="button" onClick={() => setLedgerRows((current) => [...current].sort((a, b) => a.clinic.localeCompare(b.clinic)))}><AppIcon name="filter" width={14} height={14} />Sort <AppIcon name="chevronDown" width={14} height={14} /></button></div></div>
            <div className={styles.dhScroller}><table className={styles.dhTable}><thead><tr><th>Tanggal</th><th>Petugas</th><th>Klinik</th><th>Tindakan</th><th>AI Prediction Stocks</th><th>Actual Decision</th></tr></thead><tbody>{filteredRows.length === 0 ? <tr><td colSpan={6}>Belum ada riwayat keputusan.</td></tr> : null}{filteredRows.map((row) => <tr key={row.id}><td>{new Date(row.date).toLocaleString('id-ID')}</td><td>{row.officer}</td><td>{row.clinic}</td><td>{row.action}</td><td className={styles.predictionCell}>{row.prediction}</td><td className={styles[row.tone]}>{row.decision}</td></tr>)}</tbody></table></div>
            <div className={styles.dhPagination}><span>Showing entries {filteredRows.length}</span><div><button type="button" disabled><AppIcon name="chevronLeft" width={14} height={14} /></button><button type="button" className={styles.current}>1</button><button type="button" disabled><AppIcon name="chevronRight" width={14} height={14} /></button></div></div>
          </section>
          <section className={styles.dhBottomGrid}>
            <article className={styles.dhChart}><div><h2>Audit Trail Analysis</h2><p>Deviation distribution from stored IFK decisions</p><span><i />Matched <b />Deviated</span></div><div className={styles.dhBars}>{bars.map((bar) => <div key={bar.day}><span style={{ height: `${bar.green}px` }} /><b style={{ height: `${bar.red}px` }} /><small>{bar.day}</small></div>)}</div></article>
            <aside className={styles.dhCompliance}><span><AppIcon name="shield" width={24} height={24} /></span><h2>Compliance Rating {compliance ? `${compliance.rating}%` : ''}</h2><p>{compliance?.summary ?? 'Belum ada data keputusan final.'}</p><div><small>Primary Deviation Factor</small><strong>{compliance?.primaryDeviationFactor ?? 'Belum tersedia'}</strong></div></aside>
          </section>
        </main>
      </div>
    </div>
  );
}
