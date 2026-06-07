'use client';

import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import styles from './medicine-sender.module.css';

type ClinicRisk = 'critical' | 'warning' | 'nominal';
type WeatherTone = 'danger' | 'neutral';

type ClinicRow = {
  id: string;
  name: string[];
  island: string[];
  logisticDate: string[];
  stockout: string;
  deliveries: string;
  risk: ClinicRisk;
  weather: string[];
  weatherTone: WeatherTone;
  weatherIcon: AppIconName;
};

const clinicRows: ClinicRow[] = [
  {
    id: 'MD-0019',
    name: ['Klinik', 'Pratama', 'Daruba'],
    island: ['Pulau', 'Morotai'],
    logisticDate: ['12-OCT-', '2023'],
    stockout: '02 Hari',
    deliveries: '18',
    risk: 'critical',
    weather: ['HIGH', 'SURGE'],
    weatherTone: 'danger',
    weatherIcon: 'activity',
  },
  {
    id: 'HU-0241',
    name: ['Puskesmas', 'Tobelo', 'Central'],
    island: ['Halmahera', 'Utara'],
    logisticDate: ['28-OCT-', '2023'],
    stockout: '11 Hari',
    deliveries: '42',
    risk: 'warning',
    weather: ['STABLE'],
    weatherTone: 'neutral',
    weatherIcon: 'sun',
  },
  {
    id: 'HT-0082',
    name: ['Klinik', 'Apung', 'Weda'],
    island: ['Halmahera', 'Tengah'],
    logisticDate: ['01-NOV-', '2023'],
    stockout: '24 Hari',
    deliveries: '05',
    risk: 'nominal',
    weather: ['MODERATE', 'RAIN'],
    weatherTone: 'neutral',
    weatherIcon: 'cloudRain',
  },
  {
    id: 'KS-1102',
    name: ['RSUD', 'Sanana', 'Sector 4'],
    island: ['Kepulauan', 'Sula'],
    logisticDate: ['25-OCT-', '2023'],
    stockout: '19 Hari',
    deliveries: '31',
    risk: 'nominal',
    weather: ['STRONG', 'WIND'],
    weatherTone: 'danger',
    weatherIcon: 'alert',
  },
];

const stats = [
  { label: 'Total Fasilitas', value: '142', tone: 'clinicStatBlue' },
  { label: 'Kritis (Stockout)', value: '08', tone: 'clinicStatRed', delta: '+2%' },
  { label: 'Dalam Pengiriman', value: '24', tone: 'clinicStatGreen' },
  { label: 'Populasi Tercover', value: '89.4k', tone: 'clinicStatDark' },
];

