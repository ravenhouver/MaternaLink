'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { NotificationCenter } from '@/components/layout/notification-center';
import { RoleLogoutButton } from '@/components/layout/role-logout-button';
import { AppIcon } from '@/components/ui/app-icon';
import { getCurrentUser, getIfkDashboard, type CurrentUser, type IfkDashboardResponse } from '@/lib/api';
import { routes } from '@/lib/routes';
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
  const [dashboard, setDashboard] = useState<IfkDashboardResponse | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [logPage, setLogPage] = useState(1);

  useEffect(() => {
    Promise.all([getIfkDashboard(), getCurrentUser()])
      .then(([nextDashboard, nextUser]) => {
        setDashboard(nextDashboard);
        setUser(nextUser);
      })
      .catch(() => undefined);
  }, []);

  const kpis = useMemo(() => dashboard?.kpis ?? [], [dashboard]);
  const actions = useMemo(() => dashboard?.actions ?? [], [dashboard]);
  const mapPoints = useMemo(() => dashboard?.mapPoints ?? [], [dashboard]);
  const approvalLogs = useMemo(() => dashboard?.approvalLogs ?? [], [dashboard]);
  const logPageSize = 8;
  const logTotalPages = Math.max(1, Math.ceil(approvalLogs.length / logPageSize));
  const safeLogPage = Math.min(logPage, logTotalPages);
  const pageApprovalLogs = approvalLogs.slice((safeLogPage - 1) * logPageSize, safeLogPage * logPageSize);

  useEffect(() => { if (logPage > logTotalPages) setLogPage(logTotalPages); }, [logPage, logTotalPages]);

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
          <RoleLogoutButton className={styles.roleLogoutButton} />
          <div>
            <span><AppIcon name="user" width={18} height={18} /></span>
            <strong>{user?.displayName ?? user?.username ?? 'IFK Officer'}</strong>
            <small>{user?.role ?? 'IFK_ADMIN'}</small>
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
            {user ? <NotificationCenter user={user} /> : null}
            <div className={styles.topbarProfile}>
              <div>
                <strong>{user?.displayName ?? user?.username ?? 'IFK Operations'}</strong>
                <small>{user?.role ?? 'IFK_ADMIN'}</small>
              </div>
              <img src="/figma-dashboard/profil-bidan.png" alt="Pharmacy administrator" />
            </div>
          </div>
        </header>

        <main id="sender-dashboard" className={styles.page}>
          <section className={styles.kpiGrid} aria-label="Ringkasan status klinik">
            {kpis.map((item) => (
              <article className={[styles.kpiCard, styles[item.tone]].join(' ')} key={item.label}>
                <Typography.Text className={styles.kpiLabel}>{item.label}</Typography.Text>
                <div className={styles.kpiValueRow}>
                  <strong>{String(item.value).padStart(2, '0')}</strong>
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
                <Typography.Title id="sender-map-title" level={2}>Facility route map</Typography.Title>
                <div className={styles.segmented} aria-label="Mode peta">
                  <button type="button" className={mapMode === 'map' ? styles.activeSegment : ''} onClick={() => setMapMode('map')}>Map</button>
                  <button type="button" className={mapMode === 'satellite' ? styles.activeSegment : ''} onClick={() => setMapMode('satellite')}>Satellite</button>
                </div>
              </div>
              <div className={styles.mapShell}>
                <SenderMap points={mapPoints} mode={mapMode} center={mapPoints[0]?.position ?? [-7.7906, 110.377]} zoom={12} />
                <aside className={styles.mapOverlay} aria-label="Cuaca dan rute">
                  <div className={styles.overlayHeader}>
                    <Typography.Text>Route overlay</Typography.Text>
                    <span />
                  </div>
                  <div>
                    <span><AppIcon name="cloudRain" width={18} height={18} /> {dashboard?.alertCount ?? 0} Alerts</span>
                    <span><AppIcon name="zap" width={18} height={18} /> {dashboard?.routeCount ?? 0} Routes</span>
                  </div>
                </aside>
                <strong className={styles.mapCaption}>{mapPoints.length ? 'Facility coordinates loaded' : 'Koordinat fasilitas belum tersedia di database'}</strong>
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <Typography.Title id="urgent-actions-title" level={2}>Urgent actions required</Typography.Title>
              </div>
              <div className={styles.actionList}>
                {actions.length === 0 ? <section className={styles.actionItem}><Typography.Title level={3}>No urgent actions</Typography.Title><div className={styles.actionFacts}><span><AppIcon name="package" width={18} height={18} /><small>Supply</small>All clear</span></div></section> : null}
                {actions.map((clinic) => (
                  <section className={styles.actionItem} key={clinic.id}>
                    <div className={styles.actionTopline}>
                      <span className={[styles.riskBadge, styles[clinic.status]].join(' ')}>{clinic.statusLabel}</span>
                      <Typography.Text>Last updated: {new Date(clinic.updatedAt).toLocaleString('id-ID')}</Typography.Text>
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
              <Typography.Text>Sync frequency: {dashboard?.syncFrequencySeconds ?? 30}s</Typography.Text>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.logTable}>
                <thead>
                  <tr><th>Timestamp</th><th>Entity</th><th>Action type</th><th>Operator</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {approvalLogs.length === 0 ? <tr><td colSpan={5}>Belum ada aktivitas approval.</td></tr> : null}
                  {pageApprovalLogs.map((log) => (
                    <tr key={`${log.timestamp}-${log.entity}`}>
                      <td>{new Date(log.timestamp).toLocaleString('id-ID')}</td><td>{log.entity}</td><td>{log.action}</td><td>{log.operator}</td>
                      <td><span className={[styles.logStatus, styles[log.status]].join(' ')}>{statusLabels[log.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.recoPagination}><span>Showing {pageApprovalLogs.length} of {approvalLogs.length} entries</span><div><button type="button" disabled={safeLogPage <= 1} onClick={() => setLogPage((value) => Math.max(1, value - 1))}><AppIcon name="chevronLeft" width={14} height={14} /></button><button type="button" className={styles.currentPage}>{safeLogPage}</button><button type="button" disabled={safeLogPage >= logTotalPages} onClick={() => setLogPage((value) => Math.min(logTotalPages, value + 1))}><AppIcon name="chevronRight" width={14} height={14} /></button></div></div>
          </section>
        </main>
      </div>
    </div>
  );
}
