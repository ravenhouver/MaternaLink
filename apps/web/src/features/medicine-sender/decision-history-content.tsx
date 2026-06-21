'use client';

import { useEffect, useMemo, useState } from 'react';
import { RoleLogoutButton } from '@/components/layout/role-logout-button';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { getIfkDecisionHistory, type IfkDecisionHistoryResponse } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './decision-history.module.css';

type Metric = { label: string; value: string; note: string; icon: AppIconName; tone: 'green' | 'blue' };
type Row = IfkDecisionHistoryResponse['rows'][number];

const CHART_MAX_HEIGHT = 176;
const CHART_MIN_SEGMENT_HEIGHT = 8;

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
  const [message, setMessage] = useState<string | null>(null);
  return (
    <header className={styles.dhTopbar}>
      <div className={styles.dhCrumbs}><span>Home</span><AppIcon name="chevronRight" width={14} height={14} /><span>IFK</span><AppIcon name="chevronRight" width={14} height={14} /><strong>Riwayat Keputusan</strong></div>
      <div className={styles.dhTopActions}><button type="button" aria-label="Notifikasi IFK" onClick={() => setMessage('Riwayat keputusan diperbarui dari event rekomendasi IFK.')}><AppIcon name="bell" width={18} height={18} /></button><span /><div><strong>IFK Operations</strong><small>Audit Ledger</small></div><b>IF</b></div>
      {message ? <p role="status">{message}</p> : null}
    </header>
  );
}

function MetricCard({ item }: { item: Metric }) {
  return <article className={styles.dhMetric}><div><span>{item.label}</span><AppIcon className={styles[item.tone]} name={item.icon} width={22} height={22} /></div><strong>{item.value}</strong><p className={styles[item.tone]}>{item.note}</p></article>;
}

export function DecisionHistoryContent() {
  const [ledgerRows, setLedgerRows] = useState<Row[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
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

  const chartBars = useMemo(() => {
    const maxTotal = Math.max(1, ...bars.map((bar) => bar.green + bar.red));
    return bars.map((bar) => {
      const total = bar.green + bar.red;
      const scaledTotal = total === 0 ? 0 : Math.max(CHART_MIN_SEGMENT_HEIGHT, Math.round((total / maxTotal) * CHART_MAX_HEIGHT));
      const greenHeight = total === 0 ? 0 : Math.round((bar.green / total) * scaledTotal);
      const redHeight = total === 0 ? 0 : scaledTotal - greenHeight;
      return {
        ...bar,
        greenHeight: bar.green > 0 ? Math.max(CHART_MIN_SEGMENT_HEIGHT, greenHeight) : 0,
        redHeight: bar.red > 0 ? Math.max(CHART_MIN_SEGMENT_HEIGHT, redHeight) : 0,
        total,
      };
    });
  }, [bars]);

  const hasChartData = chartBars.some((bar) => bar.total > 0);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className={styles.dhShell}>
      <Sidebar />
      <div className={styles.dhWorkspace}>
        <Topbar />
        <main className={styles.dhPage}>
          <section className={styles.dhHeader}><div><p>Operational Ledger</p><h1>Riwayat Keputusan</h1></div><div><button type="button" onClick={() => downloadCsv(filteredRows)}><AppIcon name="fileText" width={14} height={14} />Export CSV</button><button type="button" onClick={() => window.print()}><AppIcon name="fileText" width={14} height={14} />Print PDF</button></div></section>
          <section className={styles.dhMetrics}>{metrics.map((item) => <MetricCard item={item} key={item.label} />)}</section>
          <section className={styles.dhTablePanel}>
            <div className={styles.dhTableHeader}><h2>Chronological Intelligence Log</h2><div><label><AppIcon name="search" width={14} height={14} /><input aria-label="Search Petugas or Klinik" placeholder="Search Petugas or Klinik..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label><button type="button" onClick={() => setLedgerRows((current) => [...current].sort((a, b) => a.clinic.localeCompare(b.clinic)))}><AppIcon name="filter" width={14} height={14} />Sort <AppIcon name="chevronDown" width={14} height={14} /></button></div></div>
            <div className={styles.dhScroller}><table className={styles.dhTable}><thead><tr><th>Tanggal</th><th>Petugas</th><th>Klinik</th><th>Tindakan</th><th>AI Prediction Stocks</th><th>Actual Decision</th></tr></thead><tbody>{filteredRows.length === 0 ? <tr><td colSpan={6}>Belum ada riwayat keputusan.</td></tr> : null}{pageRows.map((row) => <tr key={row.id}><td>{new Date(row.date).toLocaleString('id-ID')}</td><td>{row.officer}</td><td>{row.clinic}</td><td>{row.action}</td><td className={styles.predictionCell}>{row.prediction}</td><td className={styles[row.tone]}>{row.decision}</td></tr>)}</tbody></table></div>
            <div className={styles.dhPagination}><span>Showing entries {pageRows.length} of {filteredRows.length}</span><div><button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><AppIcon name="chevronLeft" width={14} height={14} /></button><button type="button" className={styles.current}>{safePage}</button><button type="button" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><AppIcon name="chevronRight" width={14} height={14} /></button></div></div>
          </section>
          <section className={styles.dhBottomGrid}>
            <article className={styles.dhChart}><div><h2>Audit Trail Analysis</h2><p>Deviation distribution from stored IFK decisions</p><span><i />Matched <b />Deviated</span></div><div className={styles.dhBars} aria-label="Audit trail analysis chart">{hasChartData ? chartBars.map((bar) => <div key={bar.day} title={`${bar.day}: ${bar.green} matched, ${bar.red} deviated`}><span style={{ height: `${bar.greenHeight}px` }} /><b style={{ height: `${bar.redHeight}px` }} /><small>{bar.day}</small></div>) : <p className={styles.dhChartEmpty}>Belum ada keputusan final untuk dianalisis.</p>}</div></article>
            <aside className={styles.dhCompliance}><span><AppIcon name="shield" width={24} height={24} /></span><h2>Compliance Rating {compliance ? `${compliance.rating}%` : ''}</h2><p>{compliance?.summary ?? 'Belum ada data keputusan final.'}</p><div><small>Primary Deviation Factor</small><strong>{compliance?.primaryDeviationFactor ?? 'Belum tersedia'}</strong></div></aside>
          </section>
        </main>
      </div>
    </div>
  );
}
