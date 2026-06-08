'use client';

import type { CSSProperties } from 'react';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import styles from './dashboard.module.css';

type StatCard = {
  label: string;
  value: string;
  tag: string;
  icon: AppIconName;
  accent: string;
};

type QuickAction = {
  label: string;
  icon: AppIconName;
};

type Activity = {
  name: string;
  title: string;
  meta: string;
  icon: AppIconName;
  tone: string;
};

const statCards: StatCard[] = [
  { label: 'Total Registered Patients', value: '42', tag: '+4 this month', icon: 'users', accent: '#1a73e8' },
  { label: 'Deliveries This Month', value: '8', tag: 'Normal', icon: 'heart', accent: '#006948' },
  { label: 'High-Risk Patients', value: '5', tag: 'Needs Monitoring', icon: 'alert', accent: '#a33d23' },
  { label: 'Medications To Restock', value: '3', tag: 'Critical', icon: 'package', accent: '#f59e0b' },
];

const quickActions: QuickAction[] = [
  { label: 'New Patient', icon: 'users' },
  { label: 'Calendar', icon: 'calendar' },
  { label: 'Add Medicines', icon: 'plus' },
  { label: 'Delivering', icon: 'package' },
];

const activities: Activity[] = [
  { name: 'Mrs. Maria', title: 'ANC (Antenatal Care) Visit', meta: '10 minutes ago - Routine 2nd trimester check-up', icon: 'clipboard', tone: 'blue' },
  { name: 'Mrs. Siti', title: 'Risk Data Updated', meta: '1 hour ago - Elevated blood pressure (140/90)', icon: 'alert', tone: 'red' },
  { name: 'Mrs. Rahayu', title: 'Lab Results', meta: '3 Jam yang lalu - Hemoglobin: 11.5 g/dL (Normal)', icon: 'fileText', tone: 'green' },
];

export function DashboardContent() {
  return (
    <PageContainer size="wide" className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Welcome, Bidan Sari</h1>
          <p>Sejahtera Clinic activity report for today</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.bellButton} aria-label="Notifications">
            <AppIcon name="bell" width={20} height={20} />
          </button>
          <button type="button" className={styles.clinicPill} aria-label="Current clinic: Sejahtera Clinic">
            <span>Sejahtera Clinic</span>
            <strong>KS</strong>
          </button>
        </div>
      </header>

      <section className={styles.alertBanner} aria-label="Delivery date alert">
        <div className={styles.alertCopy}>
          <span className={styles.alertIcon}>
            <AppIcon name="alert" width={28} height={28} />
          </span>
          <div>
            <h2>2 patients reaching EDD (Estimated Delivery Date) this week</h2>
            <p>Check the availability of medications and supplies now.</p>
          </div>
        </div>
        <button type="button" className={styles.alertButton}>Check Now</button>
      </section>

      <section className={styles.statsGrid} aria-label="Dashboard metrics">
        {statCards.map((stat) => (
          <article className={styles.statCard} style={{ '--accent': stat.accent } as CSSProperties} key={stat.label}>
            <div className={styles.statTopline}>
              <span className={styles.statIcon}><AppIcon name={stat.icon} width={22} height={22} /></span>
              <span className={styles.statTag}>{stat.tag}</span>
            </div>
            <h3>{stat.label}</h3>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className={styles.lowerGrid}>
        <div className={styles.quickColumn}>
          <h2 className={styles.sectionTitle}><AppIcon name="zap" width={18} height={18} />Quick Actions</h2>
          <div className={styles.quickGrid}>
            {quickActions.map((action) => (
              <button type="button" className={styles.quickAction} key={action.label}>
                <span><AppIcon name={action.icon} width={24} height={24} /></span>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.activityColumn}>
          <div className={styles.activityHeader}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <button type="button">View All</button>
          </div>
          <div className={styles.activityCard}>
            {activities.map((activity) => (
              <button type="button" className={styles.activityRow} key={activity.name}>
                <span className={[styles.activityIcon, styles[activity.tone]].join(' ')}>
                  <AppIcon name={activity.icon} width={22} height={22} />
                </span>
                <span className={styles.activityText}>
                  <span><strong>{activity.name}</strong> - {activity.title}</span>
                  <small>{activity.meta}</small>
                </span>
                <AppIcon name="chevronRight" width={18} height={18} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <button type="button" className={styles.fab} aria-label="Tambah data">
        <AppIcon name="plus" width={28} height={28} />
      </button>
    </PageContainer>
  );
}

