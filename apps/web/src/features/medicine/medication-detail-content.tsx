'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import { getCurrentUser, getObat, getStokRows, upsertStok, type ObatRecord, type StokRow } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './medicine.module.css';

type ChartMode = 'recent6' | 'recent12' | 'all';

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function getPeriodTime(row: StokRow) {
  return new Date(row.periode).getTime();
}

function formatPeriod(value: string) {
  return new Date(value).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
}

function getChartRows(rows: StokRow[], mode: ChartMode) {
  const sorted = [...rows].sort((left, right) => getPeriodTime(left) - getPeriodTime(right));
  if (mode === 'recent6') return sorted.slice(-6);
  if (mode === 'recent12') return sorted.slice(-12);
  return sorted;
}

export function MedicationDetailContent() {
  const params = useParams<{ medicine?: string }>();
  const [medicine, setMedicine] = useState<ObatRecord | null>(null);
  const [stockRows, setStockRows] = useState<StokRow[]>([]);
  const [puskesmasId, setPuskesmasId] = useState<string | null>(null);
  const [draftStock, setDraftStock] = useState('0');
  const [draftUsage, setDraftUsage] = useState('0');
  const [chartMode, setChartMode] = useState<ChartMode>('recent6');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadDetail() {
      setError(null);
      const currentUser = await getCurrentUser();
      if (!currentUser?.puskesmasId) throw new Error('Akun ini belum terhubung ke puskesmas.');
      const [medicines, stocks] = await Promise.all([getObat(), getStokRows({ puskesmasId: currentUser.puskesmasId })]);
      if (!mounted) return;
        const slug = params?.medicine ?? '';
      const selected = medicines.find((item) => slugify(item.id) === slug || slugify(item.nama) === slug || item.id.toLowerCase() === slug.toLowerCase()) ?? null;
      const nextRows = selected ? stocks.filter((row) => row.obatId === selected.id).sort((left, right) => getPeriodTime(right) - getPeriodTime(left)) : [];
      const latest = nextRows[0];
      setPuskesmasId(currentUser.puskesmasId);
        setMedicine(selected);
      setStockRows(nextRows);
      setDraftStock(String(latest?.stokSaatIni ?? 0));
      setDraftUsage(String(latest?.konsumsiPeriode ?? 0));
      if (!selected) setError('Obat tidak ditemukan untuk URL ini.');
    }

    loadDetail()
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Gagal memuat detail obat'));
    return () => { mounted = false; };
  }, [params?.medicine]);

  const latestStock = stockRows[0];
  const currentStock = latestStock?.stokSaatIni ?? 0;
  const usage = latestStock?.konsumsiPeriode ?? 0;
  const dailyUse = usage > 0 ? usage / 30 : 0;
  const emptyDays = dailyUse > 0 ? Math.max(1, Math.round(currentStock / dailyUse)) : 0;
  const chartRows = useMemo(() => getChartRows(stockRows, chartMode), [chartMode, stockRows]);
  const maxUsage = Math.max(1, ...chartRows.map((row) => row.konsumsiPeriode));
  const chartPoints = chartRows.map((row) => ({
    key: `${row.obatId}-${row.periode}`,
    label: formatPeriod(row.periode),
    usage: row.konsumsiPeriode,
    height: Math.max(12, Math.round((row.konsumsiPeriode / maxUsage) * 180)),
    isHigh: row.konsumsiPeriode >= maxUsage * 0.75,
  }));
  const historyRows = (showAllHistory ? stockRows : stockRows.slice(0, 5)).map((row) => ({
    date: new Date(row.periode).toLocaleDateString('id-ID'),
    activity: row.konsumsiPeriode > 0 ? 'Update stok dan pemakaian' : 'Update stok',
    amount: `${row.stokSaatIni} ${row.obat?.satuan ?? medicine?.satuan ?? 'unit'} tersisa / ${row.konsumsiPeriode} terpakai`,
    person: row.puskesmas?.nama ?? row.puskesmasId,
    status: row.konsumsiPeriode > 0 ? 'Dengan pemakaian' : 'Stok tersimpan',
    type: row.konsumsiPeriode > 0 ? 'out' : 'in',
  }));

  const updatedLabel = latestStock ? new Date(latestStock.periode).toLocaleDateString('id-ID') : 'Belum ada update stok';

  async function saveCurrentPeriodStock() {
    if (!medicine || !puskesmasId) return;
    const nextStock = Number(draftStock);
    const nextUsage = Number(draftUsage);
    if (!Number.isFinite(nextStock) || !Number.isFinite(nextUsage) || nextStock < 0 || nextUsage < 0) {
      setError('Stok dan pemakaian harus angka valid.');
      return;
    }
    setError(null);
    try {
      const saved = await upsertStok({ puskesmasId, obatId: medicine.id, periode: getCurrentPeriod(), stokAwal: nextStock + nextUsage, konsumsiPeriode: nextUsage, stokSaatIni: nextStock });
      const nextRows = [saved, ...stockRows.filter((row) => row.id !== saved.id)].sort((left, right) => getPeriodTime(right) - getPeriodTime(left));
      setStockRows(nextRows);
      setNotice(`Stok ${medicine.nama} periode berjalan berhasil diperbarui.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan stok obat');
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

      <section className={styles.inputCard} aria-label="Update stok periode berjalan">
        <div className={styles.formGrid}>
          <label className={styles.fieldGroup}>
            <span>Stok Saat Ini</span>
            <input value={draftStock} inputMode="numeric" disabled={!medicine} onChange={(event) => setDraftStock(event.target.value)} />
          </label>
          <label className={styles.fieldGroup}>
            <span>Pemakaian Periode Ini</span>
            <input value={draftUsage} inputMode="numeric" disabled={!medicine} onChange={(event) => setDraftUsage(event.target.value)} />
          </label>
          <label className={styles.fieldGroup}>
            <span>Periode</span>
            <input value={getCurrentPeriod()} disabled />
          </label>
          <button type="button" className={styles.addButton} disabled={!medicine || !puskesmasId} onClick={() => void saveCurrentPeriodStock()}>
            <AppIcon name="save" width={18} height={18} />
            Simpan Stok
          </button>
        </div>
      </section>

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
            <footer><span>Updated {updatedLabel}</span><a href="#stock-history">Lihat riwayat stok <AppIcon name="chevronRight" width={14} height={14} /></a></footer>
          </section>
        </div>

        <section className={styles.chartCard}>
          <header><h2>Usage Chart</h2><select className={styles.chartSelect} value={chartMode} onChange={(event) => setChartMode(event.target.value as ChartMode)}><option value="recent6">6 periode terakhir</option><option value="recent12">12 periode terakhir</option><option value="all">Semua periode</option></select></header>
          <div className={styles.chartPlot} aria-label="Usage bar chart">
            {chartPoints.length === 0 ? <p className={styles.chartEmpty}>Belum ada data pemakaian.</p> : null}
            {chartPoints.map((point) => <span key={point.key} title={`${point.label}: ${point.usage}`} className={point.isHigh ? styles.highBar : ''} style={{ height: point.height }} />)}
          </div>
          <div className={styles.chartAxis}>{chartPoints.map((point) => <span key={point.key}>{point.label}</span>)}</div>
          <div className={styles.chartLegend}><span><i />High Usage</span><span><i />Average</span></div>
        </section>
      </section>

      <section className={styles.historyCard} id="stock-history">
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
                  <td><span className={styles.verifiedPill}>{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className={styles.detailFooter}>
        <div>
          <Link href={routes.medicineNeeds} className={styles.backButton}>Back</Link>
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
