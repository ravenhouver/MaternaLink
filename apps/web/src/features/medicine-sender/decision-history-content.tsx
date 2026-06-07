'use client';

import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { useState } from 'react';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import styles from './decision-history.module.css';

type MetricCard = {
  label: string;
  value: string;
  unit?: string;
  note: string;
  icon: AppIconName;
  tone: 'green' | 'blue';
};

type DecisionRow = {
  date: string[];
  officer: { initials: string; name: string[] };
  clinic: string[];
  action: string[];
  recommendation: { label: string[]; tone: 'dispatch' | 'none' | 'normal' };
  decision: { label: string[]; tone: 'approved' | 'delayed' | 'manual' | 'recorded' };
  status: 'matched' | 'deviated' | 'manual';
};

const navItems: Array<{ href: string; label: string; icon: AppIconName; active?: boolean }> = [
  { href: '/medicine-sender', label: 'Dashboard', icon: 'grid' },
  { href: '/medicine-sender/recommendations', label: 'Rekomendasi Pengiriman', icon: 'truck' },
  { href: '/medicine-sender/environment', label: 'Pemantauan Lingkungan', icon: 'activity' },
  { href: '/medicine-sender/clinics', label: 'Semua Klinik', icon: 'plus' },
  { href: '/medicine-sender/decision-history', label: 'Riwayat Keputusan', icon: 'clipboard', active: true },
];

const metrics: MetricCard[] = [
  { label: 'Stockouts Prevented', value: '1,248', note: '+12% from last auditing period', icon: 'shield', tone: 'green' },
  { label: 'Avg Lead Time', value: '4.2', unit: 'hrs', note: 'Inter-sector transit optimization active', icon: 'clock', tone: 'blue' },
  { label: 'Total Dispatches', value: '342', note: '98.4% AI Accuracy', icon: 'truck', tone: 'blue' },
];

const rows: DecisionRow[] = [
  {
    date: ['OCT 24,', '2023', '14:22:15', 'WITA'],
    officer: { initials: 'AS', name: ['Arya', 'Setiawan'] },
    clinic: ['Klinik', 'Merdeka Jaya'],
    action: ['Approval', 'Pengiriman', 'Vaksin BCG (200', 'Units)'],
    recommendation: { label: ['DISPATCH', 'IMMEDIATELY'], tone: 'dispatch' },
    decision: { label: ['APPROVED'], tone: 'approved' },
    status: 'matched',
  },
  {
    date: ['OCT 24,', '2023', '13:05:42', 'WITA'],
    officer: { initials: 'RP', name: ['Rina Putri'] },
    clinic: ['Puskesmas', 'Sorong Timur'],
    action: ['Penundaan', 'Pengiriman Alat', 'Steril'],
    recommendation: { label: ['DISPATCH', 'IMMEDIATELY'], tone: 'dispatch' },
    decision: { label: ['OVERRIDE:', 'DELAYED'], tone: 'delayed' },
    status: 'deviated',
  },
  {
    date: ['OCT 24,', '2023', '11:18:02', 'WITA'],
    officer: { initials: 'AS', name: ['Arya', 'Setiawan'] },
    clinic: ['Klinik Raja', 'Ampat', 'Central'],
    action: ['Update Stock', 'Threshold Level'],
    recommendation: { label: ['NO ACTION', 'REQUIRED'], tone: 'none' },
    decision: { label: ['MANUAL', 'INCREASE'], tone: 'manual' },
    status: 'manual',
  },
  {
    date: ['OCT 23,', '2023', '17:55:00', 'WITA'],
    officer: { initials: 'SM', name: ['System', 'Monitoring'] },
    clinic: ['All Sectors'],
    action: ['Automated Cold', 'Chain Audit'],
    recommendation: { label: ['ALL SYSTEMS', 'NOMINAL'], tone: 'normal' },
    decision: { label: ['LOG', 'RECORDED'], tone: 'recorded' },
    status: 'matched',
  },
];

