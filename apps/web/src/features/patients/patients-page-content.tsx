'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import { createQueue, getPatients, updatePatient, type PatientRecord, type PregnancyRiskLevel } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './patients.module.css';

const PAGE_SIZE = 3;

type PatientDraft = {
  fullName: string;
  nik: string;
  phone: string;
  address: string;
  gestationalAge: string;
  ancVisit: string;
  riskLevel: PregnancyRiskLevel;
};

function activePregnancy(patient: PatientRecord) {
  return patient.pregnancies?.[0] ?? null;
}

function formatPatientId(patient: PatientRecord, index: number) {
  if (patient.id?.startsWith('ML-')) return patient.id;
  return `ML-2024-${String(index + 1).padStart(3, '0')}`;
}

function formatDueDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function dueHint(value?: string | null) {
  if (!value) return '';
  const today = new Date();
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return '';
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  if (days === 1) return 'Tomorrow!';
  if (days < 0) return `${Math.abs(days)} days overdue`;
  return `${days} days left`;
}

function ancCount(value?: string | null) {
  const numeric = Number(String(value ?? '').match(/\d+/)?.[0] ?? 0);
  return Math.max(0, Math.min(4, numeric || 0));
}

function toDraft(patient: PatientRecord): PatientDraft {
  const pregnancy = activePregnancy(patient);
  return {
    fullName: patient.fullName,
    nik: patient.nik,
    phone: patient.phone ?? '',
    address: patient.address ?? '',
    gestationalAge: pregnancy?.gestationalAge ? String(pregnancy.gestationalAge) : '',
    ancVisit: pregnancy?.ancVisit ?? '',
    riskLevel: pregnancy?.riskLevel ?? 'LOW',
  };
}

