'use client';

import { useMemo, useState } from 'react';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { runDemoWorkflow } from '@/lib/api';
import { routes } from '@/lib/routes';
import { CalendarSummary } from './components/calendar-summary';
import { CalendarToolbar } from './components/calendar-toolbar';
import { EventsPanel } from './components/events-panel';
import { MonthlyCalendar } from './components/monthly-calendar';
import { calendarDays, eventLabels, summaryItems, weekdays } from './calendar-data';
import styles from './calendar.module.css';

export function CalendarPredictionContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 5, 1));
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const monthLabel = useMemo(() => new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(currentMonth), [currentMonth]);

  async function runWorkflow() {
    setIsRunning(true);
    setMessage(null);
    try {
      await runDemoWorkflow();
      setMessage('Workflow selesai. Forecast, LPLPO, dan rekomendasi IFK sudah diperbarui.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Workflow gagal dijalankan.');
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <PageContainer size="wide" className={styles.page}>
      <Breadcrumbs
        items={[{ label: 'Beranda', href: routes.dashboard }, { label: 'Daftar Pasien', href: routes.patients }, { label: 'Kalender Prediksi' }]}
      />
      <CalendarSummary items={summaryItems} />
      <CalendarToolbar
        isRunning={isRunning}
        monthLabel={monthLabel}
        onNextMonth={() => setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
        onPrevMonth={() => setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
        onRunWorkflow={() => void runWorkflow()}
      />
      {message ? <p className={styles.workflowMessage}>{message}</p> : null}
      <section className={styles.layout}>
        <MonthlyCalendar days={calendarDays} eventLabels={eventLabels} weekdays={weekdays} />
        <EventsPanel />
      </section>
    </PageContainer>
  );
}
