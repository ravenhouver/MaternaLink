'use client';

import dynamic from 'next/dynamic';
import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import { environmentalPoints, forecasts, routeVulnerabilities, type ForecastRisk, type RouteVulnerability } from './environment-monitoring-data';
import styles from './environment-monitoring.module.css';

const EnvironmentMap = dynamic(() => import('./components/environment-map').then((module) => module.EnvironmentMap), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Memuat peta lingkungan...</div>,
});

const riskIcon: Record<ForecastRisk, 'activity' | 'alert'> = {
  stable: 'activity',
  warning: 'alert',
  blocked: 'alert',
};

const statusLabel: Record<RouteVulnerability['status'], string> = {
  critical: 'Critical',
  operational: 'Operational',
  elevated: 'Elevated',
};

function RoleSidebar() {
  return (
    <aside className={styles.sidebar} aria-label="Medicine sender navigation">
      <div className={styles.sectorCard}>
        <span className={styles.sectorAvatar}>DHO</span>
        <span>
          <strong>Eastern Sector</strong>
          <small>Medical Intelligence</small>
        </span>
      </div>

      <nav className={styles.nav} aria-label="Navigasi medicine sender">
        <a href="/medicine-sender"><AppIcon name="home" width={18} height={18} />Dashboard</a>
        <a href="/medicine-sender/recommendations"><AppIcon name="send" width={18} height={18} />Rekomendasi Pengiriman</a>
        <a className={styles.navActive} href="/medicine-sender/environment"><AppIcon name="activity" width={18} height={18} />Pemantauan Lingkungan</a>
        <a href="#clinic-routes"><AppIcon name="package" width={18} height={18} />Semua Klinik</a>
        <a href="#clinic-routes"><AppIcon name="clipboard" width={18} height={18} />Riwayat Keputusan</a>
      </nav>

      <div className={styles.supportNav}>
        <a href="#settings"><AppIcon name="settings" width={20} height={20} />Settings</a>
        <a href="#support"><AppIcon name="info" width={20} height={20} />Support</a>
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className={styles.topbar}>
      <Typography.Text className={styles.brand}>Nusantara <span>Digital Sanctuary</span></Typography.Text>
      <div className={styles.topbarActions}>
        <button type="button" aria-label="Notifikasi"><AppIcon name="bell" width={20} height={20} /></button>
        <button type="button" aria-label="Akun"><AppIcon name="user" width={20} height={20} /></button>
        <button type="button" aria-label="Keluar"><AppIcon name="arrowRight" width={20} height={20} /></button>
      </div>
    </header>
  );
}

function ForecastCard({ item }: { item: (typeof forecasts)[number] }) {
  return (
    <article className={styles.forecastCard} data-risk={item.risk}>
      <div className={styles.forecastHeader}>
        <Typography.Title level={3}>{item.location}</Typography.Title>
        <span className={[styles.statusChip, styles[item.risk]].join(' ')}>{item.status}</span>
      </div>
      <div className={styles.weatherReadout}>
        <AppIcon name={riskIcon[item.risk]} width={34} height={34} />
        <span>
          <strong>{item.temperature}</strong>
          <small>{item.metric}</small>
        </span>
      </div>
      <div className={styles.rainBars} aria-label={`Prakiraan 7 hari ${item.location}`}>
        {item.bars.map((tone, index) => <span key={`${item.location}-${index}`} className={styles[tone]} />)}
      </div>
      <div className={styles.dayLabels}><small>Day 1</small><small>Day 7</small></div>
    </article>
  );
}

function RiskTable() {
  return (
    <section id="clinic-routes" className={styles.routePanel} aria-label="Route vulnerability table">
      <div className={styles.tableWrap}>
        <table className={styles.routeTable}>
          <thead>
            <tr>
              <th>Sector Route ID</th>
              <th>Clinics Served</th>
              <th>Risk Factor</th>
              <th>Current Status</th>
              <th>Predicted Blockage Date</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {routeVulnerabilities.map((item) => (
              <tr key={item.id}>
                <td><a href={`#${item.id}`}>{item.id}<br />({item.route})</a></td>
                <td>{item.clinics}</td>
                <td>
                  <div className={styles.riskMeter}>
                    <span><i style={{ width: `${item.risk}%` }} /></span>
                    <strong className={item.risk >= 80 ? styles.criticalText : ''}>{item.risk}%</strong>
                  </div>
                </td>
                <td><span className={[styles.routeStatus, styles[item.status]].join(' ')}>{statusLabel[item.status]}</span></td>
                <td><strong>{item.blockedAt}</strong></td>
                <td>{item.confidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function EnvironmentMonitoringContent() {
  return (
    <div className={styles.shell}>
      <RoleSidebar />
      <div className={styles.workspace}>
        <Topbar />
        <main className={styles.page}>
          <section className={styles.pageHeader} aria-labelledby="environment-title">
            <div>
              <Typography.Text className={styles.eyebrow}>Intelligence Hub / Regional Sector 04</Typography.Text>
              <Typography.Title id="environment-title" level={1}>Pemantauan Lingkungan</Typography.Title>
            </div>
            <Button type="primary" className={styles.exportButton} icon={<AppIcon name="upload" width={14} height={14} />}>
              Export PDF Report
            </Button>
          </section>

          <section className={styles.mapPanel} aria-labelledby="rainfall-title">
            <div className={styles.panelHeading}>
              <Typography.Title id="rainfall-title" level={2}><span />Rainfall Intensity &amp; Geospatial Risk</Typography.Title>
              <div className={styles.legend} aria-label="Risk legend">
                <span><i className={styles.low} />Low</span>
                <span><i className={styles.medium} />Med</span>
                <span><i className={styles.high} />High</span>
                <span><i className={styles.critical} />Critical</span>
              </div>
            </div>
            <div className={styles.mapCanvas}>
              <EnvironmentMap points={environmentalPoints} />
            </div>
          </section>

          <section className={styles.forecastSection} aria-labelledby="forecast-title">
            <div className={styles.sectionTitle}>
              <Typography.Title id="forecast-title" level={2}>14-Day Strategic Forecast</Typography.Title>
              <Typography.Text>Intelligence nodes tracking</Typography.Text>
            </div>
            <div className={styles.forecastGrid}>{forecasts.map((item) => <ForecastCard key={item.location} item={item} />)}</div>
          </section>

          <RiskTable />
        </main>
      </div>
    </div>
  );
}
