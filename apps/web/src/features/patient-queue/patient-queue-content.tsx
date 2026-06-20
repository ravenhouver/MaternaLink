'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import { getTodayQueue, updateQueueStatus, type QueueRecord, type QueueStatus } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './patient-queue.module.css';

type SummaryCard = {
  label: string;
  value: string;
  unit: string;
  icon: AppIconName;
  tone: 'blue' | 'red' | 'green';
};

type QueueFilters = {
  doctor: string;
  risk: 'ALL' | 'HIGH' | 'NORMAL';
  status: 'ALL' | QueueStatus;
};

const defaultFilters: QueueFilters = { doctor: 'ALL', risk: 'ALL', status: 'ALL' };

function formatDueDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID');
}

export function PatientQueueContent() {
  const router = useRouter();
  const t = useTranslations('queue');
  const tNav = useTranslations('nav');
  const [rows, setRows] = useState<QueueRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<QueueFilters>(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  async function refreshRows() {
    setIsLoading(true);
    setError(null);
    try {
      setRows(await getTodayQueue());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('loadError'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshRows();
  }, []);

  const summaryCards: SummaryCard[] = useMemo(() => {
    const waiting = rows.filter((row) => row.status === 'WAITING').length;
    const examining = rows.filter((row) => row.status === 'EXAMINING').length;
    const completed = rows.filter((row) => row.status === 'COMPLETED').length;
    return [
      { label: t('inQueue'), value: String(waiting), unit: t('patientsUnit'), icon: 'hourglass', tone: 'blue' },
      { label: t('underExamination'), value: String(examining), unit: t('patientsUnit'), icon: 'stethoscope', tone: 'red' },
      { label: t('completedToday'), value: String(completed), unit: t('patientsUnit'), icon: 'checkCircle', tone: 'green' },
    ];
  }, [rows, t]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const risk = row.pregnancy.riskLevel === 'HIGH' ? 'HIGH' : 'NORMAL';
      const matchesQuery = !query || row.patient.fullName.toLowerCase().includes(query) || row.patient.nik.toLowerCase().includes(query);
      const matchesRisk = filters.risk === 'ALL' || filters.risk === risk;
      const matchesStatus = filters.status === 'ALL' || filters.status === row.status;
      const matchesDoctor = filters.doctor === 'ALL' || row.assignedDoctor === filters.doctor;
      return matchesQuery && matchesRisk && matchesStatus && matchesDoctor;
    });
  }, [filters, rows, search]);

  const doctors = useMemo(() => Array.from(new Set(rows.map((row) => row.assignedDoctor).filter(Boolean))) as string[], [rows]);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  async function handleCall(row: QueueRecord) {
    setError(null);
    try {
      if (row.status === 'WAITING') {
        await updateQueueStatus(row.id, 'EXAMINING');
      }
      router.push(`${routes.examination}?queueId=${row.id}`);
    } catch (callError) {
      setError(callError instanceof Error ? callError.message : t('callError'));
    }
  }

  return (
    <PageContainer size="wide" className={styles.page}>
      <section className={styles.headerCard}>
        <div>
          <h1>{tNav('patientQueue')}</h1>
          <p>{t('subtitle')}</p>
        </div>
        <Link href={routes.newPatient} className={styles.primaryButton}>
          <AppIcon name="plus" width={20} height={20} />
          {t('addNewPatient')}
        </Link>
      </section>

      <section className={styles.summaryGrid} aria-label={t('summaryLabel')}>
        {summaryCards.map((card) => (
          <article className={styles.summaryCard} key={card.label}>
            <span className={[styles.summaryIcon, styles[card.tone]].join(' ')}>
              <AppIcon name={card.icon} width={24} height={24} />
            </span>
            <div>
              <h2>{card.label}</h2>
              <p><strong>{card.value}</strong> {card.unit}</p>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.toolbar} aria-label={t('searchFilterLabel')}>
        <label className={styles.searchBox}>
          <AppIcon name="search" width={18} height={18} />
          <input type="search" placeholder={t('searchPatient')} value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <div className={styles.filterWrap}>
          <button type="button" className={styles.filterButton} aria-expanded={isFilterOpen} aria-haspopup="dialog" onClick={() => setIsFilterOpen((open) => !open)}>
            <AppIcon name="filter" width={18} height={18} />
            {t('filter')}
            <AppIcon name="chevronDown" width={16} height={16} />
          </button>
          {isFilterOpen ? <QueueFilterDialog doctors={doctors} filters={filters} onApply={(next) => { setFilters(next); setPage(1); setIsFilterOpen(false); }} onReset={() => { setFilters(defaultFilters); setPage(1); }} /> : null}
        </div>
      </section>

      {error ? <p className={styles.queueError}>{error}</p> : null}

      <section className={styles.queueCard} aria-label={t('tableLabel')}>
        <div className={styles.tableScroll}>
          <table className={styles.queueTable}>
            <thead>
              <tr>
                <th>{t('queueNo')}</th>
                <th>{t('patientData')}</th>
                <th>{t('pregnancyInfo')}</th>
                <th>{t('statusDoctor')}</th>
                <th>{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={5}>{t('loadingQueue')}</td></tr> : null}
              {!isLoading && filteredRows.length === 0 ? <tr><td colSpan={5}>{t('noRows')}</td></tr> : null}
              {pageRows.map((row) => {
                const isHighRisk = row.pregnancy.riskLevel === 'HIGH';
                return (
                  <tr className={row.status === 'EXAMINING' ? styles.highlightedRow : undefined} key={row.id}>
                    <td data-label={t('queueNo')}>
                      <div className={styles.queueCell}>
                        <span className={styles.queueBadge}>{row.queueNo}</span>
                        {row.status === 'EXAMINING' ? <span className={styles.examiningBadge}>EXAMINING</span> : null}
                      </div>
                    </td>
                    <td data-label={t('patientData')}>
                      <strong className={styles.patientName}>{row.patient.fullName}</strong>
                      <span className={styles.patientMeta}>NIK: {row.patient.nik}</span>
                    </td>
                    <td data-label={t('pregnancyInfo')}>
                      <strong>{t('ageWeeks', { age: row.pregnancy.gestationalAge ?? '-' })}</strong>
                      <span>{t('dueDate', { date: formatDueDate(row.pregnancy.edd) })}</span>
                    </td>
                    <td data-label={t('statusDoctor')}>
                      <span className={isHighRisk ? styles.highRiskBadge : styles.normalBadge}>{isHighRisk ? t('highRisk') : t('normal')}</span>
                      <span className={styles.doctorLine}><AppIcon name="user" width={14} height={14} />{row.assignedDoctor ?? '-'}</span>
                    </td>
                    <td data-label={t('action')}>
                      <div className={styles.actionGroup}>
                        {row.status === 'WAITING' || row.status === 'EXAMINING' ? <button type="button" className={styles.callButton} onClick={() => void handleCall(row)}>{t('call')}</button> : null}
                        {row.status === 'COMPLETED' ? <span className={styles.completeButton}>{t('complete')}</span> : null}
                        {row.status === 'COMPLETED' ? <Link href={`${routes.examination}?queueId=${row.id}`} className={styles.secondaryButton}>{t('viewDetails')}</Link> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <footer className={styles.paginationFooter}>
          <p>{t('showingQueue', { shown: pageRows.length, total: filteredRows.length })}</p>
          <div className={styles.paginationControls}>
            <button type="button" aria-label={t('previousPage')} disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><AppIcon name="chevronLeft" width={18} height={18} /></button>
            <button type="button" aria-current="page">{safePage}</button>
            <button type="button" aria-label={t('nextPage')} disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><AppIcon name="chevronRight" width={18} height={18} /></button>
          </div>
        </footer>
      </section>
    </PageContainer>
  );
}

function QueueFilterDialog({ doctors, filters, onApply, onReset }: { doctors: string[]; filters: QueueFilters; onApply: (filters: QueueFilters) => void; onReset: () => void }) {
  const t = useTranslations('queue');
  const [draft, setDraft] = useState(filters);

  return (
    <div className={styles.filterPanel} role="dialog" aria-label={t('filtersLabel')}>
      <fieldset>
        <legend>{t('queueStatus')}</legend>
        {(['ALL', 'WAITING', 'EXAMINING', 'COMPLETED'] as const).map((status) => (
          <label key={status}><input checked={draft.status === status} name="queue-status" type="radio" onChange={() => setDraft((current) => ({ ...current, status }))} /> <span>{t(`status.${status}`)}</span></label>
        ))}
      </fieldset>

      <fieldset>
        <legend>{t('riskStatus')}</legend>
        {(['ALL', 'HIGH', 'NORMAL'] as const).map((risk) => (
          <label key={risk}><input checked={draft.risk === risk} name="risk-status" type="radio" onChange={() => setDraft((current) => ({ ...current, risk }))} /> <span>{t(`risk.${risk}`)}</span></label>
        ))}
      </fieldset>

      <label className={styles.doctorFilter}>
        <span>{t('assignedDoctor')}</span>
        <select value={draft.doctor} onChange={(event) => setDraft((current) => ({ ...current, doctor: event.target.value }))}>
          <option value="ALL">{t('allDoctors')}</option>
          {doctors.map((doctor) => <option value={doctor} key={doctor}>{doctor}</option>)}
        </select>
      </label>

      <footer className={styles.filterFooter}>
        <button type="button" className={styles.resetButton} onClick={() => { setDraft(defaultFilters); onReset(); }}>{t('reset')}</button>
        <button type="button" className={styles.applyButton} onClick={() => onApply(draft)}>{t('apply')}</button>
      </footer>
    </div>
  );
}
