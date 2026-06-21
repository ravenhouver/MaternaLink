'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { RoleLogoutButton } from '@/components/layout/role-logout-button';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { getIfkFacilities, type DistributionRecommendation, type IfkFacilityRecord } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './medicine-sender.module.css';

type WeatherTone = 'danger' | 'neutral';
type ClinicRow = IfkFacilityRecord;

function leadTime(clinic: ClinicRow) { return clinic.leadTimeHari == null ? 'Belum tersedia' : `${clinic.leadTimeHari} hari`; }
function distance(clinic: ClinicRow) { return clinic.jarakKeIfkKm == null ? 'Belum tersedia' : `${clinic.jarakKeIfkKm} km`; }
function capacity(clinic: ClinicRow) { return clinic.kapasitasSimpanObat == null ? 'Belum tersedia' : `${clinic.kapasitasSimpanObat} unit`; }
function stockStatus(clinic: ClinicRow) { return clinic.criticalStockCount ? `${clinic.criticalStockCount} critical` : 'Safe'; }
function stockItems(clinic: ClinicRow) { return clinic.criticalStockItems.length ? clinic.criticalStockItems.join(', ') : clinic.coldChainReady ? 'Cold chain ready' : 'Cold chain gap'; }
function weatherTone(clinic: ClinicRow): WeatherTone { return clinic.risk === 'critical' ? 'danger' : 'neutral'; }
function weatherIcon(clinic: ClinicRow): AppIconName { return clinic.risk === 'critical' ? 'alert' : 'sun'; }

function formattedLogisticDate(value?: string | null) {
  if (!value) return 'Belum tersedia';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)).replace(/ /g, ' - ').toUpperCase();
}

function daysRemaining(clinic: ClinicRow) {
  if (clinic.risk === 'critical') return `${String(Math.max(1, clinic.criticalStockCount || 2)).padStart(2, '0')} Days`;
  if (clinic.risk === 'warning') return `${Math.max(7, clinic.leadTimeHari ?? 11)} Days`;
  return `${Math.max(14, clinic.leadTimeHari ?? 24)} Days`;
}

function splitName(name: string) {
  const words = name.split(' ');
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')].filter(Boolean);
}

