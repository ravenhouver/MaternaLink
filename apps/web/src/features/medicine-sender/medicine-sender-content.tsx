'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import { getAlerts, getDashboardSummary, getPuskesmas, getRecommendations, type AlertRecord, type DistributionRecommendation, type PuskesmasRecord } from '@/lib/api';
import { routes } from '@/lib/routes';
import type { DashboardAction, DashboardKpi, TacticalPoint } from './medicine-sender-data';
import styles from './medicine-sender.module.css';

const SenderMap = dynamic(() => import('./components/sender-map').then((module) => module.SenderMap), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Memuat peta distribusi...</div>,
});

const statusLabels = {
  approved: 'Approved',
  rejected: 'Rejected',
  pending: 'Pending',
};

export function MedicineSenderContent() {
  const [mapMode, setMapMode] = useState<'map' | 'satellite'>('map');
  const [recommendations, setRecommendations] = useState<DistributionRecommendation[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [puskesmas, setPuskesmas] = useState<PuskesmasRecord[]>([]);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getDashboardSummary>> | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getRecommendations(), getAlerts(), getPuskesmas(), getDashboardSummary()])
      .then(([nextRecommendations, nextAlerts, nextPuskesmas, nextSummary]) => {
        setRecommendations(nextRecommendations);
        setAlerts(nextAlerts);
        setPuskesmas(nextPuskesmas);
        setSummary(nextSummary);
      })
      .catch(() => undefined);
  }, []);

  const dashboardKpis = useMemo<DashboardKpi[]>(() => [
    { label: 'Critical clinics', value: String(summary?.recommendations?.critical ?? recommendations.filter((item) => item.urgency === 'CRITICAL').length), delta: 'live DB', tone: 'critical', progress: 45 },
    { label: 'Warning clinics', value: String(recommendations.filter((item) => item.urgency === 'WARNING').length), delta: 'live DB', tone: 'warning', progress: 30 },
    { label: 'Safe clinics', value: String(Math.max(0, puskesmas.length - recommendations.length)), delta: 'registered', tone: 'safe', progress: 85 },
    { label: 'Pending approval', value: String(summary?.recommendations?.pending ?? recommendations.filter((item) => item.status === 'PENDING').length), delta: 'review queue', tone: 'primary', progress: 54, icon: 'clipboardCheck' },
  ], [puskesmas.length, recommendations, summary]);

  const dashboardActions = useMemo<DashboardAction[]>(() => recommendations.slice(0, 3).map((item, index) => {
    const alert = alerts.find((row) => row.puskesmasId === item.puskesmasId);
    return {
      id: item.id,
      name: item.puskesmas?.nama ?? item.puskesmasId,
      status: item.urgency === 'CRITICAL' ? 'critical' : item.urgency === 'WARNING' ? 'warning' : 'safe',
      statusLabel: item.urgency,
      updatedAt: new Date(item.periode).toLocaleDateString('id-ID'),
      weather: alert?.type.replaceAll('_', ' ') ?? 'No active alert',
      supply: item.items.map((row) => `${row.obat?.nama ?? row.obatId} ${row.finalQuantity}`).join(', '),
      pointStatus: item.urgency === 'CRITICAL' ? 'critical' : item.urgency === 'WARNING' ? 'anticipatory' : 'regular',
      position: [[-7.8122, 110.3892], [-7.7162, 110.3554], [-7.7765, 110.3689]][index] as [number, number],
    };
  }), [alerts, recommendations]);

  const dashboardMapPoints = useMemo<TacticalPoint[]>(() => dashboardActions.map((item) => ({ id: item.id, name: item.name, status: item.pointStatus, position: item.position })), [dashboardActions]);

  const dashboardApprovalLogs = useMemo(() => recommendations.slice(0, 5).map((item) => ({
    timestamp: item.trackingEvents?.[0] ? new Date(item.trackingEvents[0].createdAt).toLocaleString('id-ID') : new Date(item.periode).toLocaleDateString('id-ID'),
    entity: item.puskesmas?.nama ?? item.puskesmasId,
    action: item.items.map((row) => row.obat?.nama ?? row.obatId).join(', ') || item.source,
    operator: item.trackingEvents?.[0]?.actor?.username ?? 'SYSTEM',
    status: item.status === 'APPROVED' || item.status === 'DISPATCHED' || item.status === 'RECEIVED' ? 'approved' as const : item.status === 'REJECTED' ? 'rejected' as const : 'pending' as const,
  })), [recommendations]);

  function explainUnavailable(feature: string) {
    setNotice(`${feature} akan diaktifkan pada batch integrasi data berikutnya.`);
  }

  return (
    <div className={styles.senderShell}>
      <aside className={styles.roleSidebar} aria-label="Medicine sender navigation">
        <div className={styles.roleBrand}>
          <span className={styles.brandIcon}><AppIcon name="briefcase" width={20} height={20} /></span>
          <div>
            <Typography.Title level={2}>IFK</Typography.Title>
            <Typography.Text>District Monitoring</Typography.Text>
          </div>
        </div>

        <nav className={styles.roleNav}>
          <a className={styles.roleNavActive} href={routes.ifk}>
            <AppIcon name="home" width={18} height={18} />
            Dashboard
          </a>
          <a href={routes.ifkRecommendations}>
            <AppIcon name="userPlus" width={18} height={18} />
            Distribution
          </a>
          <a href={routes.ifkClinics}>
            <AppIcon name="users" width={18} height={18} />
            Clinic List
          </a>
          <a href={routes.ifkEnvironment}>
            <AppIcon name="calendar" width={18} height={18} />
            Environment Monitoring
          </a>
        </nav>

        <div className={styles.roleProfile}>
          <a href={routes.ifk} onClick={(event) => { event.preventDefault(); explainUnavailable('Settings'); }}><AppIcon name="settings" width={20} height={20} />Settings</a>
          <div>
            <span><AppIcon name="user" width={18} height={18} /></span>
            <strong>Officer 042</strong>
            <small>District Health Officer</small>
          </div>
        </div>
      </aside>

      <div className={styles.roleWorkspace}>
        <header className={styles.roleTopbar}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <a href="/">Home</a>
            <AppIcon name="chevronRight" width={14} height={14} />
            <a href={routes.ifkClinics}>Clinic List</a>
            <AppIcon name="chevronRight" width={14} height={14} />
            <span>Medicine Sender</span>
          </nav>
          <div className={styles.topbarActions}>
            <button type="button" aria-label="Notifikasi" className={styles.notificationButton} onClick={() => explainUnavailable('Notifikasi')}>
              <AppIcon name="bell" width={20} height={20} />
              <span />
            </button>
            <button type="button" aria-label="Pengaturan" onClick={() => explainUnavailable('Pengaturan')}><AppIcon name="settings" width={20} height={20} /></button>
            <div className={styles.topbarProfile}>
              <div>
                <strong>Pharmacy Management</strong>
                <small>Administrator</small>
              </div>
              <img src="/figma-dashboard/profil-bidan.png" alt="Pharmacy administrator" />
            </div>
          </div>
        </header>

        <main id="sender-dashboard" className={styles.page}>
          {notice ? <p role="status" className={styles.senderNotice}>{notice}</p> : null}
          <section className={styles.kpiGrid} aria-label="Ringkasan status klinik">
            {dashboardKpis.map((item) => (
              <article className={[styles.kpiCard, styles[item.tone]].join(' ')} key={item.label}>
                <Typography.Text className={styles.kpiLabel}>{item.label}</Typography.Text>
                <div className={styles.kpiValueRow}>
                  <strong>{item.value}</strong>
                  <span>{item.delta}</span>
                  {item.icon ? <AppIcon name={item.icon} width={24} height={24} /> : null}
                </div>
                {item.tone === 'primary' ? (
                  <Button className={styles.reviewQueueButton} href={routes.ifkRecommendations}>Review queue</Button>
                ) : (
                  <div className={styles.progressTrack} aria-hidden="true"><span style={{ width: `${item.progress}%` }} /></div>
                )}
              </article>
            ))}
          </section>

          <section className={styles.mainGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <Typography.Title id="sender-map-title" level={2}>Yogyakarta sector geospatial</Typography.Title>
                <div className={styles.segmented} aria-label="Mode peta">
                  <button type="button" className={mapMode === 'map' ? styles.activeSegment : ''} onClick={() => setMapMode('map')}>Map</button>
                  <button type="button" className={mapMode === 'satellite' ? styles.activeSegment : ''} onClick={() => setMapMode('satellite')}>Satellite</button>
                </div>
              </div>
              <div className={styles.mapShell}>
                <SenderMap points={dashboardMapPoints} mode={mapMode} center={[-7.7906, 110.377]} zoom={12} />
                <aside className={styles.mapOverlay} aria-label="Cuaca dan rute">
                  <div className={styles.overlayHeader}>
                    <Typography.Text>Weather overlay</Typography.Text>
                    <span />
                  </div>
                  <div>
                    <span><AppIcon name="cloudRain" width={18} height={18} /> {alerts.length} Alerts</span>
                    <span><AppIcon name="zap" width={18} height={18} /> {recommendations.length} Routes</span>
                  </div>
                </aside>
                <strong className={styles.mapCaption}>District Sallo Map</strong>
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <Typography.Title id="urgent-actions-title" level={2}>Urgent actions required</Typography.Title>
              </div>
              <div className={styles.actionList}>
                {dashboardActions.length === 0 ? <section className={styles.actionItem}><Typography.Title level={3}>No urgent actions</Typography.Title><div className={styles.actionFacts}><span><AppIcon name="package" width={18} height={18} /><small>Supply</small>All clear</span></div></section> : null}
                {dashboardActions.map((clinic) => (
                  <section className={styles.actionItem} key={clinic.id}>
                    <div className={styles.actionTopline}>
                      <span className={[styles.riskBadge, styles[clinic.status]].join(' ')}>{clinic.statusLabel}</span>
                      <Typography.Text>Last updated: {clinic.updatedAt}</Typography.Text>
                    </div>
                    <Typography.Title level={3}>{clinic.name}</Typography.Title>
                    <div className={styles.actionFacts}>
                      <span><AppIcon name={clinic.status === 'warning' ? 'cloudRain' : 'alert'} width={18} height={18} /><small>Weather risk</small>{clinic.weather}</span>
                      <span><AppIcon name="package" width={18} height={18} /><small>Supply shortage</small>{clinic.supply}</span>
                    </div>
                  </section>
                ))}
              </div>
            </article>
          </section>

          <section className={styles.logPanel} aria-labelledby="approval-log-title">
            <div className={styles.panelHeader}>
              <Typography.Title id="approval-log-title" level={2}>Recent Approval Activity</Typography.Title>
              <Typography.Text>Sync frequency: 30s</Typography.Text>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.logTable}>
                <thead>
                  <tr><th>Timestamp</th><th>Entity</th><th>Action type</th><th>Operator</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {dashboardApprovalLogs.length === 0 ? <tr><td colSpan={5}>Belum ada aktivitas approval.</td></tr> : null}
                  {dashboardApprovalLogs.map((log) => (
                    <tr key={`${log.timestamp}-${log.entity}`}>
                      <td>{log.timestamp}</td><td>{log.entity}</td><td>{log.action}</td><td>{log.operator}</td>
                      <td><span className={[styles.logStatus, styles[log.status]].join(' ')}>{statusLabels[log.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
