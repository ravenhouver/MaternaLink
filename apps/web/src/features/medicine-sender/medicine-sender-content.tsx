'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import { dashboardActions, dashboardApprovalLogs, dashboardKpis, dashboardMapPoints } from './medicine-sender-data';
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
          <a className={styles.roleNavActive} href="/medicine-sender">
            <AppIcon name="home" width={18} height={18} />
            Dashboard
          </a>
          <a href="/medicine-sender/recommendations">
            <AppIcon name="userPlus" width={18} height={18} />
            Distribution
          </a>
          <a href="/medicine-sender/clinics">
            <AppIcon name="users" width={18} height={18} />
            Clinic List
          </a>
          <a href="/medicine-sender/environment">
            <AppIcon name="calendar" width={18} height={18} />
            Environment Monitoring
          </a>
        </nav>

        <div className={styles.roleProfile}>
          <a href="#settings"><AppIcon name="settings" width={20} height={20} />Settings</a>
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
            <a href="/medicine-sender/clinics">Clinic List</a>
            <AppIcon name="chevronRight" width={14} height={14} />
            <span>Medicine Sender</span>
          </nav>
          <div className={styles.topbarActions}>
            <button type="button" aria-label="Notifikasi" className={styles.notificationButton}>
              <AppIcon name="bell" width={20} height={20} />
              <span />
            </button>
            <button type="button" aria-label="Pengaturan"><AppIcon name="settings" width={20} height={20} /></button>
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
                  <Button className={styles.reviewQueueButton} href="/medicine-sender/recommendations">Review queue</Button>
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
                    <span><AppIcon name="cloudRain" width={18} height={18} /> 85% Prec.</span>
                    <span><AppIcon name="zap" width={18} height={18} /> 22 Knots</span>
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
