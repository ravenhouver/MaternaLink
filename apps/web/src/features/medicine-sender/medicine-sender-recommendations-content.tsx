'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import { approvalMetrics, dispatchRecommendations, senderStats, tacticalPoints } from './medicine-sender-data';
import styles from './medicine-sender.module.css';

const SenderMap = dynamic(() => import('./components/sender-map').then((module) => module.SenderMap), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Memuat tactical view...</div>,
});

const urgencyLabels = {
  critical: 'Urgency: Critical',
  anticipatory: 'Urgency: Anticipatory',
  regular: 'Urgency: Regular',
};

export function MedicineSenderRecommendationsContent() {
  const [mapMode, setMapMode] = useState<'map' | 'satellite'>('satellite');

  return (
    <div className={styles.senderShell}>
      <aside className={styles.roleSidebar} aria-label="Medicine sender navigation">
        <div className={styles.roleBrand}>
          <Typography.Text>Regional Sector</Typography.Text>
          <Typography.Title level={2}>Clinical Operations</Typography.Title>
        </div>

        <nav className={styles.roleNav}>
          <a href="/medicine-sender">
            <AppIcon name="home" width={18} height={18} />
            Dashboard
          </a>
          <a className={styles.roleNavActive} href="/medicine-sender/recommendations">
            <AppIcon name="send" width={18} height={18} />
            Rekomendasi Pengiriman
          </a>
          <a href="/medicine-sender/environment">
            <AppIcon name="activity" width={18} height={18} />
            Pemantauan Lingkungan
          </a>
          <a href="/medicine-sender/clinics">
            <AppIcon name="package" width={18} height={18} />
            Semua Klinik
          </a>
          <a href="#approval-metrics">
            <AppIcon name="clipboard" width={18} height={18} />
            Riwayat Keputusan
          </a>
        </nav>

        <div className={styles.roleProfile}>
          <a href="#settings"><AppIcon name="settings" width={20} height={20} />Settings</a>
          <a href="#support"><AppIcon name="info" width={20} height={20} />Support</a>
        </div>
      </aside>

      <div className={styles.roleWorkspace}>
        <header className={styles.roleTopbar}>
          <Typography.Text>Nusantara <span>Digital Sanctuary</span></Typography.Text>
          <div>
            <button type="button" aria-label="Notifikasi"><AppIcon name="bell" width={20} height={20} /></button>
            <button type="button" aria-label="Akun"><AppIcon name="user" width={20} height={20} /></button>
          </div>
        </header>

        <main id="sender-dashboard" className={styles.page}>
          <section className={styles.approvalHeader} aria-labelledby="approval-title">
            <div>
              <Typography.Text className={styles.eyebrow}>Logistics Intelligence</Typography.Text>
              <Typography.Title id="approval-title" level={1}>
                Rekomendasi Pengiriman <span>(Approval Center)</span>
              </Typography.Title>
            </div>
            <Button className={styles.filterButton} icon={<AppIcon name="settings" width={14} height={14} />}>
              Filter Urgency
            </Button>
          </section>

          <section className={styles.statGrid} aria-label="Status rekomendasi pengiriman">
            {senderStats.map((stat) => (
              <article className={[styles.statCard, styles[stat.tone]].join(' ')} key={stat.label}>
                <Typography.Text>{stat.label}</Typography.Text>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </section>

          <section id="recommendations" className={styles.recommendationGrid} aria-label="Daftar rekomendasi pengiriman">
            {dispatchRecommendations.map((item) => (
              <article className={styles.recommendationCard} key={item.id}>
                <div className={styles.cardBody}>
                  <div className={styles.cardMeta}>
                    <span className={[styles.urgencyBadge, styles[item.urgency]].join(' ')}>{urgencyLabels[item.urgency]}</span>
                    <small>ID: {item.id}</small>
                  </div>
                  <Typography.Title level={3}>{item.clinic}</Typography.Title>
                  <Typography.Text className={styles.routeLine}><AppIcon name="send" width={14} height={14} />{item.route}</Typography.Text>

                  <div className={styles.reasoningBox}>
                    <strong><AppIcon name="info" width={16} height={16} />AI Reasoning</strong>
                    <p>{item.reasoning}</p>
                  </div>

                  <div className={styles.shippingBlock}>
                    <small>Shipping contents</small>
                    <strong>{item.contents}</strong>
                  </div>
                  <div className={styles.deadlineBlock}>
                    <small>Dispatch before</small>
                    <strong>{item.deadline}</strong>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button type="button" className={styles.approveAction}>Setujui</button>
                  <button type="button" className={styles.editAction}>Ubah</button>
                  <button type="button" className={styles.rejectAction}>Tolak</button>
                </div>
              </article>
            ))}
          </section>

          <section className={styles.tacticalGrid}>
            <article id="tactical-view" className={styles.tacticalPanel}>
              <div className={styles.tacticalMapHeader}>
                <div>
                  <Typography.Text>Tactical view</Typography.Text>
                  <Typography.Title level={2}>Maritime Supply Lanes</Typography.Title>
                </div>
                <div className={styles.segmented} aria-label="Mode peta">
                  <button type="button" className={mapMode === 'map' ? styles.activeSegment : ''} onClick={() => setMapMode('map')}>Map</button>
                  <button type="button" className={mapMode === 'satellite' ? styles.activeSegment : ''} onClick={() => setMapMode('satellite')}>Satellite</button>
                </div>
              </div>
              <div className={styles.tacticalMapShell}>
                <SenderMap points={tacticalPoints} mode={mapMode} />
                <div className={styles.stormBadge}>
                  <small>Storm path</small>
                  <strong>Active Warning</strong>
                </div>
              </div>
            </article>

            <aside id="approval-metrics" className={styles.metricsPanel}>
              <Typography.Title level={2}>Approval Metrics</Typography.Title>
              <div className={styles.metricsList}>
                {approvalMetrics.map((metric) => (
                  <div className={styles.metricRow} key={metric.label}>
                    <div>
                      <span>{metric.label}</span>
                      <strong>{metric.value}%</strong>
                    </div>
                    <div className={styles.metricTrack}><span style={{ width: `${metric.value}%` }} /></div>
                  </div>
                ))}
              </div>
              <Button type="primary" className={styles.executeButton}>Execute All Recommended</Button>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
