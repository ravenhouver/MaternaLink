'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import { createQueue, deletePatient, getPatients, updatePatient, type PatientRecord, type PregnancyRiskLevel } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './patients.module.css';

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

  async function removePatient(patient: PatientRecord) {
    const ok = window.confirm(`Hapus pasien ${patient.fullName}? Riwayat antrean dan pemeriksaan pasien ini ikut terhapus.`);
    if (!ok) return;
    setError(null);
    try {
      await deletePatient(patient.id);
      await refreshRows();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus pasien');
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
          <p>Kelola data ibu hamil, status risiko, dan antrean pemeriksaan dari database.</p>
        </div>
        <div className={styles.headerActions}>
          <Link href={routes.newPatient} className={styles.queueButton}><AppIcon name="plus" width={18} height={18} />New Patient</Link>
        </div>
      </section>

      <section className={styles.toolbar} aria-label="Search and filter patients">
        <label className={styles.searchBox}>
          <AppIcon name="search" width={18} height={18} />
          <input type="search" placeholder="Cari nama, NIK, atau alamat..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <button type="button" className={styles.filterButton} onClick={() => void refreshRows()}>
          <AppIcon name="rotateCcw" width={18} height={18} />
          Refresh
        </button>
      </section>

      {error ? <p className={styles.formError}>{error}</p> : null}

      <section className={styles.tableCard} aria-label="Patient list table">
        <div className={styles.tableScroll}>
          <table className={styles.patientTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>NIK</th>
                <th>Gestational Age</th>
                <th>ANC Visit</th>
                <th>Risk</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={6}>Loading patients...</td></tr> : null}
              {!isLoading && filteredRows.length === 0 ? <tr><td colSpan={6}>Belum ada data pasien.</td></tr> : null}
              {filteredRows.map((patient) => {
                const pregnancy = activePregnancy(patient);
                return (
                  <tr key={patient.id}>
                    <td data-label="Name"><strong className={styles.patientName}>{patient.fullName}</strong><span className={styles.patientId}>{patient.phone ?? '-'}</span></td>
                    <td data-label="NIK">{patient.nik}</td>
                    <td data-label="Gestational Age">{pregnancy?.gestationalAge ? `${pregnancy.gestationalAge} weeks` : '-'}</td>
                    <td data-label="ANC Visit">{pregnancy?.ancVisit ?? '-'}</td>
                    <td data-label="Risk"><strong className={pregnancy?.riskLevel === 'HIGH' ? styles.urgentDate : undefined}>{pregnancy?.riskLevel ?? '-'}</strong></td>
                    <td data-label="Action">
                      <div className={styles.actionGroup}>
                        <button type="button" className={styles.detailButton} onClick={() => openEdit(patient)}>Edit</button>
                        <button type="button" className={styles.queueButton} onClick={() => void queuePatient(patient)}><AppIcon name="plus" width={18} height={18} />Queue</button>
                        <button type="button" className={styles.detailButton} onClick={() => void removePatient(patient)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <footer className={styles.pagination}>
          <p>Showing {filteredRows.length} of {rows.length} patients</p>
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
