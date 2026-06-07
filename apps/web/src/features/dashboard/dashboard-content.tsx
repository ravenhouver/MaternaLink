'use client';

import Button from 'antd/es/button';
import { PageContainer } from '@/components/layout/page-container';
import { AppIcon } from '@/components/ui/app-icon';
import { ActivityList } from './components/activity-list';
import { AlertBanner } from './components/alert-banner';
import { DashboardHeader } from './components/dashboard-header';
import { QuickActions } from './components/quick-actions';
import { StatsGrid } from './components/stats-grid';
import { dashboardStats, quickActions, recentActivities } from './dashboard-data';
import styles from './dashboard.module.css';

export function DashboardContent() {
  return (
    <PageContainer size="wide" className={styles.page}>
      <DashboardHeader />
      <AlertBanner />
      <StatsGrid stats={dashboardStats} />
      <section className={styles.contentGrid}>
        <QuickActions actions={quickActions} />
        <ActivityList activities={recentActivities} />
      </section>
      <Button className={styles.floatingAction} shape="circle" type="primary" aria-label="Tambah data">
        <AppIcon name="plus" width={28} height={28} />
      </Button>
    </PageContainer>
  );
}