function ClinicsSidebar() {
  return (
    <aside className={styles.clinicsSidebar} aria-label="Medicine sender navigation">
      <div className={styles.clinicsSector}>
        <Typography.Text>Eastern Sector</Typography.Text>
        <strong>Clinical Intelligence</strong>
      </div>
      <nav className={styles.clinicsNav} aria-label="Navigasi medicine sender">
        <a href="/medicine-sender"><AppIcon name="grid" width={16} height={16} />Dashboard</a>
        <a href="/medicine-sender/recommendations"><AppIcon name="truck" width={16} height={16} />Logistik Pengiriman</a>
        <a href="/medicine-sender/environment"><AppIcon name="activity" width={16} height={16} />Pemantauan Lingkungan</a>
        <a className={styles.clinicsNavActive} href="/medicine-sender/clinics"><AppIcon name="plus" width={16} height={16} />Semua Klinik</a>
        <a href="/medicine-sender/decision-history"><AppIcon name="clipboard" width={16} height={16} />Riwayat Keputusan</a>
      </nav>
      <div className={styles.clinicsSidebarBottom}>
        <a href="#settings"><AppIcon name="settings" width={16} height={16} />Settings</a>
        <a href="#support"><AppIcon name="info" width={16} height={16} />Support</a>
        <div className={styles.clinicsOfficer}>
          <span><AppIcon name="shield" width={20} height={20} /></span>
          <div>
            <strong>D. Health Officer</strong>
            <small>Sector Authority</small>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ClinicsTopbar() {
  return (
    <header className={styles.clinicsTopbar}>
      <div className={styles.clinicsBrand}>
        <AppIcon name="shield" width={18} height={18} />
        <Typography.Text>Sanctuary</Typography.Text>
      </div>
      <label className={styles.clinicsSearch}>
        <AppIcon name="search" width={14} height={14} />
        <span>Cari data klinik...</span>
      </label>
      <div className={styles.clinicsTopbarActions}>
        <button type="button" aria-label="Notifikasi"><AppIcon name="bell" width={18} height={18} /><i /></button>
        <button type="button" aria-label="Akun"><AppIcon name="user" width={20} height={20} /></button>
        <span />
        <button type="button" aria-label="Keluar"><AppIcon name="logOut" width={20} height={20} /></button>
      </div>
    </header>
  );
}

function ClinicTable() {
  return (
    <div className={styles.clinicTableCard}>
      <table className={styles.clinicTable}>
        <thead>
          <tr>
            <th>Nama Klinik</th>
            <th>Pulau</th>
            <th>Update<br />Logistik</th>
            <th>Estimasi<br />Stockout</th>
            <th>Persalinan</th>
            <th>Level<br />Risiko</th>
            <th>Kondisi<br />Cuaca</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {clinicRows.map((clinic) => (
            <tr key={clinic.id}>
              <td>
                <strong>{clinic.name.map((part) => <span key={part}>{part}</span>)}</strong>
                <small>{clinic.id}</small>
              </td>
              <td>{clinic.island.map((part) => <span key={part}>{part}</span>)}</td>
              <td className={styles.mono}>{clinic.logisticDate.map((part) => <span key={part}>{part}</span>)}</td>
              <td><b className={styles[`stockout${clinic.risk}`]}>{clinic.stockout}</b></td>
              <td><b>{clinic.deliveries}</b></td>
              <td><span className={[styles.clinicRisk, styles[clinic.risk]].join(' ')}>{clinic.risk}</span></td>
              <td>
                <span className={[styles.weatherCell, styles[clinic.weatherTone]].join(' ')}>
                  <AppIcon name={clinic.weatherIcon} width={16} height={16} />
                  <em>{clinic.weather.map((part) => <span key={part}>{part}</span>)}</em>
                </span>
              </td>
              <td>
                <span className={styles.clinicActions}>
                  <button type="button" aria-label={`Lihat ${clinic.name.join(' ')}`}><AppIcon name="eye" width={18} height={18} /></button>
                  <button type="button" aria-label={`Dispatch ${clinic.name.join(' ')}`}><AppIcon name="send" width={16} height={16} /></button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SnapshotCard() {
  return (
    <aside className={styles.snapshotCard} aria-label="Sector snapshot">
      <div className={styles.snapshotHeader}>
        <span><i />Sector Snapshot</span>
        <button type="button" aria-label="Tutup snapshot"><AppIcon name="x" width={14} height={14} /></button>
      </div>
      <div className={styles.snapshotMap}>
        <img src="/figma-clinics/sector-map.png" alt="Sector map around Ternate and Morotai" />
        <span className={styles.snapshotPulse} />
      </div>
      <p>Monitoring active logistical corridors between Ternate and Morotai. Atmospheric conditions stable across sector 4.</p>
    </aside>
  );
}

export function MedicineSenderClinicsContent() {
  return (
    <div className={styles.clinicsShell}>
      <ClinicsTopbar />
      <ClinicsSidebar />
      <main className={styles.clinicsPage}>
        <section className={styles.clinicsHeader} aria-labelledby="clinics-title">
          <div>
            <Typography.Text className={styles.clinicsBreadcrumb}>Registry <span>/</span> Infrastructure</Typography.Text>
            <Typography.Title id="clinics-title" level={1}>Semua Klinik</Typography.Title>
            <Typography.Paragraph>
              Centralized registry of health facilities within the Sanctuary network. Real-time monitoring of stock, atmospheric risks, and delivery schedules.
            </Typography.Paragraph>
          </div>
          <div className={styles.clinicsHeaderActions}>
            <Button className={styles.clinicsGhostButton} icon={<AppIcon name="upload" width={14} height={14} />}>Export CSV</Button>
            <Button type="primary" className={styles.clinicsPrimaryButton} icon={<AppIcon name="plus" width={14} height={14} />}>Tambah Klinik</Button>
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
          <div className={styles.clinicFilters}>
            <div>
              <label>Wilayah Pulau</label>
              <button type="button">Semua Pulau <AppIcon name="chevronDown" width={14} height={14} /></button>
            </div>
            <div>
              <label>Status Risiko</label>
              <button type="button">Semua Status <AppIcon name="chevronDown" width={14} height={14} /></button>
            </div>
            <span>Records: 25 / 142</span>
          </div>
          <ClinicTable />
        </section>

        <div className={styles.clinicPagination}>
          <span>Page 1 of 6</span>
          <div>
            <button type="button" aria-label="Halaman sebelumnya"><AppIcon name="chevronLeft" width={14} height={14} /></button>
            <button type="button" className={styles.currentPage}>1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button" aria-label="Halaman berikutnya"><AppIcon name="chevronRight" width={14} height={14} /></button>
          </div>
        </div>
      </main>
      <SnapshotCard />
    </div>
  );
}