export function PatientsPageContent() {
  const [rows, setRows] = useState<PatientRecord[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState<PatientRecord | null>(null);
  const [draft, setDraft] = useState<PatientDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshRows() {
    setIsLoading(true);
    setError(null);
    try {
      setRows(await getPatients());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat pasien');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshRows();
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((patient) => [patient.fullName, patient.nik, patient.phone ?? '', patient.address ?? ''].some((value) => value.toLowerCase().includes(q)));
  }, [rows, search]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const visibleRows = filteredRows.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  async function queuePatient(patient: PatientRecord) {
    const pregnancy = activePregnancy(patient);
    if (!pregnancy) {
      setError('Pasien belum punya data kehamilan aktif.');
      return;
    }
    setError(null);
    try {
      await createQueue({ patientId: patient.id, pregnancyId: pregnancy.id });
      await refreshRows();
    } catch (queueError) {
      setError(queueError instanceof Error ? queueError.message : 'Gagal memasukkan pasien ke antrean');
    }
  }

  function openEdit(patient: PatientRecord) {
    setEditing(patient);
    setDraft(toDraft(patient));
  }

  async function saveEdit() {
    if (!editing || !draft) return;
    setError(null);
    try {
      await updatePatient(editing.id, {
        fullName: draft.fullName.trim(),
        nik: draft.nik.trim(),
        phone: draft.phone.trim(),
        address: draft.address.trim(),
        gestationalAge: draft.gestationalAge ? Number(draft.gestationalAge) : undefined,
        ancVisit: draft.ancVisit.trim(),
        riskLevel: draft.riskLevel,
      });
      setEditing(null);
      setDraft(null);
      await refreshRows();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan pasien');
    }
  }

  return (
    <PageContainer size="wide" className={styles.page}>
      <section className={styles.headerCard}>
        <div>
          <div className={styles.titleRow}>
            <h1>Patient List</h1>
            <span>{rows.length} registered patients</span>
          </div>
          <p>Manage maternal data, monitor risk status, and pregnancy schedules in a unified view.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" aria-label="Refresh patient list" onClick={() => void refreshRows()}><AppIcon name="bell" width={20} height={20} /></button>
          <Link href={routes.newPatient} aria-label="Add new patient"><AppIcon name="plus" width={20} height={20} /></Link>
        </div>
      </section>

      <section className={styles.toolbar} aria-label="Search and filter patients">
        <label className={styles.searchBox}>
          <AppIcon name="search" width={18} height={18} />
          <input type="search" placeholder="Search patient..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <button type="button" className={styles.filterButton} onClick={() => void refreshRows()}>
          <AppIcon name="filter" width={16} height={16} />
          Filter
          <AppIcon name="chevronDown" width={14} height={14} />
        </button>
      </section>

      {error ? <p className={styles.formError}>{error}</p> : null}

      <section className={styles.tableCard} aria-label="Patient list table">
        <div className={styles.tableScroll}>
          <table className={styles.patientTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Gestational Age</th>
                <th>Due Date</th>
                <th>ANC Visit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={5}>Loading patients...</td></tr> : null}
              {!isLoading && filteredRows.length === 0 ? <tr><td colSpan={5}>Belum ada data pasien.</td></tr> : null}
              {visibleRows.map((patient, index) => {
                const pregnancy = activePregnancy(patient);
                const due = dueHint(pregnancy?.edd);
                const ancDone = ancCount(pregnancy?.ancVisit);
                const isUrgent = pregnancy?.riskLevel === 'HIGH' || due === 'Tomorrow!' || due.includes('overdue') || due.startsWith('0 ');
                return (
                  <tr key={patient.id}>
                    <td data-label="Name"><strong className={styles.patientName}>{patient.fullName}</strong><span className={styles.patientId}>ID: {formatPatientId(patient, pageStart + index)}</span></td>
                    <td data-label="Gestational Age">{pregnancy?.gestationalAge ? `${pregnancy.gestationalAge} weeks` : '-'}</td>
                    <td data-label="Due Date"><strong className={isUrgent ? styles.urgentDate : undefined}>{due === 'Tomorrow!' ? due : formatDueDate(pregnancy?.edd)}</strong>{due && due !== 'Tomorrow!' ? <span className={isUrgent ? styles.urgentHint : styles.dueHint}>({due})</span> : null}{due === 'Tomorrow!' ? <span className={styles.dueHint}>{formatDueDate(pregnancy?.edd)}</span> : null}</td>
                    <td data-label="ANC Visit"><span className={styles.ancDots} aria-label={`${ancDone} of 4 ANC visits`}>{[0, 1, 2, 3].map((dot) => <i key={dot} className={dot < ancDone ? styles.ancDone : styles.ancPending} />)}</span></td>
                    <td data-label="Action">
                      <div className={styles.actionGroup}>
                        <button type="button" className={styles.detailButton} onClick={() => openEdit(patient)}>View Details</button>
                        <button type="button" className={styles.queueButton} onClick={() => void queuePatient(patient)}><AppIcon name="plus" width={18} height={18} />Queue</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <footer className={styles.pagination}>
          <p>Showing {visibleRows.length ? pageStart + 1 : 0}-{pageStart + visibleRows.length} of {filteredRows.length} patients</p>
          <div className={styles.paginationControls} aria-label="Patient pages">
            <button type="button" aria-label="Previous page" disabled={safePage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}><AppIcon name="chevronLeft" width={18} height={18} /></button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button key={page} type="button" aria-current={page === safePage ? 'page' : undefined} onClick={() => setCurrentPage(page)}>{page}</button>
            ))}
            <button type="button" aria-label="Next page" disabled={safePage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}><AppIcon name="chevronRight" width={18} height={18} /></button>
          </div>
        </footer>
      </section>

      {editing && draft ? (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={() => setEditing(null)}>
          <section aria-labelledby="edit-patient-title" aria-modal="true" className={styles.queueModal} role="dialog" onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.modalHeader}>
              <div><h2 id="edit-patient-title">Edit Patient</h2><p>{editing.fullName}</p></div>
              <button type="button" aria-label="Close edit patient" className={styles.modalClose} onClick={() => setEditing(null)}><AppIcon name="x" width={20} height={20} /></button>
            </header>
            <div className={styles.modalBody}>
              <div className={styles.twoColumnFields}>
                <EditField label="Full Name" value={draft.fullName} onChange={(value) => setDraft({ ...draft, fullName: value })} />
                <EditField label="NIK" value={draft.nik} onChange={(value) => setDraft({ ...draft, nik: value })} />
                <EditField label="Phone" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
                <EditField label="Address" value={draft.address} onChange={(value) => setDraft({ ...draft, address: value })} />
                <EditField label="Gestational Age" value={draft.gestationalAge} onChange={(value) => setDraft({ ...draft, gestationalAge: value })} />
                <EditField label="ANC Visit" value={draft.ancVisit} onChange={(value) => setDraft({ ...draft, ancVisit: value })} />
                <label className={styles.fieldGroup}><span className={styles.fieldLabel}>Risk Level</span><select value={draft.riskLevel} onChange={(event) => setDraft({ ...draft, riskLevel: event.target.value as PregnancyRiskLevel })}><option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option></select></label>
              </div>
            </div>
            <footer className={styles.modalFooter}><button type="button" className={styles.cancelButton} onClick={() => setEditing(null)}>Cancel</button><button type="button" className={styles.enterQueueButton} onClick={() => void saveEdit()}>Save Changes</button></footer>
          </section>
        </div>
      ) : null}
    </PageContainer>
  );
}

function EditField({ label, onChange, value }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className={styles.fieldGroup}><span className={styles.fieldLabel}>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
