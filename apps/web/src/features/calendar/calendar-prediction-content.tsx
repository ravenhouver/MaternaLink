'use client';

import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { CalendarSummary } from './components/calendar-summary';
import { CalendarToolbar } from './components/calendar-toolbar';
import { EventsPanel } from './components/events-panel';
import { MonthlyCalendar } from './components/monthly-calendar';
import { calendarDays, eventLabels, summaryItems, weekdays } from './calendar-data';
import styles from './calendar.module.css';

export function CalendarPredictionContent() {
  return (
    <PageContainer size="wide" className={styles.page}>
      <Breadcrumbs
        separatorSrc="/figma-calendar/breadcrumb-chevron.svg"
        items={[{ label: 'Beranda', href: '/' }, { label: 'Daftar Pasien', href: '/master' }, { label: 'Kalender Prediksi' }]}
      />
      <CalendarSummary items={summaryItems} />
      <CalendarToolbar />
      <section className={styles.layout}>
        <MonthlyCalendar days={calendarDays} eventLabels={eventLabels} weekdays={weekdays} />
        <EventsPanel />
      </section>
    </PageContainer>
  );
}
