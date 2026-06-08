'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

export function PatientQueueContent() {
  const router = useRouter();
  const [rows, setRows] = useState<QueueRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<QueueFilters>(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshRows() {
    setIsLoading(true);
    setError(null);
    try {
      setRows(await getTodayQueue());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat antrian');
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
      { label: 'In Queue', value: String(waiting), unit: 'patients', icon: 'hourglass', tone: 'blue' },
      { label: 'Under Examination', value: String(examining), unit: 'patients', icon: 'stethoscope', tone: 'red' },
      { label: 'Completed Today', value: String(completed), unit: 'patients', icon: 'checkCircle', tone: 'green' },
    ];
  }, [rows]);

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

  async function handleCall(row: QueueRecord) {
    setError(null);
    try {
      await updateQueueStatus(row.id, 'EXAMINING');
      router.push(`${routes.examination}?queueId=${row.id}`);
    } catch (callError) {
      setError(callError instanceof Error ? callError.message : 'Gagal memanggil pasien');
    }
  }

  async function handleComplete(row: QueueRecord) {
    setError(null);
    try {
      await updateQueueStatus(row.id, 'COMPLETED');
      await refreshRows();
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : 'Gagal menyelesaikan antrian');
    }
  }

  return (
    <PageContainer size="wide" className={styles.page}>
      <section className={styles.headerCard}>
        <div>
          <h1>Patient Queue</h1>
          <p>{"Manage today's consultation queue - register new patients and monitor examination turns."}</p>
        </div>
        <Link href={routes.newPatient} className={styles.primaryButton}>
          <AppIcon name="plus" width={20} height={20} />
          Add New Patient
        </Link>
      </section>

      <section className={styles.summaryGrid} aria-label="Queue summary">
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

      <section className={styles.toolbar} aria-label="Search and filter patients">
        <label className={styles.searchBox}>
          <AppIcon name="search" width={18} height={18} />
          <input type="search" placeholder="Search patient..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <div className={styles.filterWrap}>
          <button type="button" className={styles.filterButton} aria-expanded={isFilterOpen} aria-haspopup="dialog" onClick={() => setIsFilterOpen((open) => !open)}>
            <AppIcon name="filter" width={18} height={18} />
            Filter
            <AppIcon name="chevronDown" width={16} height={16} />
          </button>
          {isFilterOpen ? <QueueFilterDialog doctors={doctors} filters={filters} onApply={(next) => { setFilters(next); setIsFilterOpen(false); }} onReset={() => setFilters(defaultFilters)} /> : null}
        </div>
      </section>

      {error ? <p className={styles.queueError}>{error}</p> : null}

      <section className={styles.queueCard} aria-label="Patient queue table">
        <div className={styles.tableScroll}>
          <table className={styles.queueTable}>
            <thead>
              <tr>
                <th>Queue No.</th>
                <th>Patient Data</th>
                <th>Pregnancy Info</th>
                <th>Status & Doctor</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={5}>Loading queue...</td></tr> : null}
              {!isLoading && filteredRows.length === 0 ? <tr><td colSpan={5}>No queue rows found.</td></tr> : null}
              {filteredRows.map((row) => {
                const isHighRisk = row.pregnancy.riskLevel === 'HIGH';
                return (
                  <tr className={row.status === 'EXAMINING' ? styles.highlightedRow : undefined} key={row.id}>
                    <td data-label="Queue No.">
                      <div className={styles.queueCell}>
                        <span className={styles.queueBadge}>{row.queueNo}</span>
                        {row.status === 'EXAMINING' ? <span className={styles.examiningBadge}>EXAMINING</span> : null}
                      </div>
                    </td>
                    <td data-label="Patient Data">
                      <strong className={styles.patientName}>{row.patient.fullName}</strong>
                      <span className={styles.patientMeta}>NIK: {row.patient.nik}</span>
                    </td>
                    <td data-label="Pregnancy Info">
                      <strong>{row.pregnancy.gestationalAge ?? '-'} weeks</strong>
                      <span>ANC: {row.pregnancy.ancVisit ?? '-'}</span>
                    </td>
                    <td data-label="Status & Doctor">
                      <span className={isHighRisk ? styles.highRiskBadge : styles.normalBadge}>{isHighRisk ? 'HIGH RISK' : 'NORMAL'}</span>
                      <span className={styles.doctorLine}><AppIcon name="user" width={14} height={14} />{row.assignedDoctor ?? '-'}</span>
                    </td>
                    <td data-label="Action">
                      <div className={styles.actionGroup}>
                        {row.status === 'WAITING' ? <button type="button" className={styles.callButton} onClick={() => void handleCall(row)}>Call</button> : null}
                        {row.status === 'EXAMINING' ? <button type="button" className={styles.completeButton} onClick={() => void handleComplete(row)}>Complete</button> : null}
                        <Link href={`${routes.examination}?queueId=${row.id}`} className={styles.secondaryButton}>View Details</Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <footer className={styles.paginationFooter}>
          <p>Showing {filteredRows.length} of {rows.length} patients in queue</p>
          <div className={styles.paginationControls}>
            <button type="button" aria-label="Previous page" disabled><AppIcon name="chevronLeft" width={18} height={18} /></button>
            <button type="button" aria-current="page">1</button>
            <button type="button" aria-label="Next page" disabled><AppIcon name="chevronRight" width={18} height={18} /></button>
          </div>
        </footer>
      </section>
    </PageContainer>
  );
}

function QueueFilterDialog({ doctors, filters, onApply, onReset }: { doctors: string[]; filters: QueueFilters; onApply: (filters: QueueFilters) => void; onReset: () => void }) {
  const [draft, setDraft] = useState(filters);

  return (
    <div className={styles.filterPanel} role="dialog" aria-label="Patient queue filters">
      <fieldset>
        <legend>Queue Status</legend>
        {(['ALL', 'WAITING', 'EXAMINING', 'COMPLETED'] as const).map((status) => (
          <label key={status}><input checked={draft.status === status} name="queue-status" type="radio" onChange={() => setDraft((current) => ({ ...current, status }))} /> <span>{status}</span></label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Risk Status</legend>
        {(['ALL', 'HIGH', 'NORMAL'] as const).map((risk) => (
          <label key={risk}><input checked={draft.risk === risk} name="risk-status" type="radio" onChange={() => setDraft((current) => ({ ...current, risk }))} /> <span>{risk}</span></label>
        ))}
      </fieldset>

      <label className={styles.doctorFilter}>
        <span>Assigned Doctor</span>
        <select value={draft.doctor} onChange={(event) => setDraft((current) => ({ ...current, doctor: event.target.value }))}>
          <option value="ALL">All Doctors</option>
          {doctors.map((doctor) => <option value={doctor} key={doctor}>{doctor}</option>)}
        </select>
      </label>

      <footer className={styles.filterFooter}>
        <button type="button" className={styles.resetButton} onClick={() => { setDraft(defaultFilters); onReset(); }}>Reset</button>
        <button type="button" className={styles.applyButton} onClick={() => onApply(draft)}>Apply</button>
      </footer>
    </div>
  );
}
