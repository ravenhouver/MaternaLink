'use client';

import { useEffect, useMemo, useState } from 'react';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { getAiWorkflowState, getPatients, runAiWorkflow, type AiWorkflowStatus, type PatientRecord } from '@/lib/api';
import { routes } from '@/lib/routes';
import { CalendarSummary } from './components/calendar-summary';
import { CalendarToolbar } from './components/calendar-toolbar';
import { EventsPanel, type CalendarPanelEvent } from './components/events-panel';
import { MonthlyCalendar } from './components/monthly-calendar';
import { eventLabels, weekdays, type CalendarDay } from './calendar-data';
import styles from './calendar.module.css';

function activePregnancy(patient: PatientRecord) {
  return patient.pregnancies?.[0] ?? null;
}

function buildCalendarDays(month: Date, patients: PatientRecord[]): CalendarDay[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, monthIndex, 1 - startOffset);
  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateKey = date.toISOString().slice(0, 10);
    const events = patients.flatMap((patient) => {
      const pregnancy = activePregnancy(patient);
      const list: CalendarDay['events'] = [];
      if (pregnancy?.edd?.slice(0, 10) === dateKey) list.push('delivery');
      if (pregnancy?.riskLevel === 'HIGH' && date.getDate() % 7 === 0) list.push('risk');
      if (pregnancy?.ancVisit && date.getDate() % 11 === 0) list.push('anc');
      return list;
    });
    return { day: date.getDate(), muted: date.getMonth() !== monthIndex, shaded: events.length > 0, selected: dateKey === new Date().toISOString().slice(0, 10), events: events.length ? Array.from(new Set(events)) : undefined };
  });
}

const terminalStatuses: AiWorkflowStatus[] = ['COMPLETED', 'FAILED', 'FAILED_PARTIAL'];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function monthPeriod(month: Date) {
  return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`;
}

export function CalendarPredictionContent() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const monthLabel = useMemo(() => new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(currentMonth), [currentMonth]);
  const calendarDays = useMemo(() => buildCalendarDays(currentMonth, patients), [currentMonth, patients]);
  const summaryItems = useMemo(() => {
    const deliveryCount = patients.filter((patient) => activePregnancy(patient)?.edd?.startsWith(`${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`)).length;
    const ancCount = patients.filter((patient) => activePregnancy(patient)?.ancVisit).length;
    const highRiskCount = patients.filter((patient) => activePregnancy(patient)?.riskLevel === 'HIGH').length;
    return [
      { value: String(deliveryCount), label: 'Persalinan Bulan Ini', icon: 'heart' as const, tone: 'blueSoft' as const },
      { value: String(ancCount), label: 'Kunjungan ANC', icon: 'clipboard' as const, tone: 'blue' as const },
      { value: String(highRiskCount), label: 'Pasien Risiko Tinggi', icon: 'alert' as const, tone: 'red' as const },
    ];
  }, [currentMonth, patients]);
  const todayEvents = useMemo<CalendarPanelEvent[]>(() => patients.slice(0, 3).map((patient) => {
    const pregnancy = activePregnancy(patient);
    return { id: patient.id, title: patient.fullName, label: pregnancy?.riskLevel === 'HIGH' ? 'KONTROL RISIKO TINGGI' : 'ANC FOLLOW UP', time: pregnancy?.edd ? new Date(pregnancy.edd).toLocaleDateString('id-ID') : 'Jadwal aktif', priority: pregnancy?.riskLevel === 'HIGH' };
  }), [patients]);

  useEffect(() => {
    getPatients().then(setPatients).catch((error) => setMessage(error instanceof Error ? error.message : 'Gagal memuat pasien'));
  }, []);

  async function runWorkflow() {
    setIsRunning(true);
    const periode = monthPeriod(currentMonth);
    const payload = { periode };
    setMessage(`AI workflow sedang berjalan untuk periode ${periode}. Forecast dan rekomendasi IFK akan diperbarui setelah selesai.`);
    try {
      const started = await runAiWorkflow(payload);
      let finalState = await getAiWorkflowState(payload);

      for (let attempt = 0; attempt < 120 && !terminalStatuses.includes(finalState.job?.status ?? started.status); attempt += 1) {
        await wait(5000);
        finalState = await getAiWorkflowState(payload);
      }

      const status = finalState.job?.status ?? started.status;
      if (status === 'COMPLETED') {
        const refreshedPatients = await getPatients();
        setPatients(refreshedPatients);
        setMessage(`AI workflow selesai. Forecast, LPLPO, dan rekomendasi IFK sudah diperbarui (${finalState.lplpoRows.length} LPLPO).`);
        return;
      }

      if (status === 'FAILED_PARTIAL') {
        setMessage(finalState.job?.errorMessage ? `AI workflow selesai sebagian: ${finalState.job.errorMessage}` : 'AI workflow selesai sebagian. Forecast dan LPLPO tersedia, rekomendasi IFK gagal dibuat.');
        return;
      }

      setMessage(finalState.job?.errorMessage ?? 'AI workflow belum selesai. Coba refresh status beberapa saat lagi.');
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
      {message ? <p className={styles.workflowMessage} data-state={isRunning ? 'running' : message.toLowerCase().includes('gagal') ? 'error' : undefined}>{message}</p> : null}
      <section className={styles.layout}>
        <MonthlyCalendar days={calendarDays} eventLabels={eventLabels} weekdays={weekdays} />
        <EventsPanel events={todayEvents} />
      </section>
    </PageContainer>
  );
}