const bars = [
  { day: 'MON', matched: 160, deviated: 0 },
  { day: 'TUE', matched: 144, deviated: 0 },
  { day: 'WED', matched: 48, deviated: 48 },
  { day: 'THU', matched: 176, deviated: 0 },
  { day: 'FRI', matched: 112, deviated: 16 },
  { day: 'SAT', matched: 80, deviated: 0 },
  { day: 'SUN', matched: 48, deviated: 0 },
];

const statusLabel = {
  matched: 'Matched',
  deviated: 'Deviated',
  manual: 'Manual',
};

function Topbar() {
  return (
    <header className={styles.topbar}>
      <div className={styles.brandCluster}>
        <Typography.Text className={styles.brand}>Sovereign Command</Typography.Text>
        <span className={styles.brandDivider} />
        <Typography.Text className={styles.terminal}>Audit Intelligence Terminal</Typography.Text>
      </div>
      <div className={styles.topbarActions}>
        <button type="button" aria-label="Notifikasi"><AppIcon name="bell" width={18} height={18} /></button>
        <button type="button" aria-label="Akun"><AppIcon name="user" width={18} height={18} /></button>
        <button type="button" aria-label="Keluar"><AppIcon name="logOut" width={18} height={18} /></button>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className={styles.sidebar} aria-label="Medicine sender navigation">
      <div className={styles.sectorCard}>
        <span>EH</span>
        <div>
          <strong>Eastern Sector</strong>
          <small>Command Intelligence</small>
        </div>
      </div>
      <nav className={styles.nav} aria-label="Navigasi medicine sender">
        {navItems.map((item) => (
          <a className={item.active ? styles.navActive : undefined} href={item.href} key={item.href}>
            <AppIcon name={item.icon} width={18} height={18} />
            {item.label}
          </a>
        ))}
      </nav>
      <div className={styles.bottomNav}>
        <a href="#settings"><AppIcon name="settings" width={18} height={18} />Settings</a>
        <a href="#support"><AppIcon name="info" width={18} height={18} />Support</a>
      </div>
    </aside>
  );
}

function MetricCard({ item }: { item: MetricCard }) {
  return (
    <article className={styles.metricCard}>
      <div className={styles.metricHeader}>
        <span>{item.label}</span>
        <AppIcon className={styles[item.tone]} name={item.icon} width={22} height={22} />
      </div>
      <div className={styles.metricValue}>
        <strong>{item.value}</strong>
        {item.unit ? <em>{item.unit}</em> : null}
      </div>
      <p className={item.tone === 'green' ? styles.positiveNote : undefined}>{item.note}</p>
    </article>
  );
}