function downloadClinicCsv(rows: ClinicRow[]) {
  const header = ['id', 'name', 'location', 'risk', 'rainy_access', 'active_pregnancies', 'critical_stock'].join(',');
  const body = rows.map((row) => [row.id, row.name, row.location, row.riskLabel, row.rainyAccess, row.activePregnancies, row.criticalStockCount].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'maternalink-clinics.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function ClinicsSidebar({ detail }: { detail: boolean }) {
  return (
    <aside className={styles.clinicsSidebar} aria-label="Medicine sender navigation">
      <div className={styles.clinicsBrandBlock}>
        <span><AppIcon name="plus" width={20} height={20} /></span>
        <div>
          <strong>IFK</strong>
          <small>District Monitoring</small>
        </div>
      </div>
      <nav className={styles.clinicsNav} aria-label="Navigasi medicine sender">
        <a href={routes.ifk}><AppIcon name="home" width={20} height={20} />Dashboard</a>
        <a className={detail ? styles.clinicsNavActive : undefined} href={routes.ifkRecommendations}><AppIcon name="userPlus" width={20} height={20} />Distribution</a>
        <a className={!detail ? styles.clinicsNavActive : undefined} href={routes.ifkClinics}><AppIcon name="users" width={20} height={20} />Clinic List</a>
        <a href={routes.ifkEnvironment}><AppIcon name="calendar" width={20} height={20} />Environment Monitoring</a>
      </nav>
      <div className={styles.clinicsSidebarBottom}>
        <RoleLogoutButton className={styles.clinicsLogoutButton} />
      </div>
    </aside>
  );
}

function ClinicsTopbar({ detail }: { detail: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <header className={styles.clinicsTopbar}>
      <div className={styles.clinicsCrumbs}>
        <span>Distribusi</span>
        <AppIcon name="chevronRight" width={14} height={14} />
        <span>Rekomendasi Distribusi</span>
        <AppIcon name="chevronRight" width={14} height={14} />
        <strong>{detail ? 'Detail Fasilitas' : 'Clinic List'}</strong>
      </div>
      <div className={styles.clinicsTopbarActions}>
        <strong>Petugas IFK</strong>
        <button type="button" aria-label="Notifikasi" onClick={() => setMessage('Notifikasi fasilitas muncul dari alert distribusi aktif.')}><AppIcon name="bell" width={18} height={18} /></button>
        <button type="button" aria-label="Bantuan" onClick={() => setMessage('Gunakan filter risiko, buka detail fasilitas, atau export CSV untuk audit.')}><AppIcon name="info" width={18} height={18} /></button>
        <span className={styles.clinicsAvatar}><AppIcon name="clipboard" width={16} height={16} /></span>
      </div>
      {message ? <p role="status">{message}</p> : null}
    </header>
  );
}

function ClinicTable({ onPageChange, onRiskChange, onView, page, pageRows, risk, rows, totalPages }: { onPageChange: (page: number) => void; onRiskChange: (risk: ClinicRiskFilter) => void; onView: (clinic: ClinicRow) => void; page: number; pageRows: ClinicRow[]; risk: ClinicRiskFilter; rows: ClinicRow[]; totalPages: number }) {
  const firstRow = rows.length === 0 ? 0 : (page - 1) * 4 + 1;
  const lastRow = Math.min(rows.length, firstRow + pageRows.length - 1);
  return (
    <div className={styles.clinicTableCard}>
      <div className={styles.clinicFilters}>
        <label><AppIcon name="filter" width={16} height={16} />Filter <select value={risk} onChange={(event) => onRiskChange(event.target.value as ClinicRiskFilter)}><option value="ALL">All risk</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="routine">Routine</option></select></label>
      </div>
      <table className={styles.clinicTable}>
        <thead>
          <tr>
            <th>Clinic Name</th>
            <th>Location</th>
            <th>Logistics<br />Update</th>
            <th>Critical<br />Stock</th>
            <th>Maternal<br />Health (Active)</th>
            <th>Risk Level</th>
            <th>Weather<br />Conditions</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((clinic) => (
            <tr key={clinic.id}>
              <td>
                <strong>{splitName(clinic.name).map((part, index) => <span key={`${clinic.id}-name-${index}`}>{part}</span>)}</strong>
                <small>{clinic.id}</small>
              </td>
              <td>{clinic.location.split(', ').map((part, index) => <span key={`${clinic.id}-location-${index}`}>{part}</span>)}</td>
              <td className={styles.mono}>{formattedLogisticDate(clinic.logisticDate)}</td>
              <td><b className={styles[`stockout${clinic.risk}`]}>{daysRemaining(clinic)}</b><small>{stockItems(clinic)}</small></td>
              <td><b>{clinic.activePregnancies}</b><small>{clinic.highRiskPregnancies} high-risk</small></td>
              <td><span className={[styles.clinicRisk, styles[clinic.risk]].join(' ')}>{clinic.riskLabel}</span></td>
              <td>
                <span className={[styles.weatherCell, styles[weatherTone(clinic)]].join(' ')}>
                  <AppIcon name={weatherIcon(clinic)} width={16} height={16} />
                  <em>{(clinic.weatherAlert ?? clinic.rainyAccess).split(' ').map((part, index) => <span key={`${clinic.id}-weather-${index}`}>{part}</span>)}</em>
                </span>
              </td>
              <td>
                <span className={styles.clinicActions}>
                  <button type="button" aria-label={`Lihat ${clinic.name}`} onClick={() => onView(clinic)}><AppIcon name="eye" width={18} height={18} /></button>
                  <button type="button" aria-label={`Menu ${clinic.name}`} onClick={() => onView(clinic)}><AppIcon name="moreVertical" width={18} height={18} /></button>
                </span>
              </td>
            </tr>
          ))}
          {pageRows.length === 0 ? <tr><td colSpan={8}>Belum ada fasilitas untuk filter ini.</td></tr> : null}
        </tbody>
      </table>
      <div className={styles.clinicPagination}>
        <span>Showing {firstRow}-{lastRow} of {rows.length} health facilities</span>
        <div>
          <button type="button" aria-label="Halaman sebelumnya" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><AppIcon name="chevronLeft" width={14} height={14} /></button>
          <button type="button" className={styles.currentPage}>{page}</button>
          {totalPages >= 2 ? <button type="button" onClick={() => onPageChange(2)}>2</button> : null}
          {totalPages >= 3 ? <button type="button" onClick={() => onPageChange(3)}>3</button> : null}
          {totalPages > 4 ? <span>...</span> : null}
          {totalPages > 3 ? <button type="button" onClick={() => onPageChange(totalPages)}>{totalPages}</button> : null}
          <button type="button" aria-label="Halaman berikutnya" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><AppIcon name="chevronRight" width={14} height={14} /></button>
        </div>
      </div>
    </div>
  );
}

