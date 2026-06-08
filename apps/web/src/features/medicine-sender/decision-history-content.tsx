'use client';

import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import styles from './decision-history.module.css';

type Metric = { label: string; value: string; note: string; icon: AppIconName; tone: 'green' | 'blue' };
type Row = { date: string; officer: string; clinic: string; action: string; prediction: string; decision: string; tone?: 'red' | 'green' };

const metrics: Metric[] = [
  { label: 'Stockouts Prevented', value: '1,248', note: '+12% from last auditing period', icon: 'settings', tone: 'green' },
  { label: 'Avg Lead Time', value: '4.2 hrs', note: 'Inter-sector transit optimization active', icon: 'clock', tone: 'blue' },
  { label: 'Total Dispatches', value: '342', note: '98.4% AI Accuracy', icon: 'truck', tone: 'blue' },
];

const rows: Row[] = [
  { date: 'OCT 24, 2023\n14:22:15\nWITA', officer: 'AS\nArya Setiawan', clinic: 'Klinik Merdeka Jaya', action: 'Approval Pengiriman Vaksin BCG (200 Units)', prediction: 'STOK MGSO4 MENIPIS. ESTIMASI HABIS 6 HARI.', decision: 'APPROVED', tone: 'green' },
  { date: 'OCT 24, 2023\n13:05:42\nWITA', officer: 'RP\nRina Putri', clinic: 'Puskesmas Sorong Timur', action: 'Penundaan Pengiriman Alat Steril', prediction: 'STOK MGSO4 MENIPIS. ESTIMASI HABIS 6 HARI.', decision: 'OVERRIDE: DELAYED', tone: 'red' },
  { date: 'OCT 24, 2023\n11:18:02\nWITA', officer: 'AS\nArya Setiawan', clinic: 'Klinik Raja Ampat Central', action: 'Update Stock Threshold Level', prediction: 'STOK MGSO4 MENIPIS. ESTIMASI HABIS 6 HARI.', decision: 'MANUAL INCREASE' },
  { date: 'OCT 23, 2023\n17:55:00\nWITA', officer: 'SM\nSystem Monitoring', clinic: 'All Sectors', action: 'Automated Cold Chain Audit', prediction: '-', decision: 'LOG RECORDED' },
];

const bars = [
  { day: 'MON', green: 150, red: 0 },
  { day: 'TUE', green: 135, red: 0 },
  { day: 'WED', green: 45, red: 45 },
  { day: 'THU', green: 165, red: 0 },
  { day: 'FRI', green: 105, red: 15 },
  { day: 'SAT', green: 75, red: 0 },
  { day: 'SUN', green: 45, red: 0 },
];

function Sidebar() {
  return (
    <aside className={styles.dhSidebar}>
      <div className={styles.dhBrand}><span><AppIcon name="briefcase" width={20} height={20} /></span><div><strong>IFK</strong><small>District Monitoring</small></div></div>
      <nav className={styles.dhNav}>
        <a href="/medicine-sender"><AppIcon name="home" width={20} height={20} />Dashboard</a>
        <a className={styles.dhNavActive} href="/medicine-sender/recommendations"><AppIcon name="userPlus" width={20} height={20} />Distribution</a>
        <a href="/medicine-sender/clinics"><AppIcon name="users" width={20} height={20} />Clinic List</a>
        <a href="/medicine-sender/environment"><AppIcon name="calendar" width={20} height={20} />Environment Monitoring</a>
      </nav>
    </aside>
  );
}

function Topbar() {
  return (
    <header className={styles.dhTopbar}>
      <div className={styles.dhCrumbs}><span>Home</span><AppIcon name="chevronRight" width={14} height={14} /><span>Patient List</span><AppIcon name="chevronRight" width={14} height={14} /><strong>Add New Patient</strong></div>
      <div className={styles.dhTopActions}><button><AppIcon name="bell" width={18} height={18} /><i /></button><button><AppIcon name="settings" width={18} height={18} /></button><span /><div><strong>Pharmacy Management</strong><small>Administrator</small></div><b>PM</b></div>
    </header>
  );
}

function MetricCard({ item }: { item: Metric }) {
  return <article className={styles.dhMetric}><div><span>{item.label}</span><AppIcon className={styles[item.tone]} name={item.icon} width={22} height={22} /></div><strong>{item.value}</strong><p className={styles[item.tone]}>{item.note}</p></article>;
}

export function DecisionHistoryContent() {
  return (
    <div className={styles.dhShell}>
      <Sidebar />
      <div className={styles.dhWorkspace}>
        <Topbar />
        <main className={styles.dhPage}>
          <section className={styles.dhHeader}><div><p>Operational Ledger</p><h1>Riwayat Keputusan</h1></div><div><button><AppIcon name="fileText" width={14} height={14} />Export CSV</button><button><AppIcon name="fileText" width={14} height={14} />Export PDF</button></div></section>
          <section className={styles.dhMetrics}>{metrics.map((item) => <MetricCard item={item} key={item.label} />)}</section>
          <section className={styles.dhTablePanel}>
            <div className={styles.dhTableHeader}><h2>Chronological Intelligence Log</h2><div><label><AppIcon name="search" width={14} height={14} />Search Petugas or Klinik...</label><button><AppIcon name="filter" width={14} height={14} />Filter <AppIcon name="chevronDown" width={14} height={14} /></button></div></div>
            <div className={styles.dhScroller}><table className={styles.dhTable}><thead><tr><th>Tanggal</th><th>Petugas</th><th>Klinik</th><th>Tindakan</th><th>AI Prediction Stocks</th><th>Actual Decision</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.date}-${row.clinic}`}>{Object.entries(row).filter(([key]) => key !== 'tone').map(([key, value]) => <td className={key === 'prediction' ? styles.predictionCell : row.tone ? styles[row.tone] : undefined} key={key}>{String(value).split('\n').map((line) => <span key={line}>{line}</span>)}</td>)}</tr>)}</tbody></table></div>
            <div className={styles.dhPagination}><span>Showing entries 1-4 of 1,240 Total Actions</span><div><button><AppIcon name="chevronLeft" width={14} height={14} /></button><button className={styles.current}>1</button><button>2</button><button>3</button><button><AppIcon name="chevronRight" width={14} height={14} /></button></div></div>
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
