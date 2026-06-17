'use client';

import dynamic from 'next/dynamic';
import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { useEffect, useMemo, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { getAlerts, getCurrentUser, getPuskesmas, type AlertRecord, type CurrentUser, type PuskesmasRecord } from '@/lib/api';
import { routes } from '@/lib/routes';
import { getNextAlertFeedState } from './alert-feed-state';
import type { EnvironmentalPoint } from './environment-monitoring-data';
import styles from './environment-monitoring.module.css';

const EnvironmentMap = dynamic(() => import('./components/environment-map').then((module) => module.EnvironmentMap), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Memuat peta lingkungan...</div>,
});

type ForecastRisk = 'stable' | 'warning' | 'blocked';
type ForecastItem = { location: string; risk: ForecastRisk; status: string; temperature: string; metric: string; bars: Array<'low' | 'medium' | 'high' | 'critical'> };
type RouteRow = { id: string; route: string; clinics: string; risk: number; status: 'critical' | 'operational' | 'elevated'; blockedAt: string; confidence: string };

const riskIcon: Record<ForecastRisk, 'activity' | 'alert'> = {
  stable: 'activity',
  warning: 'alert',
  blocked: 'alert',
};

const statusLabel: Record<RouteRow['status'], string> = {
  critical: 'Critical',
  operational: 'Operational',
  elevated: 'Elevated',
};

function RoleSidebar({ onUnavailable, user }: { onUnavailable: (feature: string) => void; user: CurrentUser | null }) {
  return (
    <aside className={styles.sidebar} aria-label="Medicine sender navigation">
      <div className={styles.roleBrand}>
        <span className={styles.brandIcon}><AppIcon name="briefcase" width={20} height={20} /></span>
        <div>
          <Typography.Title level={2}>IFK</Typography.Title>
          <Typography.Text>District Monitoring</Typography.Text>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Navigasi medicine sender">
        <a href={routes.ifk}><AppIcon name="home" width={18} height={18} />Dashboard</a>
        <a href={routes.ifkRecommendations}><AppIcon name="userPlus" width={18} height={18} />Distribution</a>
        <a href={routes.ifkClinics}><AppIcon name="users" width={18} height={18} />Clinic List</a>
        <a className={styles.navActive} href={routes.ifkEnvironment}><AppIcon name="calendar" width={18} height={18} />Environment Monitoring</a>
      </nav>

      <div className={styles.supportNav}>
        <a href={routes.ifkEnvironment} onClick={(event) => { event.preventDefault(); onUnavailable('Settings'); }}><AppIcon name="settings" width={20} height={20} />Settings</a>
        <div className={styles.officerCard}>
          <span><AppIcon name="user" width={18} height={18} /></span>
          <strong>{user?.displayName ?? user?.username ?? 'IFK Officer'}</strong>
          <small>{user?.role ?? 'IFK_ADMIN'}</small>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ onUnavailable, user }: { onUnavailable: (feature: string) => void; user: CurrentUser | null }) {
  return (
    <header className={styles.topbar}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <a href="/">Home</a>
        <AppIcon name="chevronRight" width={14} height={14} />
        <a href={routes.ifkClinics}>Clinic List</a>
        <AppIcon name="chevronRight" width={14} height={14} />
        <span>Environment Monitoring</span>
      </nav>
      <div className={styles.topbarActions}>
        <button type="button" aria-label="Notifikasi" className={styles.notificationButton} onClick={() => onUnavailable('Notifikasi')}><AppIcon name="bell" width={20} height={20} /><span /></button>
        <button type="button" aria-label="Pengaturan" onClick={() => onUnavailable('Pengaturan')}><AppIcon name="settings" width={20} height={20} /></button>
        <div className={styles.topbarProfile}>
          <div>
            <strong>{user?.displayName ?? user?.username ?? 'Pharmacy Management'}</strong>
            <small>{user?.role ?? 'Administrator'}</small>
          </div>
          <img src="/figma-dashboard/profil-bidan.png" alt="Pharmacy administrator" />
        </div>
      </div>
    </header>
  );
}