type ClinicRiskFilter = 'ALL' | ClinicRow['risk'];

function ClinicsList({ onRefresh, onView, rows }: { onRefresh: () => void; onView: (clinic: ClinicRow) => void; rows: ClinicRow[] }) {
  const [risk, setRisk] = useState<ClinicRiskFilter>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 4;
  const filteredRows = useMemo(() => risk === 'ALL' ? rows : rows.filter((row) => row.risk === risk), [risk, rows]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const stats: Array<{ label: string; value: string; tone: string; delta?: string }> = [
    { label: 'Total Facilities', value: String(rows.length), tone: 'clinicStatBlue' },
    { label: 'Critical (Stockout)', value: String(rows.filter((row) => row.risk === 'critical').length).padStart(2, '0'), tone: 'clinicStatRed', delta: '+2%' },
    { label: 'In Transit', value: String(rows.reduce((sum, row) => sum + row.deliveries, 0)).padStart(2, '0'), tone: 'clinicStatGreen' },
  ];
  return (
    <main className={styles.clinicsPage}>
      <section className={styles.clinicsHeader} aria-labelledby="clinics-title">
        <div>
          <Typography.Text className={styles.clinicsBreadcrumb}>Registry <span>/</span> Infrastructure</Typography.Text>
          <Typography.Title id="clinics-title" level={1}>All Clinics</Typography.Title>
          <Typography.Paragraph>
            Centralized registry of health facilities within the Sanctuary network. Real-time monitoring of stock, atmospheric risks, and delivery schedules.
          </Typography.Paragraph>
        </div>
        <div className={styles.clinicsHeaderActions}>
          <Button className={styles.clinicsGhostButton} icon={<AppIcon name="download" width={16} height={16} />} onClick={() => downloadClinicCsv(rows)}>Export CSV</Button>
          <Button type="primary" className={styles.clinicsPrimaryButton} icon={<AppIcon name="plus" width={16} height={16} />} onClick={onRefresh}>Add Clinic</Button>
        </div>
      </section>

      <section className={styles.clinicStats} aria-label="Dashboard stats summary">
        {stats.map((item) => (
          <article className={[styles.clinicStatCard, styles[item.tone]].join(' ')} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}{item.delta ? <em>{item.delta}</em> : null}</strong>
          </article>
        ))}
      </section>

      <section className={styles.clinicRegistry} aria-label="Registry filters and table">
        <ClinicTable rows={filteredRows} pageRows={pageRows} page={safePage} totalPages={totalPages} risk={risk} onRiskChange={(next) => { setRisk(next); setPage(1); }} onPageChange={setPage} onView={onView} />
      </section>
    </main>
  );
}

