'use client';

import Link from 'next/link';
import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import styles from './medicine.module.css';

const historyRows = [
  { date: '31 Oct 2023, 14:20', activity: 'Usage (Delivery #442)', amount: '- 2 ampul', person: 'Bdn. Siti Aminah', type: 'out' },
  { date: '30 Oct 2023, 09:15', activity: 'Restock (PO-9912)', amount: '+ 20 ampul', person: 'Apt. Sarah Wijaya', type: 'in' },
  { date: '29 Oct 2023, 11:05', activity: 'Usage (Delivery #441)', amount: '- 1 ampul', person: 'Bdn. Maria Ulfa', type: 'out' },
];

const bars = [48, 58, 84, 128, 68, 96, 120, 76, 52, 128, 96];

export function MedicationDetailContent() {
  return (
    <PageContainer size="wide" className={styles.detailPage}>
      <header className={styles.detailHeader}>
        <div>
          <nav className={styles.detailBreadcrumb} aria-label="Breadcrumb">
            <Link href="/lplpo">Medicine Needs</Link>
            <AppIcon name="chevronRight" width={14} height={14} />
            <span>Oxytocin 10IU</span>
          </nav>
          <h1>Medication Detail: Oxytocin 10IU</h1>
        </div>
        <button type="button" className={styles.printButton}>
          <AppIcon name="printer" width={18} height={18} />
          Print Report
        </button>
      </header>

      <section className={styles.statsGrid} aria-label="Medication stats">
        <StatCard title="Current Stock" value="50" unit="ampul" tone="safe" icon="package" note="Safe" />
        <StatCard title="Usage (Last 7 Days)" value="12" unit="ampul" tone="usage" icon="activity" note="+5% compared to last week" />
        <StatCard title="Estimated Stock Empty" value="8" unit="Days" tone="warning" icon="clock" note="Warning" />
      </section>

      <section className={styles.detailGrid}>
        <div className={styles.infoStack}>
          <section className={styles.detailCard}>
            <header><h2>General Information</h2><AppIcon name="info" width={18} height={18} /></header>
            <dl className={styles.infoGrid}>
              <div><dt>Medication Name</dt><dd>Oxytocin 10IU</dd></div>
              <div><dt>Type</dt><dd>Injection (Hormone)</dd></div>
              <div><dt>Unit</dt><dd>Ampule (1ml)</dd></div>
              <div><dt>Storage Location</dt><dd>Cooler A-12</dd></div>
              <div><dt>Last Batch</dt><dd>B-99827 / EXP-12/2025</dd></div>
            </dl>
          </section>

          <section className={styles.predictionCard}>
            <div className={styles.predictionTitle}><span>AI Analysis</span><h2>Stock Prediction</h2></div>
            <p>Prediction: Oxytocin usage tends to be stable. However, anticipate a 15% surge in demand next week due to a busy delivery schedule in the Cangkringan area.</p>
            <footer><span>Updated 2 hours ago</span><button type="button">View Detailed Analytics <AppIcon name="chevronRight" width={14} height={14} /></button></footer>
          </section>
        </div>

        <section className={styles.chartCard}>
          <header><h2>Usage Chart (30 Days)</h2><button type="button">Daily <AppIcon name="chevronDown" width={14} height={14} /></button></header>
          <div className={styles.chartPlot} aria-label="Usage bar chart">
            {bars.map((height, index) => <span key={index} className={index === 3 || index === 6 || index === 10 ? styles.highBar : ''} style={{ height }} />)}
          </div>
          <div className={styles.chartAxis}><span>1 Oct</span><span>10 Oct</span><span>20 Oct</span><span>30 Oct</span></div>
          <div className={styles.chartLegend}><span><i />High Usage</span><span><i />Average</span></div>
        </section>
      </section>

      <section className={styles.historyCard}>
        <header><h2>Stock Update History</h2><button type="button">View All History</button></header>
        <div className={styles.historyScroll}>
          <table className={styles.historyTable}>
            <thead><tr><th>Date</th><th>Activity</th><th>Amount</th><th>Personnel</th><th>Status</th></tr></thead>
            <tbody>
              {historyRows.map((row) => (
                <tr key={`${row.date}-${row.activity}`}>
                  <td>{row.date}</td>
                  <td><span className={row.type === 'in' ? styles.historyInIcon : styles.historyOutIcon}>{row.type === 'in' ? '+' : '-'}</span>{row.activity}</td>
                  <td className={row.type === 'in' ? styles.amountIn : styles.amountOut}>{row.amount}</td>
                  <td>{row.person}</td>
                  <td><span className={styles.verifiedPill}>Verified</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className={styles.detailFooter}>
        <button type="button" className={styles.removeButton}><AppIcon name="trash" width={18} height={18} />Remove from Inventory</button>
        <div>
          <Link href="/lplpo" className={styles.backButton}>Back</Link>
          <button type="button" className={styles.detailSaveButton}><AppIcon name="save" width={18} height={18} />Save Changes</button>
        </div>
      </footer>
    </PageContainer>
  );
}

function StatCard({ title, value, unit, tone, icon, note }: { title: string; value: string; unit: string; tone: 'safe' | 'usage' | 'warning'; icon: 'package' | 'activity' | 'clock'; note: string }) {
  return (
    <article className={styles.statCard}>
      <header><span>{title}</span><i><AppIcon name={icon} width={24} height={24} /></i></header>
      <p><strong>{value}</strong> {unit}</p>
      <small className={styles[`${tone}Stat`]}>{note}</small>
    </article>
  );
}
