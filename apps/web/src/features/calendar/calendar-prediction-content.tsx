'use client';

import { useEffect, useMemo, useState } from 'react';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { getForecastCalendar, type ForecastCalendarResponse } from '@/lib/api';
import { routes } from '@/lib/routes';
import { CalendarSummary } from './components/calendar-summary';
import { CalendarToolbar, type CalendarViewMode } from './components/calendar-toolbar';
import { EventsPanel } from './components/events-panel';
import { MonthlyCalendar } from './components/monthly-calendar';
import { eventLabels, weekdays } from './calendar-data';
import styles from './calendar.module.css';

function monthPeriod(month: Date) {
  return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`;
}

function monthKey(month: Date) {
  return monthPeriod(month).slice(0, 7);
}

function formatSelectedDate(value?: string) {
  if (!value) return '';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short' }).format(new Date(`${value}T00:00:00`)).toUpperCase();
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function moveDate(value: string, days: number) {
  const date = parseDateKey(value);
  date.setDate(date.getDate() + days);
  return date;
}

function startOfWeek(value: string) {
  const date = parseDateKey(value);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return toDateKey(date);
}

export function CalendarPredictionContent() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [view, setView] = useState<CalendarViewMode>('month');
  const [calendar, setCalendar] = useState<ForecastCalendarResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const monthLabel = useMemo(() => new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(currentMonth), [currentMonth]);
  const summaryItems = useMemo(() => {
    return [
      { value: String(calendar?.summary.deliveriesThisMonth ?? 0), label: 'Persalinan Bulan Ini', icon: 'heart' as const, tone: 'blueSoft' as const },
      { value: String(calendar?.summary.ancThisMonth ?? 0), label: 'Kunjungan ANC', icon: 'clipboard' as const, tone: 'blue' as const },
      { value: String(calendar?.summary.highRiskPatients ?? 0), label: 'Pasien Risiko Tinggi', icon: 'alert' as const, tone: 'red' as const },
    ];
  }, [calendar]);
  const visibleDays = useMemo(() => {
    if (!calendar || view === 'month') return calendar?.days ?? [];
    const selected = calendar.selectedDate ?? selectedDate;
    if (!selected) return calendar.days.slice(0, 7);
    const weekStart = startOfWeek(selected);
    const startIndex = calendar.days.findIndex((day) => day.date === weekStart);
    return startIndex >= 0 ? calendar.days.slice(startIndex, startIndex + 7) : calendar.days.filter((day) => day.date >= weekStart).slice(0, 7);
  }, [calendar, selectedDate, view]);

  useEffect(() => {
    let cancelled = false;
    getForecastCalendar({ month: monthKey(currentMonth), selectedDate })
      .then((data) => {
        if (cancelled) return;
        setCalendar(data);
        setSelectedDate(data.selectedDate);
      })
      .catch((error) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'Gagal memuat kalender prediksi');
      });
    return () => { cancelled = true; };
  }, [currentMonth, selectedDate]);

  function syncMonthToDate(date: Date) {
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  function goNext() {
    if (view === 'month') {
      setSelectedDate(undefined);
      setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
      return;
    }

    const next = moveDate(calendar?.selectedDate ?? selectedDate ?? monthPeriod(currentMonth), 7);
    setSelectedDate(toDateKey(next));
    syncMonthToDate(next);
  }

  function goPrev() {
    if (view === 'month') {
      setSelectedDate(undefined);
      setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
      return;
    }

    const prev = moveDate(calendar?.selectedDate ?? selectedDate ?? monthPeriod(currentMonth), -7);
    setSelectedDate(toDateKey(prev));
    syncMonthToDate(prev);
  }

  return (
    <PageContainer size="wide" className={styles.page}>
      <Breadcrumbs
        items={[{ label: 'Beranda', href: routes.dashboard }, { label: 'Daftar Pasien', href: routes.patients }, { label: 'Kalender Prediksi' }]}
      />
      <CalendarSummary items={summaryItems} />
      <CalendarToolbar
        monthLabel={monthLabel}
        onNext={goNext}
        onPrev={goPrev}
        onViewChange={setView}
        view={view}
      />
      {message ? <p className={styles.workflowMessage} data-state={message.toLowerCase().includes('gagal') ? 'error' : undefined}>{message}</p> : null}
      <section className={styles.layout}>
        <MonthlyCalendar days={visibleDays} eventLabels={eventLabels} weekdays={weekdays} monthLabel={monthLabel} onSelectDate={setSelectedDate} view={view} />
        <EventsPanel events={calendar?.events ?? []} dateLabel={formatSelectedDate(calendar?.selectedDate)} note={calendar?.note ?? 'Pastikan stok klinis tersedia untuk pekan depan.'} />
      </section>
    </PageContainer>
  );
}
