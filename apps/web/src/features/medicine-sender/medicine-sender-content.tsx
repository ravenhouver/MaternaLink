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
          <Typography.Title level={2}>Eastern Sector</Typography.Title>
          <Typography.Text>Command Intelligence</Typography.Text>
        </div>

        <nav className={styles.roleNav}>
          <a className={styles.roleNavActive} href="/medicine-sender">
            <AppIcon name="home" width={18} height={18} />
            Dashboard
          </a>
          <a href="/medicine-sender/recommendations">
            <AppIcon name="send" width={18} height={18} />
            Rekomendasi Pengiriman
          </a>
          <a href="/medicine-sender/environment">
            <AppIcon name="activity" width={18} height={18} />
            Pemantauan Lingkungan
          </a>
          <a href="#urgent-actions-title">
            <AppIcon name="package" width={18} height={18} />
            Semua Klinik
          </a>
          <a href="#approval-log-title">
            <AppIcon name="clipboard" width={18} height={18} />
            Riwayat Keputusan
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
          <Typography.Text>Sovereign Command</Typography.Text>
          <div>
            <button type="button" aria-label="Notifikasi"><AppIcon name="bell" width={20} height={20} /></button>
            <button type="button" aria-label="Akun"><AppIcon name="user" width={20} height={20} /></button>
          </div>
        </header>

        <main id="sender-dashboard" className={styles.page}>
          <section className={styles.hero} aria-labelledby="sender-title">
            <div>
              <Typography.Text className={styles.eyebrow}>Yogyakarta sector</Typography.Text>
              <Typography.Title id="sender-title" level={1}>Medicine Sender Command Center</Typography.Title>
              <Typography.Paragraph>
                Pantau prioritas pengiriman obat, risiko cuaca, dan approval distribusi dari satu layar kerja.
              </Typography.Paragraph>
            </div>
            <Button type="primary" className={styles.primaryAction} icon={<AppIcon name="send" width={18} height={18} />} href="/medicine-sender/recommendations">
              Review Antrian
            </Button>
          </section>

          <section className={styles.kpiGrid} aria-label="Ringkasan status klinik">
            {dashboardKpis.map((item) => (
              <article className={[styles.kpiCard, styles[item.tone]].join(' ')} key={item.label}>
                <Typography.Text className={styles.kpiLabel}>{item.label}</Typography.Text>
                <div className={styles.kpiValueRow}>
                  <strong>{item.value}</strong>
                  <span>{item.delta}</span>
                </div>
                <div className={styles.progressTrack} aria-hidden="true"><span style={{ width: `${item.progress}%` }} /></div>
              </article>
            ))}
          </section>

          <section className={styles.mainGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <Typography.Title id="sender-map-title" level={2}>Peta Distribusi Jogja</Typography.Title>
                <div className={styles.segmented} aria-label="Mode peta">
                  <button type="button" className={mapMode === 'map' ? styles.activeSegment : ''} onClick={() => setMapMode('map')}>Map</button>
                  <button type="button" className={mapMode === 'satellite' ? styles.activeSegment : ''} onClick={() => setMapMode('satellite')}>Satellite</button>
                </div>
              </div>
              <div className={styles.mapShell}>
                <SenderMap points={dashboardMapPoints} mode={mapMode} center={[-7.7906, 110.377]} zoom={12} />
                <aside className={styles.mapOverlay} aria-label="Cuaca dan rute">
                  <Typography.Text>Weather overlay</Typography.Text>
                  <div>
                    <span><AppIcon name="activity" width={18} height={18} /> 85% hujan</span>
                    <span><AppIcon name="send" width={18} height={18} /> 22 km rute</span>
                  </div>
                </aside>
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <Typography.Title id="urgent-actions-title" level={2}>Tindakan Segera Diperlukan</Typography.Title>
              </div>
              <div className={styles.actionList}>
                {dashboardActions.map((clinic) => (
                  <section className={styles.actionItem} key={clinic.id}>
                    <div className={styles.actionTopline}>
                      <span className={[styles.riskBadge, styles[clinic.status]].join(' ')}>{clinic.statusLabel}</span>
                      <Typography.Text>Updated: {clinic.updatedAt}</Typography.Text>
                    </div>
                    <Typography.Title level={3}>{clinic.name}</Typography.Title>
                    <div className={styles.actionFacts}>
                      <span><AppIcon name="alert" width={18} height={18} /><small>Weather risk</small>{clinic.weather}</span>
                      <span><AppIcon name="package" width={18} height={18} /><small>Supply shortage</small>{clinic.supply}</span>
                    </div>
                    {clinic.status === 'critical' ? (
                      <Button type="primary" className={styles.dispatchButton} icon={<AppIcon name="send" width={16} height={16} />} href="/medicine-sender/recommendations">
                        Execute Dispatch
                      </Button>
                    ) : null}
                  </section>
                ))}
              </div>
            </article>
          </section>

          <section className={styles.logPanel} aria-labelledby="approval-log-title">
            <div className={styles.panelHeader}>
              <Typography.Title id="approval-log-title" level={2}>Recent Approval Activity</Typography.Title>
              <Typography.Text>Sync frequency: 80s</Typography.Text>
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