function AuditTable() {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <section className={styles.auditPanel} aria-labelledby="audit-log-title">
      <div className={styles.auditHeader}>
        <Typography.Title id="audit-log-title" level={2}>Chronological Intelligence Log</Typography.Title>
        <div className={styles.auditTools}>
          <label className={styles.searchBox}>
            <AppIcon name="search" width={14} height={14} />
            <span>Search Petugas or Klinik...</span>
          </label>
          <button type="button"><AppIcon name="filter" width={12} height={12} />Filter</button>
        </div>
      </div>
      <div className={styles.tableScroller}>
        <table className={styles.auditTable}>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Petugas</th>
              <th>Klinik</th>
              <th>Tindakan</th>
              <th>AI Recommendation</th>
              <th>Actual Decision</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.date.join('-')}-${row.officer.initials}`}>
                <td className={styles.dateCell}>{row.date.map((line) => <span key={line}>{line}</span>)}</td>
                <td>
                  <span className={styles.officer}><i>{row.officer.initials}</i>{row.officer.name.map((line) => <b key={line}>{line}</b>)}</span>
                </td>
                <td className={styles.strongLines}>{row.clinic.map((line) => <strong key={line}>{line}</strong>)}</td>
                <td>{row.action.map((line) => <span key={line}>{line}</span>)}</td>
                <td>
                  <span className={[styles.aiDecision, styles[row.recommendation.tone]].join(' ')}>
                    <AppIcon name={row.recommendation.tone === 'none' ? 'info' : 'zap'} width={12} height={12} />
                    <span>{row.recommendation.label.map((line) => <b key={line}>{line}</b>)}</span>
                  </span>
                </td>
                <td className={[styles.actualDecision, styles[row.decision.tone]].join(' ')}>{row.decision.label.map((line) => <strong key={line}>{line}</strong>)}</td>
                <td><span className={[styles.statusPill, styles[row.status]].join(' ')}>{statusLabel[row.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.pagination}>
        <span>Showing entries 1-4 of 1,240 Total Actions</span>
        <div>
          <button type="button" aria-label="Halaman sebelumnya"><AppIcon name="chevronLeft" width={12} height={12} /></button>
          {[1, 2, 3].map((page) => (
            <button
              className={currentPage === page ? styles.currentPage : undefined}
              key={page}
              onClick={() => setCurrentPage(page)}
              type="button"
            >
              {page}
            </button>
          ))}
          <button type="button" aria-label="Halaman berikutnya"><AppIcon name="chevronRight" width={12} height={12} /></button>
        </div>
      </div>
    </section>
  );
}

function AnalysisPanel() {
  return (
    <section className={styles.analysisGrid} aria-label="Audit trail analysis">
      <article className={styles.chartPanel}>
        <div className={styles.chartHeader}>
          <div>
            <Typography.Title level={2}>Audit Trail Analysis</Typography.Title>
            <p>Deviation distribution across Eastern Sector facilities</p>
          </div>
          <div className={styles.legend}>
            <span><i className={styles.matchedDot} />Matched</span>
            <span><i className={styles.deviatedDot} />Deviated</span>
          </div>
        </div>
        <div className={styles.barChart}>
          {bars.map((bar) => (
            <div className={styles.barItem} key={bar.day}>
              <div className={styles.barStack} style={{ height: `${bar.matched + bar.deviated}px` }}>
                {bar.matched ? <span className={styles.matchedBar} style={{ height: `${bar.matched}px` }} /> : null}
                {bar.deviated ? <span className={styles.deviatedBar} style={{ height: `${bar.deviated}px` }} /> : null}
              </div>
              <small>{bar.day}</small>
            </div>
          ))}
        </div>
      </article>
      <aside className={styles.complianceCard}>
        <span className={styles.complianceIcon}><AppIcon name="shield" width={20} height={20} /></span>
        <Typography.Title level={2}>Compliance Rating</Typography.Title>
        <p>Eastern Sector maintains a 94.2% adherence to AI-driven logistics recommendations. High deviation observed during weather-related transit interruptions in the Sorong sector.</p>
        <div>
          <small>Primary Deviation Factor</small>
          <strong>Weather / Logistics<br />Latency</strong>
        </div>
      </aside>
    </section>
  );
}

export function DecisionHistoryContent() {
  return (
    <div className={styles.shell}>
      <Topbar />
      <Sidebar />
      <main className={styles.page}>
        <section className={styles.pageHeader} aria-labelledby="decision-history-title">
          <div>
            <Typography.Text className={styles.eyebrow}>Operational Ledger</Typography.Text>
            <Typography.Title id="decision-history-title" level={1}>Riwayat Keputusan</Typography.Title>
          </div>
          <div className={styles.headerActions}>
            <Button className={styles.csvButton} icon={<AppIcon name="fileText" width={13} height={13} />}>Export CSV</Button>
            <Button type="primary" className={styles.pdfButton} icon={<AppIcon name="clipboard" width={13} height={13} />}>Export PDF</Button>
          </div>
        </section>

        <section className={styles.metricsGrid} aria-label="Performance metrics">
          {metrics.map((metric) => <MetricCard item={metric} key={metric.label} />)}
        </section>

        <AuditTable />
        <AnalysisPanel />
      </main>
    </div>
  );
}
