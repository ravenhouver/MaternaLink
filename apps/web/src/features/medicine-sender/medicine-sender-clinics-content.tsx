'use client';

import { useEffect, useState } from 'react';
import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { getPuskesmas, type PuskesmasRecord } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './medicine-sender.module.css';

type ClinicRisk = 'critical' | 'warning' | 'routine';
type WeatherTone = 'danger' | 'neutral';

type ClinicRow = {
  id: string;
  name: string;
  location: string;
  logisticDate: string;
  stockout: string;
  stockItem: string;
  deliveries: string;
  risk: ClinicRisk;
  riskLabel: string;
  weather: string;
  weatherTone: WeatherTone;
  weatherIcon: AppIconName;
};

function mapPuskesmasToClinic(row: PuskesmasRecord, index: number): ClinicRow {
  const risk: ClinicRisk = row.rainyAccess === 'TERGANGGU' ? 'critical' : row.rainyAccess === 'TERBATAS' ? 'warning' : 'routine';
  return {
    id: row.id,
    name: row.nama,
    location: [row.kecamatan, row.kabupatenKota, row.provinsi].filter(Boolean).join(', '),
    logisticDate: new Date().toLocaleDateString('id-ID'),
    stockout: row.coldChainReady ? 'Safe' : 'Review',
    stockItem: row.coldChainReady ? 'Cold chain ready' : 'Cold chain gap',
    deliveries: String(Math.max(1, 20 - index * 3)).padStart(2, '0'),
    risk,
    riskLabel: risk === 'critical' ? 'Critical' : risk === 'warning' ? 'Warning' : 'Routine',
    weather: row.rainyAccess,
    weatherTone: risk === 'critical' ? 'danger' : 'neutral',
    weatherIcon: risk === 'critical' ? 'alert' : 'sun',
  };
}

function splitName(name: string) {
  const words = name.split(' ');
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')].filter(Boolean);
}

function downloadClinicCsv(rows: ClinicRow[]) {
  const header = ['id', 'name', 'location', 'risk', 'weather', 'deliveries'].join(',');
  const body = rows.map((row) => [row.id, row.name, row.location, row.riskLabel, row.weather, row.deliveries].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
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
    </aside>
  );
}

function ClinicsTopbar({ detail, onUnavailable }: { detail: boolean; onUnavailable: (feature: string) => void }) {
  return (
    <header className={styles.clinicsTopbar}>
      <div className={styles.clinicsCrumbs}>
        <span>Distribusi</span>
        <AppIcon name="chevronRight" width={14} height={14} />
        <span>Rekomendasi Distribusi</span>
        <AppIcon name="chevronRight" width={14} height={14} />
        <strong>{detail ? 'Detail: Puskesmas Cangkringan' : 'Clinic List'}</strong>
      </div>
      <div className={styles.clinicsTopbarActions}>
        <strong>Petugas IFK</strong>
        <button type="button" aria-label="Notifikasi" onClick={() => onUnavailable('Notifikasi')}><AppIcon name="bell" width={18} height={18} /></button>
        <button type="button" aria-label="Bantuan" onClick={() => onUnavailable('Bantuan')}><AppIcon name="info" width={18} height={18} /></button>
        <span className={styles.clinicsAvatar}><AppIcon name="clipboard" width={16} height={16} /></span>
      </div>
    </header>
  );
}

