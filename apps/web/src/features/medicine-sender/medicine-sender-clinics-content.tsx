'use client';

import { useState } from 'react';
import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
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

const clinicRows: ClinicRow[] = [
  {
    id: 'MD-0019',
    name: 'Klinik Pratama Daruba',
    location: 'Kecamatan Cangkringan, Kab. Sleman',
    logisticDate: '12 - OCT - 2023',
    stockout: '02 Days',
    stockItem: 'Oxytocin 10IU',
    deliveries: '18',
    risk: 'critical',
    riskLabel: 'Critical',
    weather: 'High Surge',
    weatherTone: 'danger',
    weatherIcon: 'alert',
  },
  {
    id: 'HU-0241',
    name: 'Puskesmas Tobelo Central',
    location: 'Kecamatan Cangkringan, Kab. Sleman',
    logisticDate: '28 - OCT - 2023',
    stockout: '11 Days',
    stockItem: 'Oxytocin 10IU',
    deliveries: '42',
    risk: 'warning',
    riskLabel: 'Warning',
    weather: 'Stable',
    weatherTone: 'neutral',
    weatherIcon: 'sun',
  },
  {
    id: 'HT-0082',
    name: 'Klinik Apung Weda',
    location: 'Kecamatan Cangkringan, Kab. Sleman',
    logisticDate: '01 - NOV - 2023',
    stockout: '24 Days',
    stockItem: 'Oxytocin 10IU',
    deliveries: '05',
    risk: 'routine',
    riskLabel: 'Routine',
    weather: 'Moderate Rain',
    weatherTone: 'neutral',
    weatherIcon: 'cloudRain',
  },
  {
    id: 'KS-1102',
    name: 'RSUD Sanana Sector 4',
    location: 'Kecamatan Cangkringan, Kab. Sleman',
    logisticDate: '25 - OCT - 2023',
    stockout: '19 Days',
    stockItem: 'Oxytocin 10IU',
    deliveries: '31',
    risk: 'routine',
    riskLabel: 'Routine',
    weather: 'Strong Wind',
    weatherTone: 'danger',
    weatherIcon: 'alert',
  },
];

const stats = [
  { label: 'Total Facilities', value: '142', tone: 'clinicStatBlue' },
  { label: 'Critical (Stockout)', value: '08', tone: 'clinicStatRed', delta: '+2%' },
  { label: 'In Transit', value: '24', tone: 'clinicStatGreen' },
];

const medicationRows = [
  { name: 'Oxytocin 10IU', stock: '5 ampules', stockTone: 'danger', needs: '45', days: '2 Days', status: 'Critical' },
  { name: 'MgSO4 40%', stock: '18 vial', stockTone: 'danger', needs: '20', days: '6 Days', status: 'Warning' },
  { name: 'Tablet Fe 60mg', stock: '120 strip', stockTone: 'safe', needs: '300', days: '28 Days', status: 'Safe' },
];

function splitName(name: string) {
  const words = name.split(' ');
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')].filter(Boolean);
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
        <a href="/medicine-sender"><AppIcon name="home" width={20} height={20} />Dashboard</a>
        <a className={detail ? styles.clinicsNavActive : undefined} href="/medicine-sender/recommendations"><AppIcon name="userPlus" width={20} height={20} />Distribution</a>
        <a className={!detail ? styles.clinicsNavActive : undefined} href="/medicine-sender/clinics"><AppIcon name="users" width={20} height={20} />Clinic List</a>
        <a href="/medicine-sender/environment"><AppIcon name="calendar" width={20} height={20} />Environment Monitoring</a>
      </nav>
    </aside>
  );
}

function ClinicsTopbar({ detail }: { detail: boolean }) {
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
        <button type="button" aria-label="Notifikasi"><AppIcon name="bell" width={18} height={18} /></button>
        <button type="button" aria-label="Bantuan"><AppIcon name="info" width={18} height={18} /></button>
        <span className={styles.clinicsAvatar}><AppIcon name="clipboard" width={16} height={16} /></span>
      </div>
    </header>
  );
}

function ClinicTable({ onView }: { onView: (clinic: ClinicRow) => void }) {
  return (
    <div className={styles.clinicTableCard}>
      <div className={styles.clinicFilters}>
        <button type="button"><AppIcon name="filter" width={16} height={16} />Filter <AppIcon name="chevronDown" width={14} height={14} /></button>
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
          {clinicRows.map((clinic) => (
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
                  <button type="button" aria-label={`Menu ${clinic.name}`}><AppIcon name="moreVertical" width={18} height={18} /></button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.clinicPagination}>
        <span>Showing 1-4 of 142 health facilities</span>
        <div>
          <button type="button" aria-label="Halaman sebelumnya"><AppIcon name="chevronLeft" width={14} height={14} /></button>
          <button type="button" className={styles.currentPage}>1</button>
          <button type="button">2</button>
          <button type="button">3</button>
          <span>...</span>
          <button type="button">36</button>
          <button type="button" aria-label="Halaman berikutnya"><AppIcon name="chevronRight" width={14} height={14} /></button>
        </div>
      </div>
    </div>
  );
}

function ClinicsList({ onView }: { onView: (clinic: ClinicRow) => void }) {
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
          <Button className={styles.clinicsGhostButton} icon={<AppIcon name="upload" width={16} height={16} />}>Export CSV</Button>
          <Button type="primary" className={styles.clinicsPrimaryButton} icon={<AppIcon name="plus" width={16} height={16} />}>Add Clinic</Button>
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
        <ClinicTable onView={onView} />
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
                  {medicationRows.map((item) => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td className={styles[item.stockTone]}>{item.stock}</td>
                      <td>{item.needs}</td>
                      <td><span>{item.days}</span></td>
                      <td><b className={styles[item.status.toLowerCase()]}>{item.status}</b></td>
                    </tr>
                  ))}
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

  return (
    <div className={styles.clinicsShell}>
      <ClinicsSidebar detail={Boolean(selectedClinic)} />
      <div className={styles.clinicsWorkspace}>
        <ClinicsTopbar detail={Boolean(selectedClinic)} />
        {selectedClinic ? <ClinicDetail clinic={selectedClinic} onBack={() => setSelectedClinic(null)} /> : <ClinicsList onView={setSelectedClinic} />}
      </div>
    </div>
  );
}
