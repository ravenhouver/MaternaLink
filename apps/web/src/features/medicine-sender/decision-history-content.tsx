'use client';

import { useEffect, useMemo, useState } from 'react';
import { RoleLogoutButton } from '@/components/layout/role-logout-button';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { getRecommendations } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './decision-history.module.css';

type Metric = { label: string; value: string; note: string; icon: AppIconName; tone: 'green' | 'blue' };
type Row = { date: string; officer: string; clinic: string; action: string; prediction: string; decision: string; tone?: 'red' | 'green' };

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
      <div className={styles.dhCrumbs}><span>Home</span><AppIcon name="chevronRight" width={14} height={14} /><span>Patient List</span><AppIcon name="chevronRight" width={14} height={14} /><strong>Add New Patient</strong></div>
      <div className={styles.dhTopActions}><button type="button" aria-label="Notifikasi IFK"><AppIcon name="bell" width={18} height={18} /><i /></button><button type="button" aria-label="Pengaturan IFK"><AppIcon name="settings" width={18} height={18} /></button><span /><div><strong>Pharmacy Management</strong><small>Administrator</small></div><b>PM</b></div>
    </header>
  );
}

function MetricCard({ item }: { item: Metric }) {
  return <article className={styles.dhMetric}><div><span>{item.label}</span><AppIcon className={styles[item.tone]} name={item.icon} width={22} height={22} /></div><strong>{item.value}</strong><p className={styles[item.tone]}>{item.note}</p></article>;
}

export function DecisionHistoryContent() {
  const [ledgerRows, setLedgerRows] = useState<Row[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: 'Stockouts Prevented', value: '0', note: 'Loaded from decisions', icon: 'settings', tone: 'green' },
    { label: 'Approved Decisions', value: '0', note: 'IFK recommendations', icon: 'clock', tone: 'blue' },
    { label: 'Total Dispatches', value: '0', note: 'Distribution records', icon: 'truck', tone: 'blue' },
  ]);

  useEffect(() => {
    getRecommendations()
      .then((recommendations) => {
        const finalRows = recommendations
          .filter((recommendation) => recommendation.status !== 'PENDING')
          .map((recommendation) => {
            const lastEvent = recommendation.trackingEvents?.[0];
            return {
              date: lastEvent ? new Date(lastEvent.createdAt).toLocaleString('id-ID') : new Date(recommendation.periode).toLocaleDateString('id-ID'),
              officer: lastEvent?.actor?.username ?? 'IFK',
              clinic: recommendation.puskesmas?.nama ?? recommendation.puskesmasId,
              action: recommendation.items.map((item) => `${item.obat?.nama ?? item.obatId} (${item.finalQuantity})`).join(', '),
              prediction: recommendation.justification ?? recommendation.source,
              decision: recommendation.status,
              tone: recommendation.status === 'REJECTED' ? 'red' as const : 'green' as const,
            };
          });
        if (finalRows.length) setLedgerRows(finalRows);
        setMetrics([
          { label: 'Stockouts Prevented', value: String(recommendations.filter((item) => item.urgency === 'CRITICAL' && item.status !== 'REJECTED').length), note: 'Critical recommendations handled', icon: 'settings', tone: 'green' },
          { label: 'Approved Decisions', value: String(recommendations.filter((item) => ['APPROVED', 'DISPATCHED', 'RECEIVED'].includes(item.status)).length), note: 'IFK recommendations', icon: 'clock', tone: 'blue' },
          { label: 'Total Dispatches', value: String(recommendations.length), note: 'Distribution records', icon: 'truck', tone: 'blue' },
        ]);
      })
      .catch(() => undefined);
  }, []);

  const bars = useMemo(() => {
    const approved = ledgerRows.filter((row) => row.tone === 'green').length;
    const rejected = ledgerRows.filter((row) => row.tone === 'red').length;
    return ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, index) => ({
      day,
      green: Math.max(20, approved * 30 + index * 8),
      red: rejected ? Math.max(15, rejected * 15 + (index % 3) * 6) : 0,
    }));
  }, [ledgerRows]);

  return (
    <div className={styles.dhShell}>
      <Sidebar />
      <div className={styles.dhWorkspace}>
        <Topbar />
        <main className={styles.dhPage}>
          <section className={styles.dhHeader}><div><p>Operational Ledger</p><h1>Riwayat Keputusan</h1></div><div><button type="button" onClick={() => downloadCsv(ledgerRows)}><AppIcon name="fileText" width={14} height={14} />Export CSV</button><button type="button" onClick={() => window.print()}><AppIcon name="fileText" width={14} height={14} />Print PDF</button></div></section>
          <section className={styles.dhMetrics}>{metrics.map((item) => <MetricCard item={item} key={item.label} />)}</section>
          <section className={styles.dhTablePanel}>
            <div className={styles.dhTableHeader}><h2>Chronological Intelligence Log</h2><div><label><AppIcon name="search" width={14} height={14} />Search Petugas or Klinik...</label><button type="button" onClick={() => setLedgerRows((current) => [...current].sort((a, b) => a.clinic.localeCompare(b.clinic)))}><AppIcon name="filter" width={14} height={14} />Sort <AppIcon name="chevronDown" width={14} height={14} /></button></div></div>
            <div className={styles.dhScroller}><table className={styles.dhTable}><thead><tr><th>Tanggal</th><th>Petugas</th><th>Klinik</th><th>Tindakan</th><th>AI Prediction Stocks</th><th>Actual Decision</th></tr></thead><tbody>{ledgerRows.length === 0 ? <tr><td colSpan={6}>Belum ada riwayat keputusan.</td></tr> : null}{ledgerRows.map((row) => <tr key={`${row.date}-${row.clinic}`}>{Object.entries(row).filter(([key]) => key !== 'tone').map(([key, value]) => <td className={key === 'prediction' ? styles.predictionCell : row.tone ? styles[row.tone] : undefined} key={key}>{String(value).split('\n').map((line) => <span key={line}>{line}</span>)}</td>)}</tr>)}</tbody></table></div>
            <div className={styles.dhPagination}><span>Showing entries {ledgerRows.length}</span><div><button type="button" disabled><AppIcon name="chevronLeft" width={14} height={14} /></button><button type="button" className={styles.current}>1</button><button type="button" disabled>2</button><button type="button" disabled>3</button><button type="button" disabled><AppIcon name="chevronRight" width={14} height={14} /></button></div></div>
          </section>
          <section className={styles.dhBottomGrid}>
            <article className={styles.dhChart}><div><h2>Audit Trail Analysis</h2><p>Deviation distribution across Eastern Sector facilities</p><span><i />Matched <b />Deviated</span></div><div className={styles.dhBars}>{bars.map((bar) => <div key={bar.day}><span style={{ height: `${bar.green}px` }} /><b style={{ height: `${bar.red}px` }} /><small>{bar.day}</small></div>)}</div></article>
            <aside className={styles.dhCompliance}><span><AppIcon name="shield" width={24} height={24} /></span><h2>Compliance Rating</h2><p>Eastern Sector maintains a 94.2% adherence to AI-driven logistics recommendations. High deviation observed during weather-related transit interruptions in the Sorong sector.</p><div><small>Primary Deviation Factor</small><strong>Weather / Logistics<br />Latency</strong></div></aside>
          </section>
        </main>
      </div>
    </div>
  );
}