function ClinicTable({ onUnavailable, onView, rows }: { onUnavailable: (feature: string) => void; onView: (clinic: ClinicRow) => void; rows: ClinicRow[] }) {
  return (
    <div className={styles.clinicTableCard}>
      <div className={styles.clinicFilters}>
        <button type="button" onClick={() => onUnavailable('Clinic filters')}><AppIcon name="filter" width={16} height={16} />Filter <AppIcon name="chevronDown" width={14} height={14} /></button>
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
          {rows.map((clinic) => (
            <tr key={clinic.id}>
              <td>
                <strong>{splitName(clinic.name).map((part) => <span key={part}>{part}</span>)}</strong>
                <small>{clinic.id}</small>
              </td>
              <td>{clinic.location.split(', ').map((part) => <span key={part}>{part}</span>)}</td>
              <td className={styles.mono}>{clinic.logisticDate.split(' - ').map((part, index) => <span key={`${clinic.id}-${part}`}>{index < 2 ? `${part} -` : part}</span>)}</td>
              <td><b className={styles[`stockout${clinic.risk}`]}>{clinic.stockout}</b><small>{clinic.stockItem}</small></td>
              <td><b>{clinic.deliveries}</b></td>
              <td><span className={[styles.clinicRisk, styles[clinic.risk]].join(' ')}>{clinic.riskLabel}</span></td>
              <td>
                <span className={[styles.weatherCell, styles[clinic.weatherTone]].join(' ')}>
                  <AppIcon name={clinic.weatherIcon} width={16} height={16} />
                  <em>{clinic.weather.split(' ').map((part) => <span key={part}>{part}</span>)}</em>
                </span>
              </td>
              <td>
                <span className={styles.clinicActions}>
                  <button type="button" aria-label={`Lihat ${clinic.name}`} onClick={() => onView(clinic)}><AppIcon name="eye" width={18} height={18} /></button>
                  <button type="button" aria-label={`Menu ${clinic.name}`} onClick={() => onUnavailable(`Menu ${clinic.name}`)}><AppIcon name="moreVertical" width={18} height={18} /></button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.clinicPagination}>
        <span>Showing {rows.length} health facilities</span>
        <div>
          <button type="button" aria-label="Halaman sebelumnya" disabled><AppIcon name="chevronLeft" width={14} height={14} /></button>
          <button type="button" className={styles.currentPage}>1</button>
          <button type="button" aria-label="Halaman berikutnya" disabled><AppIcon name="chevronRight" width={14} height={14} /></button>
        </div>
      </div>
    </div>
  );
}

function ClinicsList({ onUnavailable, onView, rows }: { onUnavailable: (feature: string) => void; onView: (clinic: ClinicRow) => void; rows: ClinicRow[] }) {
  const stats: Array<{ label: string; value: string; tone: string; delta?: string }> = [
    { label: 'Total Facilities', value: String(rows.length), tone: 'clinicStatBlue' },
    { label: 'Critical (Stockout)', value: String(rows.filter((row) => row.risk === 'critical').length), tone: 'clinicStatRed' },
    { label: 'Safe Facilities', value: String(rows.filter((row) => row.risk === 'routine').length), tone: 'clinicStatGreen' },
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
          <Button className={styles.clinicsGhostButton} icon={<AppIcon name="upload" width={16} height={16} />} onClick={() => downloadClinicCsv(rows)}>Export CSV</Button>
          <Button type="primary" className={styles.clinicsPrimaryButton} icon={<AppIcon name="plus" width={16} height={16} />} onClick={() => onUnavailable('Add clinic')}>Add Clinic</Button>
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
        <ClinicTable rows={rows} onView={onView} onUnavailable={onUnavailable} />
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

function ClinicDetail({ clinic, onBack }: { clinic: ClinicRow; onBack: () => void }) {
  return (
    <main className={styles.clinicDetailPage}>
      <section className={styles.detailHeader}>
        <button type="button" aria-label="Kembali ke clinic list" onClick={onBack}><AppIcon name="arrowLeft" width={24} height={24} /></button>
        <div>
          <span><Typography.Title level={1}>{clinic.name}</Typography.Title><b>Critical</b></span>
          <Typography.Text>ID: PKM-CGK-001 • Kecamatan Cangkringan, Kab. Sleman</Typography.Text>
        </div>
      </section>

      <section className={styles.criticalAlert}>
        <span><AppIcon name="alert" width={24} height={24} /></span>
        <p>Oxytocin stock expected to run out in 2 days - immediate action required.</p>
      </section>

      <section className={styles.detailGrid}>
        <div className={styles.detailMainColumn}>
          <article className={styles.detailCard}>
            <h2><AppIcon name="idCard" width={18} height={18} />Clinic Profile</h2>
            <div className={styles.profileGrid}>
              <DetailMetric label="Head of Clinic" value="dr. Siti Aminah, Sp.OG" />
              <DetailMetric label="Confirmation Status" value="Confirmed" tone="safe" />
              <DetailMetric label="Cold Chain Facilities" value="Yes (Cold Chain Active)" />
              <DetailMetric label="Total Active Pregnancies" value="42" />
            </div>
          </article>

          <article className={styles.detailCard}>
            <div className={styles.detailCardHeader}>
              <h2>Medication & Supplies</h2>
              <small>Last Update: 10 mins ago</small>
            </div>
            <div className={styles.suppliesTableWrap}>
              <table className={styles.suppliesTable}>
                <thead>
                  <tr><th>Medication Name</th><th>Stock</th><th>Needs</th><th>Days Remaining</th><th>Status</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Cold chain facility</td>
                    <td className={clinic.risk === 'critical' ? styles.danger : styles.safe}>{clinic.stockItem}</td>
                    <td>{clinic.deliveries}</td>
                    <td><span>{clinic.stockout}</span></td>
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
                <li><AppIcon name="info" width={16} height={16} />Oxytocin stock is critical, insufficient for the next 48 hours.</li>
                <li><AppIcon name="users" width={16} height={16} />12 pregnant women in 3rd Trimester registered (High PPH risk).</li>
                <li><AppIcon name="activity" width={16} height={16} />Historical surge in demand reached +42% in this area.</li>
                <li><AppIcon name="mapPin" width={16} height={16} />Remote location with high logistics lead time (&gt;40m).</li>
              </ul>
              <div className={styles.urgencyBox}>
                <DetailMetric label="Urgency Score" value="94/100" tone="danger" />
                <div className={styles.urgencyTrack}><span /></div>
                <DetailMetric label="Equity Priority" value="High" />
                <DetailMetric label="AI Confidence" value="97.2%" tone="safe" />
              </div>
            </div>
          </article>
        </div>

        <aside className={styles.detailSideColumn}>
          <article className={styles.routeCard}>
            <h2><AppIcon name="route" width={20} height={20} />Optimized Logistics Route</h2>
            <div className={styles.routeImage}>
              <img src="/figma-clinics/sector-map.png" alt="Optimized route map" />
              <span><b>Jarak: 24km</b><b>Estimasi: 45 Menit</b></span>
            </div>
            <p>Service Window Today: <strong>10:00 - 14:00</strong></p>
          </article>

          <article className={styles.detailCard}>
            <h2><AppIcon name="rotateCcw" width={20} height={20} />Shipping History</h2>
            {['28 Oct 2024', '15 Oct 2024', '02 Oct 2024'].map((date, index) => (
              <div className={styles.historyRow} key={date}>
                <span><strong>{date}</strong><small>{index === 1 ? 'Emergency Request (Oxytocin)' : 'Monthly Routine Allocation'}</small></span>
                <b>Verified</b>
              </div>
            ))}
          </article>

          <article className={styles.detailCard}>
            <h2><AppIcon name="mapPin" width={20} height={20} />Nearby Clinics (Alt. Sourcing)</h2>
            <div className={styles.nearbyClinic}><span><strong>PKM Pakem</strong><small>Distance: 8km</small></span><b>Stock Safe</b></div>
            <div className={styles.nearbyClinic}><span><strong>PKM Ngemplak</strong><small>Distance: 12km</small></span><b className={styles.warningText}>Warning</b></div>
          </article>
        </aside>
      </section>
    </main>
  );
}

export function MedicineSenderClinicsContent() {
  const [selectedClinic, setSelectedClinic] = useState<ClinicRow | null>(null);
  const [rows, setRows] = useState<ClinicRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  function explainUnavailable(feature: string) {
    setNotice(`${feature} akan diaktifkan pada batch integrasi data berikutnya.`);
  }

  useEffect(() => {
    getPuskesmas()
      .then((records) => {
        if (records.length) setRows(records.map(mapPuskesmasToClinic));
      })
      .catch(() => setRows([]));
  }, []);

  return (
    <div className={styles.clinicsShell}>
      <ClinicsSidebar detail={Boolean(selectedClinic)} />
      <div className={styles.clinicsWorkspace}>
        <ClinicsTopbar detail={Boolean(selectedClinic)} onUnavailable={explainUnavailable} />
        {notice ? <p role="status" className={styles.senderNotice}>{notice}</p> : null}
        {selectedClinic ? <ClinicDetail clinic={selectedClinic} onBack={() => setSelectedClinic(null)} /> : <ClinicsList rows={rows} onView={setSelectedClinic} onUnavailable={explainUnavailable} />}
      </div>
    </div>
  );
}