function DetailMetric({ label, value, tone }: { label: string; value: string; tone?: 'safe' | 'danger' }) {
  return (
    <div className={styles.detailMetric}>
      <span>{label}</span>
      <strong className={tone ? styles[tone] : undefined}>{value}</strong>
    </div>
  );
}

function ClinicDetail({ clinic, nearbyRows, onBack, recommendation }: { clinic: ClinicRow; nearbyRows: ClinicRow[]; onBack: () => void; recommendation?: DistributionRecommendation }) {
  const itemSummary = recommendation?.items.map((item) => `${item.obat?.nama ?? item.obatId}: ${item.finalQuantity} ${item.obat?.satuan ?? 'unit'}`).join(', ') ?? 'Belum ada rekomendasi distribusi aktif.';
  const urgencyScore = `${Math.min(100, clinic.criticalStockCount * 25 + clinic.highRiskPregnancies * 10 + (clinic.risk === 'critical' ? 40 : clinic.risk === 'warning' ? 20 : 0))}/100`;
  const history = recommendation?.trackingEvents ?? [];
  return (
    <main className={styles.clinicDetailPage}>
      <section className={styles.detailHeader}>
        <button type="button" aria-label="Kembali ke clinic list" onClick={onBack}><AppIcon name="arrowLeft" width={24} height={24} /></button>
        <div>
          <span><Typography.Title level={1}>{clinic.name}</Typography.Title><b>{clinic.riskLabel}</b></span>
          <Typography.Text>ID: {clinic.id} - {clinic.location || 'Lokasi belum tersedia'}</Typography.Text>
        </div>
      </section>

      <section className={styles.criticalAlert}>
        <span><AppIcon name="alert" width={24} height={24} /></span>
        <p>{recommendation?.justification ?? `${stockItems(clinic)}; status akses hujan ${clinic.rainyAccess}.`}</p>
      </section>

      <section className={styles.detailGrid}>
        <div className={styles.detailMainColumn}>
          <article className={styles.detailCard}>
            <h2><AppIcon name="idCard" width={18} height={18} />Clinic Profile</h2>
            <div className={styles.profileGrid}>
              <DetailMetric label="Head of Clinic" value={clinic.headOfClinic ?? 'Belum tersedia di database'} />
              <DetailMetric label="Confirmation Status" value={clinic.riskLabel} tone={clinic.risk === 'routine' ? 'safe' : 'danger'} />
              <DetailMetric label="Cold Chain Facilities" value={clinic.coldChainReady ? 'Ready' : 'Gap'} />
              <DetailMetric label="Endemic Status" value={clinic.statusEndemisMalaria ? 'Endemis malaria' : 'Non-endemis'} />
            </div>
          </article>

          <article className={styles.detailCard}>
            <div className={styles.detailCardHeader}>
              <h2>Medication & Supplies</h2>
              <small>Last Update: {clinic.logisticDate ? new Date(clinic.logisticDate).toLocaleDateString('id-ID') : 'Belum tersedia'}</small>
            </div>
            <div className={styles.suppliesTableWrap}>
              <table className={styles.suppliesTable}>
                <thead>
                  <tr><th>Medication Name</th><th>Stock</th><th>Needs</th><th>Days Remaining</th><th>Status</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{recommendation?.items[0]?.obat?.nama ?? 'Cold chain facility'}</td>
                    <td className={clinic.risk === 'critical' ? styles.danger : styles.safe}>{stockItems(clinic)}</td>
                    <td>{recommendation?.items[0]?.finalQuantity ?? clinic.criticalStockCount}</td>
                    <td><span>{stockStatus(clinic)}</span></td>
                    <td><b className={styles[clinic.risk === 'critical' ? 'critical' : clinic.risk === 'warning' ? 'warning' : 'safe']}>{clinic.riskLabel}</b></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className={styles.aiAnalysisCard}>
            <h2><AppIcon name="zap" width={20} height={20} />AI Recommendation Analysis</h2>
            <div className={styles.analysisGrid}>
              <ul>
                <li><AppIcon name="info" width={16} height={16} />Distribution items: {itemSummary}</li>
                <li><AppIcon name="users" width={16} height={16} />Active pregnancy count: {clinic.activePregnancies}; high-risk: {clinic.highRiskPregnancies}.</li>
                <li><AppIcon name="activity" width={16} height={16} />Recommendation source: {recommendation?.source ?? 'Belum ada rekomendasi aktif'}.</li>
                <li><AppIcon name="mapPin" width={16} height={16} />Lead time: {leadTime(clinic)}; distance to IFK: {distance(clinic)}.</li>
              </ul>
              <div className={styles.urgencyBox}>
                <DetailMetric label="Urgency Score" value={urgencyScore} tone={clinic.risk === 'routine' ? 'safe' : 'danger'} />
                <div className={styles.urgencyTrack}><span /></div>
                <DetailMetric label="Equity Priority" value={recommendation?.urgency ?? clinic.riskLabel} />
                <DetailMetric label="AI Confidence" value={recommendation ? recommendation.source : 'Unavailable'} tone={recommendation ? 'safe' : undefined} />
              </div>
            </div>
          </article>
        </div>

        <aside className={styles.detailSideColumn}>
          <article className={styles.routeCard}>
            <h2><AppIcon name="route" width={20} height={20} />Optimized Logistics Route</h2>
            <div className={styles.routeImage}>
              <span><b>Jarak: {distance(clinic)}</b><b>Lead time: {leadTime(clinic)}</b></span>
            </div>
            <p>Storage capacity: <strong>{capacity(clinic)}</strong></p>
          </article>

          <article className={styles.detailCard}>
            <h2><AppIcon name="rotateCcw" width={20} height={20} />Shipping History</h2>
            {history.length === 0 ? <p>Belum ada tracking distribusi untuk fasilitas ini.</p> : null}
            {history.map((event) => (
              <div className={styles.historyRow} key={event.id}>
                <span><strong>{new Date(event.createdAt).toLocaleDateString('id-ID')}</strong><small>{event.note ?? event.status}</small></span>
                <b>{event.status}</b>
              </div>
            ))}
          </article>

          <article className={styles.detailCard}>
            <h2><AppIcon name="mapPin" width={20} height={20} />Nearby Clinics (Alt. Sourcing)</h2>
            {nearbyRows.length === 0 ? <p>Belum ada fasilitas alternatif.</p> : null}
            {nearbyRows.slice(0, 2).map((row) => <div className={styles.nearbyClinic} key={row.id}><span><strong>{row.name}</strong><small>{distance(row)}</small></span><b className={row.risk === 'warning' ? styles.warningText : undefined}>{row.riskLabel}</b></div>)}
          </article>
        </aside>
      </section>
    </main>
  );
}

export function MedicineSenderClinicsContent() {
  const [selectedClinic, setSelectedClinic] = useState<ClinicRow | null>(null);
  const [rows, setRows] = useState<ClinicRow[]>([]);

  async function refreshRows() {
    getIfkFacilities()
      .then(setRows)
      .catch(() => setRows([]));
  }

  useEffect(() => {
    void refreshRows();
  }, []);

  const selectedRecommendation = selectedClinic?.activeRecommendation ?? undefined;
  const nearbyRows = selectedClinic ? rows.filter((row) => selectedClinic.nearbyCandidates.some((candidate) => candidate.id === row.id)) : [];

  return (
    <div className={styles.clinicsShell}>
      <ClinicsSidebar detail={Boolean(selectedClinic)} />
      <div className={styles.clinicsWorkspace}>
        <ClinicsTopbar detail={Boolean(selectedClinic)} />
        {selectedClinic ? <ClinicDetail clinic={selectedClinic} nearbyRows={nearbyRows} recommendation={selectedRecommendation} onBack={() => setSelectedClinic(null)} /> : <ClinicsList rows={rows} onRefresh={() => void refreshRows()} onView={setSelectedClinic} />}
      </div>
    </div>
  );
}
