'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import { deleteObat, getObat, getStokRows, type ObatRecord, type StokRow } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './medicine.module.css';

const DEFAULT_PUSKESMAS_ID = 'PKM-001';

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function MedicationDetailContent() {
  const params = useParams<{ medicine?: string }>();
  const router = useRouter();
  const [medicine, setMedicine] = useState<ObatRecord | null>(null);
  const [stockRows, setStockRows] = useState<StokRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    Promise.all([getObat(), getStokRows({ puskesmasId: DEFAULT_PUSKESMAS_ID })])
      .then(([medicines, stocks]) => {
        const slug = params?.medicine ?? '';
        const selected = medicines.find((item) => slugify(item.id) === slug || slugify(item.nama) === slug || item.id.toLowerCase() === slug) ?? medicines[0] ?? null;
        setMedicine(selected);
        setStockRows(selected ? stocks.filter((row) => row.obatId === selected.id) : stocks);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Gagal memuat detail obat'));
  }, [params?.medicine]);

  const latestStock = stockRows[0];
  const currentStock = latestStock?.stokSaatIni ?? 0;
  const usage = latestStock?.konsumsiPeriode ?? 0;
  const dailyUse = usage > 0 ? usage / 30 : 0;
  const emptyDays = dailyUse > 0 ? Math.max(1, Math.round(currentStock / dailyUse)) : 0;
  const bars = useMemo(() => Array.from({ length: 11 }, (_, index) => Math.max(24, Math.min(128, usage * (0.35 + ((index % 4) + 1) * 0.08)))), [usage]);
  const historyRows = (showAllHistory ? stockRows : stockRows.slice(0, 5)).map((row) => ({
    date: new Date(row.periode).toLocaleDateString('id-ID'),
    activity: 'Stock update',
    amount: `${row.stokSaatIni} ${row.obat?.satuan ?? medicine?.satuan ?? 'unit'}`,
    person: row.puskesmas?.nama ?? row.puskesmasId,
    type: 'in',
  }));

  const updatedLabel = latestStock ? new Date(latestStock.periode).toLocaleDateString('id-ID') : 'Belum ada update stok';

  function explainUnavailable(feature: string) {
    setNotice(`${feature} akan diaktifkan pada batch integrasi data berikutnya.`);
  }

  async function removeFromInventory() {
    if (!medicine) return;
    const confirmed = window.confirm(`Hapus ${medicine.nama} dari master obat? Data yang sudah memakai obat ini bisa menolak penghapusan dari backend.`);
    if (!confirmed) return;
    try {
      await deleteObat(medicine.id);
      setNotice(`${medicine.nama} berhasil dihapus dari master obat.`);
      router.push(routes.medicineNeeds);
    } catch (removeError) {
      setNotice(removeError instanceof Error ? removeError.message : 'Gagal menghapus obat');
    }
  }

  return (
    <PageContainer size="wide" className={styles.detailPage}>
      <header className={styles.detailHeader}>
        <div>
          <nav className={styles.detailBreadcrumb} aria-label="Breadcrumb">
            <Link href={routes.medicineNeeds}>Medicine Needs</Link>
            <AppIcon name="chevronRight" width={14} height={14} />
            <span>{medicine?.nama ?? 'Medication'}</span>
          </nav>
          <h1>Medication Detail: {medicine?.nama ?? 'Loading...'}</h1>
        </div>
        <button type="button" className={styles.printButton} onClick={() => window.print()}>
          <AppIcon name="printer" width={18} height={18} />
          Print Report
        </button>
      </header>

      <section className={styles.statsGrid} aria-label="Medication stats">
        <StatCard title="Current Stock" value={String(currentStock)} unit={medicine?.satuan ?? 'unit'} tone={currentStock <= 5 ? 'warning' : 'safe'} icon="package" note={currentStock <= 5 ? 'Critical' : 'Safe'} />
        <StatCard title="Usage (Current Period)" value={String(usage)} unit={medicine?.satuan ?? 'unit'} tone="usage" icon="activity" note="From stock input" />
        <StatCard title="Estimated Stock Empty" value={emptyDays ? String(emptyDays) : '-'} unit="Days" tone="warning" icon="clock" note="Forecast" />
      </section>

      {error ? <p className={styles.medicineError}>{error}</p> : null}
      {notice ? <p role="status" className={styles.medicineNotice}>{notice}</p> : null}

      <section className={styles.detailGrid}>
        <div className={styles.infoStack}>
          <section className={styles.detailCard}>
            <header><h2>General Information</h2><AppIcon name="info" width={18} height={18} /></header>
            <dl className={styles.infoGrid}>
              <div><dt>Medication Name</dt><dd>{medicine?.nama ?? '-'}</dd></div>
              <div><dt>Type</dt><dd>{medicine?.tipe ?? '-'}</dd></div>
              <div><dt>Unit</dt><dd>{medicine?.satuan ?? '-'}</dd></div>
              <div><dt>Category</dt><dd>{medicine?.kategori ?? '-'}</dd></div>
              <div><dt>Cold Chain</dt><dd>{medicine?.perluColdChain ? 'Required' : 'Not required'}</dd></div>
            </dl>
          </section>

          <section className={styles.predictionCard}>
            <div className={styles.predictionTitle}><span>AI Analysis</span><h2>Stock Prediction</h2></div>
            <p>Prediction: current stock is {currentStock} {medicine?.satuan ?? 'unit'} with period usage {usage}. {emptyDays ? `Estimated stock coverage is ${emptyDays} days.` : 'Usage trend is not available yet.'}</p>
            <footer><span>Updated {updatedLabel}</span><button type="button" onClick={() => explainUnavailable('Detailed analytics')}>View Detailed Analytics <AppIcon name="chevronRight" width={14} height={14} /></button></footer>
          </section>
        </div>

        <section className={styles.chartCard}>
          <header><h2>Usage Chart (30 Days)</h2><button type="button" onClick={() => explainUnavailable('Chart interval selector')}>Daily <AppIcon name="chevronDown" width={14} height={14} /></button></header>
          <div className={styles.chartPlot} aria-label="Usage bar chart">
            {bars.map((height, index) => <span key={index} className={index === 3 || index === 6 || index === 10 ? styles.highBar : ''} style={{ height }} />)}
          </div>
          <div className={styles.chartAxis}><span>1 Oct</span><span>10 Oct</span><span>20 Oct</span><span>30 Oct</span></div>
          <div className={styles.chartLegend}><span><i />High Usage</span><span><i />Average</span></div>
        </section>
      </section>

      <section className={styles.historyCard}>
        <header><h2>Stock Update History</h2><button type="button" onClick={() => setShowAllHistory((current) => !current)}>{showAllHistory ? 'Show Recent History' : 'View All History'}</button></header>
        <div className={styles.historyScroll}>
          <table className={styles.historyTable}>
            <thead><tr><th>Date</th><th>Activity</th><th>Amount</th><th>Personnel</th><th>Status</th></tr></thead>
            <tbody>
              {historyRows.length === 0 ? <tr><td colSpan={5}>Belum ada riwayat stok.</td></tr> : null}
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
        <button type="button" className={styles.removeButton} onClick={() => void removeFromInventory()} disabled={!medicine}><AppIcon name="trash" width={18} height={18} />Remove from Inventory</button>
        <div>
          <Link href={routes.medicineNeeds} className={styles.backButton}>Back</Link>
          <button type="button" className={styles.detailSaveButton} onClick={() => explainUnavailable('Save medicine changes')}><AppIcon name="save" width={18} height={18} />Save Changes</button>
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