function ForecastCard({ item }: { item: ForecastItem }) {
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

function AlertFeed() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);

  useEffect(() => {
    getAlerts().then(setAlerts).catch(() => setAlerts([]));
  }, []);

  return (
    <aside className={[styles.alertFeed, isCollapsed ? styles.alertFeedCollapsed : ''].filter(Boolean).join(' ')} aria-label="Live environmental alert feed">
      <button
        type="button"
        className={styles.alertFeedHeader}
        aria-controls="environment-alert-feed-body"
        aria-expanded={!isCollapsed}
        onClick={() => setIsCollapsed((current) => getNextAlertFeedState(current))}
      >
        <span>Live alert feed</span>
        <AppIcon name="alert" width={14} height={14} />
      </button>
      {!isCollapsed ? (
        <div id="environment-alert-feed-body" className={styles.alertFeedBody}>
          {alerts.length === 0 ? <article><strong>No active alerts</strong><p>Belum ada alert distribusi dari database.</p><small><i />SYSTEM</small></article> : null}
          {alerts.slice(0, 5).map((alert) => (
            <article key={alert.id}>
              <strong className={alert.severity === 'CRITICAL' ? styles.primaryAlert : undefined}>{alert.type.replaceAll('_', ' ')}</strong>
              <p>{alert.message}</p>
              <small><i className={alert.severity === 'CRITICAL' ? styles.primaryDot : undefined} />{alert.puskesmasId} - {new Date(alert.createdAt).toLocaleString('id-ID')}</small>
            </article>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

function RiskTable({ rows }: { rows: RouteRow[] }) {
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
            {rows.length === 0 ? <tr><td colSpan={6}>Belum ada data rute.</td></tr> : null}
            {rows.map((item) => (
              <tr key={item.id}>
                <td><span>{item.id}<br />({item.route})</span></td>
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
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [puskesmas, setPuskesmas] = useState<PuskesmasRecord[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function explainUnavailable(feature: string) {
    setNotice(`${feature} akan diaktifkan pada batch integrasi data berikutnya.`);
  }

  useEffect(() => {
    Promise.all([getAlerts(), getPuskesmas(), getCurrentUser()])
      .then(([nextAlerts, nextPuskesmas, nextUser]) => {
        setAlerts(nextAlerts);
        setPuskesmas(nextPuskesmas);
        setUser(nextUser);
      })
      .catch(() => undefined);
  }, []);

  const environmentalPoints = useMemo<EnvironmentalPoint[]>(() => [], []);

  const forecasts = useMemo<ForecastItem[]>(() => puskesmas.slice(0, 3).map((item) => {
    const alert = alerts.find((row) => row.puskesmasId === item.id);
    const risk: ForecastRisk = alert?.severity === 'CRITICAL' || item.rainyAccess === 'TERGANGGU' ? 'blocked' : alert ? 'warning' : 'stable';
    return { location: item.nama, risk, status: risk === 'blocked' ? 'Blocked risk' : risk === 'warning' ? 'Elevated' : 'Stable', temperature: `${item.leadTimeHari ?? 0}d`, metric: `Lead time - ${item.rainyAccess}`, bars: risk === 'blocked' ? ['high', 'critical', 'critical', 'high', 'medium', 'medium', 'high'] : risk === 'warning' ? ['medium', 'medium', 'high', 'medium', 'low', 'medium', 'high'] : ['low', 'low', 'medium', 'low', 'low', 'medium', 'low'] };
  }), [alerts, puskesmas]);

  const routeRows = useMemo<RouteRow[]>(() => puskesmas.map((item) => {
    const alert = alerts.find((row) => row.puskesmasId === item.id);
    const risk = alert?.severity === 'CRITICAL' ? 95 : alert?.severity === 'HIGH' ? 82 : item.rainyAccess === 'TERBATAS' ? 58 : 25;
    return { id: item.id, route: `IFK-${item.id}`, clinics: item.nama, risk, status: risk >= 80 ? 'critical' : risk >= 50 ? 'elevated' : 'operational', blockedAt: alert ? new Date(alert.createdAt).toLocaleDateString('id-ID') : '-', confidence: alert ? alert.severity : 'LOW' };
  }), [alerts, puskesmas]);

  return (
    <div className={styles.shell}>
      <RoleSidebar onUnavailable={explainUnavailable} user={user} />
      <div className={styles.workspace}>
        <Topbar onUnavailable={explainUnavailable} user={user} />
        <main className={styles.page}>
          {notice ? <p role="status" className={styles.environmentNotice}>{notice}</p> : null}
          <section className={styles.pageHeader} aria-labelledby="environment-title">
            <div>
              <Typography.Text className={styles.eyebrow}>Intelligence Hub / Regional Sector 04</Typography.Text>
              <Typography.Title id="environment-title" level={1}>Environment Monitoring</Typography.Title>
            </div>
            <Button type="primary" className={styles.exportButton} icon={<AppIcon name="upload" width={14} height={14} />} onClick={() => window.print()}>
              Print PDF Report
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
              <p role="status" className={styles.environmentNotice}>Koordinat fasilitas belum tersedia di database; risiko rute ditampilkan lewat tabel dan feed alert.</p>
            </div>
          </section>

          <section className={styles.forecastSection} aria-labelledby="forecast-title">
            <div className={styles.sectionTitle}>
              <Typography.Title id="forecast-title" level={2}><AppIcon name="calendar" width={18} height={18} />14-Day Strategic Forecast</Typography.Title>
              <Typography.Text>Intelligence nodes tracking</Typography.Text>
            </div>
            <div className={styles.forecastGrid}>{forecasts.length === 0 ? <article className={styles.forecastCard}><Typography.Title level={3}>No monitored facility</Typography.Title></article> : forecasts.map((item) => <ForecastCard key={item.location} item={item} />)}</div>
          </section>

          <section className={styles.routeSection} aria-labelledby="route-title">
            <div className={styles.sectionTitle}>
              <Typography.Title id="route-title" level={2}><AppIcon name="activity" width={18} height={18} />Supply Chain Route Vulnerability</Typography.Title>
            </div>
            <RiskTable rows={routeRows} />
          </section>
          <AlertFeed />
        </main>
      </div>
    </div>
  );
}
