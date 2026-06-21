'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import { createQueue, getPatients, updatePatient, type PatientRecord, type PregnancyRiskLevel } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './patients.module.css';

const PAGE_SIZE = 10;

type PatientDraft = {
  fullName: string;
  nik: string;
  phone: string;
  address: string;
  gestationalAge: string;
  ancVisit: string;
  riskLevel: PregnancyRiskLevel;
};

type QueueDraft = {
  reason: 'ANC Checkup' | 'Complaint' | 'Referral' | 'Emergency';
  ancVisit: string;
  complaint: string;
  systolic: string;
  diastolic: string;
  weight: string;
  height: string;
  muac: string;
  fetalHeartRate: string;
  temperature: string;
  pulse: string;
  riskFactors: string[];
  routineMedication: string[];
  responsibleDoctor: string;
};

const riskOptions = ['Gestational Hypertension', 'Mild Anemia (Hb < 11)', 'History of Preeclampsia', 'Diabetes Mellitus'];
const medicationOptions = ['Folic Acid', 'Iron Supplement (TTD)', 'Calcium', 'Low Dose Aspirin'];
const reasonOptions: Array<{ label: QueueDraft['reason']; icon: 'stethoscope' | 'archive' | 'clipboardCheck' | 'zap'; danger?: boolean }> = [
  { label: 'ANC Checkup', icon: 'stethoscope' },
  { label: 'Complaint', icon: 'archive' },
  { label: 'Referral', icon: 'clipboardCheck' },
  { label: 'Emergency', icon: 'zap', danger: true },
];

function activePregnancy(patient: PatientRecord) {
  return patient.pregnancies?.[0] ?? null;
}

function formatPatientId(patient: PatientRecord, index: number) {
  return patient.id || `PATIENT-${String(index + 1).padStart(3, '0')}`;
}

function formatDueDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function dueHint(value: string | null | undefined, t: ReturnType<typeof useTranslations>) {
  if (!value) return '';
  const today = new Date();
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return '';
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  if (days === 1) return t('tomorrow');
  if (days < 0) return t('overdue', { count: Math.abs(days) });
  return t('daysLeft', { count: days });
}

function ancCount(value?: string | null) {
  const numeric = Number(String(value ?? '').match(/\d+/)?.[0] ?? 0);
  return Math.max(0, Math.min(4, numeric || 0));
}

function asString(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function activeArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function vitalValue(vitals: Record<string, unknown> | null | undefined, key: string) {
  return asString(vitals?.[key]);
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

function toQueueDraft(patient: PatientRecord): QueueDraft {
  const pregnancy = activePregnancy(patient);
  const vitals = pregnancy?.vitalSigns;
  return {
    reason: (pregnancy?.visitReason as QueueDraft['reason']) || 'ANC Checkup',
    ancVisit: pregnancy?.ancVisit || 'ANC K4 (Trimester 3)',
    complaint: pregnancy?.chiefComplaint || '',
    systolic: vitalValue(vitals, 'systolic'),
    diastolic: vitalValue(vitals, 'diastolic'),
    weight: vitalValue(vitals, 'weight'),
    height: vitalValue(vitals, 'height'),
    muac: vitalValue(vitals, 'muac'),
    fetalHeartRate: vitalValue(vitals, 'fetalHeartRate'),
    temperature: vitalValue(vitals, 'temperature'),
    pulse: vitalValue(vitals, 'pulse'),
    riskFactors: activeArray(pregnancy?.riskFactors),
    routineMedication: activeArray(pregnancy?.routineMedication),
    responsibleDoctor: pregnancy?.responsibleDoctor || '',
  };
}

function inferPriority(patient: PatientRecord | null, draft: QueueDraft | null, t: ReturnType<typeof useTranslations>) {
  if (!patient || !draft) return { level: 'LOW', minutes: 30, message: t('completeScreening') };
  const pregnancy = activePregnancy(patient);
  const highRisk = pregnancy?.riskLevel === 'HIGH' || draft.reason === 'Emergency' || draft.riskFactors.some((risk) => /preeclampsia|hypertension|diabetes/i.test(risk));
  const mediumRisk = pregnancy?.riskLevel === 'MEDIUM' || draft.riskFactors.length > 0;
  if (highRisk) {
    return { level: 'HIGH', minutes: 12, message: t('priorityHigh') };
  }
  if (mediumRisk) {
    return { level: 'MEDIUM', minutes: 18, message: t('priorityMedium') };
  }
  return { level: 'LOW', minutes: 30, message: t('priorityLow') };
}

export function PatientsPageContent() {
  const t = useTranslations('patients');
  const [rows, setRows] = useState<PatientRecord[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState<PatientRecord | null>(null);
  const [queueing, setQueueing] = useState<PatientRecord | null>(null);
  const [draft, setDraft] = useState<PatientDraft | null>(null);
  const [queueDraft, setQueueDraft] = useState<QueueDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshRows() {
    setIsLoading(true);
    setError(null);
    try {
      setRows(await getPatients());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('loadError'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshRows();
  }, []);

  useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get('edit');
    if (!editId || !rows.length || editing?.id === editId) return;
    const patient = rows.find((row) => row.id === editId);
    if (patient) openEdit(patient);
  }, [editing?.id, rows]);

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

  function openQueue(patient: PatientRecord) {
    const pregnancy = activePregnancy(patient);
    if (!pregnancy) {
      setError(t('noActivePregnancy'));
      return;
    }
    setQueueing(patient);
    setQueueDraft(toQueueDraft(patient));
  }

  async function queuePatient() {
    if (!queueing || !queueDraft) return;
    const pregnancy = activePregnancy(queueing);
    if (!pregnancy) return;
    const priority = inferPriority(queueing, queueDraft, t);
    setError(null);
    try {
      await createQueue({
        patientId: queueing.id,
        pregnancyId: pregnancy.id,
        assignedDoctor: queueDraft.responsibleDoctor,
        screening: {
          reason: queueDraft.reason,
          complaint: queueDraft.complaint,
          ancVisit: queueDraft.ancVisit,
          gestationalAge: pregnancy.gestationalAge ?? undefined,
          vitalSigns: {
            systolic: Number(queueDraft.systolic) || undefined,
            diastolic: Number(queueDraft.diastolic) || undefined,
            weight: Number(queueDraft.weight) || undefined,
            height: Number(queueDraft.height) || undefined,
            muac: Number(queueDraft.muac) || undefined,
            fetalHeartRate: Number(queueDraft.fetalHeartRate) || undefined,
            temperature: Number(queueDraft.temperature) || undefined,
            pulse: Number(queueDraft.pulse) || undefined,
          },
          riskFactors: queueDraft.riskFactors,
          routineMedication: queueDraft.routineMedication,
          responsibleDoctor: queueDraft.responsibleDoctor,
          priority: priority.level,
          riskSummary: { riskLevel: priority.level, message: priority.message, estimatedMinutes: priority.minutes },
        },
      });
      setQueueing(null);
      setQueueDraft(null);
      await refreshRows();
    } catch (queueError) {
      setError(queueError instanceof Error ? queueError.message : t('queueError'));
    }
  }

  function openEdit(patient: PatientRecord) {
    setEditing(patient);
    setDraft(toDraft(patient));
  }

  function closeEdit() {
    setEditing(null);
    setDraft(null);
    if (new URLSearchParams(window.location.search).get('edit')) window.history.replaceState(null, '', routes.patients);
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
      closeEdit();
      await refreshRows();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('saveError'));
    }
  }

  return (
    <PageContainer size="wide" className={styles.page}>
      <section className={styles.headerCard}>
        <div>
          <div className={styles.titleRow}>
            <h1>{t('title')}</h1>
            <span>{t('registered', { count: rows.length })}</span>
          </div>
          <p>{t('subtitle')}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" aria-label={t('refreshList')} onClick={() => void refreshRows()}><AppIcon name="clock" width={20} height={20} /></button>
          <Link href={routes.newPatient} aria-label={t('addNew')}><AppIcon name="plus" width={20} height={20} /></Link>
        </div>
      </section>

      <section className={styles.toolbar} aria-label={t('searchFilter')}>
        <label className={styles.searchBox}>
          <AppIcon name="search" width={18} height={18} />
          <input type="search" placeholder={t('searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <button type="button" className={styles.filterButton} onClick={() => void refreshRows()}>
          <AppIcon name="filter" width={16} height={16} />
          {t('filter')}
          <AppIcon name="chevronDown" width={14} height={14} />
        </button>
      </section>

      {error ? <p className={styles.formError}>{error}</p> : null}

      <section className={styles.tableCard} aria-label={t('tableLabel')}>
        <div className={styles.tableScroll}>
          <table className={styles.patientTable}>
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('gestationalAge')}</th>
                <th>{t('dueDate')}</th>
                <th>{t('ancVisit')}</th>
                <th>{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={5}>{t('loading')}</td></tr> : null}
              {!isLoading && filteredRows.length === 0 ? <tr><td colSpan={5}>{t('empty')}</td></tr> : null}
              {visibleRows.map((patient, index) => {
                const pregnancy = activePregnancy(patient);
                const due = dueHint(pregnancy?.edd, t);
                const ancDone = ancCount(pregnancy?.ancVisit);
                const isUrgent = pregnancy?.riskLevel === 'HIGH' || due === t('tomorrow') || due.includes('overdue') || due.includes('terlambat') || due.startsWith('0 ');
                return (
                  <tr key={patient.id}>
                    <td data-label={t('name')}><strong className={styles.patientName}>{patient.fullName}</strong><span className={styles.patientId}>ID: {formatPatientId(patient, pageStart + index)}</span></td>
                    <td data-label={t('gestationalAge')}>{pregnancy?.gestationalAge ? t('weeks', { count: pregnancy.gestationalAge }) : '-'}</td>
                    <td data-label={t('dueDate')}><strong className={isUrgent ? styles.urgentDate : undefined}>{due === t('tomorrow') ? due : formatDueDate(pregnancy?.edd)}</strong>{due && due !== t('tomorrow') ? <span className={isUrgent ? styles.urgentHint : styles.dueHint}>({due})</span> : null}{due === t('tomorrow') ? <span className={styles.dueHint}>{formatDueDate(pregnancy?.edd)}</span> : null}</td>
                    <td data-label={t('ancVisit')}><span className={styles.ancDots} aria-label={t('ancVisits', { count: ancDone })}>{[0, 1, 2, 3].map((dot) => <i key={dot} className={dot < ancDone ? styles.ancDone : styles.ancPending} />)}</span></td>
                    <td data-label={t('action')}>
                      <div className={styles.actionGroup}>
                        <Link className={styles.detailButton} href={routes.patientDetail(patient.id)}>{t('viewDetails')}</Link>
                        <button type="button" className={styles.queueButton} onClick={() => openQueue(patient)}><AppIcon name="plus" width={18} height={18} />{t('queue')}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <footer className={styles.pagination}>
          <p>{t('showing', { from: visibleRows.length ? pageStart + 1 : 0, to: pageStart + visibleRows.length, total: filteredRows.length })}</p>
          <div className={styles.paginationControls} aria-label={t('patientPages')}>
            <button type="button" aria-label={t('previousPage')} disabled={safePage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}><AppIcon name="chevronLeft" width={18} height={18} /></button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button key={page} type="button" aria-current={page === safePage ? 'page' : undefined} onClick={() => setCurrentPage(page)}>{page}</button>
            ))}
            <button type="button" aria-label={t('nextPage')} disabled={safePage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}><AppIcon name="chevronRight" width={18} height={18} /></button>
          </div>
        </footer>
      </section>

      {queueing && queueDraft ? <QueueScreeningModal patient={queueing} draft={queueDraft} onChange={setQueueDraft} onClose={() => setQueueing(null)} onSubmit={() => void queuePatient()} /> : null}

      {editing && draft ? (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={closeEdit}>
          <section aria-labelledby="edit-patient-title" aria-modal="true" className={styles.queueModal} role="dialog" onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.modalHeader}>
              <div><h2 id="edit-patient-title">{t('editPatient')}</h2><p>{editing.fullName}</p></div>
              <button type="button" aria-label={t('closeEdit')} className={styles.modalClose} onClick={closeEdit}><AppIcon name="x" width={20} height={20} /></button>
            </header>
            <div className={styles.modalBody}>
              <div className={styles.twoColumnFields}>
                <EditField label={t('fullName')} value={draft.fullName} onChange={(value) => setDraft({ ...draft, fullName: value })} />
                <EditField label={t('nik')} value={draft.nik} onChange={(value) => setDraft({ ...draft, nik: value })} />
                <EditField label={t('phone')} value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
                <EditField label={t('address')} value={draft.address} onChange={(value) => setDraft({ ...draft, address: value })} />
                <EditField label={t('gestationalAge')} value={draft.gestationalAge} onChange={(value) => setDraft({ ...draft, gestationalAge: value })} />
                <EditField label={t('ancVisit')} value={draft.ancVisit} onChange={(value) => setDraft({ ...draft, ancVisit: value })} />
                <label className={styles.fieldGroup}><span className={styles.fieldLabel}>{t('riskLevel')}</span><select value={draft.riskLevel} onChange={(event) => setDraft({ ...draft, riskLevel: event.target.value as PregnancyRiskLevel })}><option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option></select></label>
              </div>
            </div>
            <footer className={styles.modalFooter}><button type="button" className={styles.cancelButton} onClick={closeEdit}>{t('cancel')}</button><button type="button" className={styles.enterQueueButton} onClick={() => void saveEdit()}>{t('saveChanges')}</button></footer>
          </section>
        </div>
      ) : null}
    </PageContainer>
  );
}

function QueueScreeningModal({ draft, onChange, onClose, onSubmit, patient }: { patient: PatientRecord; draft: QueueDraft; onChange: (draft: QueueDraft) => void; onClose: () => void; onSubmit: () => void }) {
  const t = useTranslations('patients');
  const pregnancy = activePregnancy(patient);
  const priority = inferPriority(patient, draft, t);
  const initials = patient.fullName.trim().charAt(0).toUpperCase() || 'P';

  function toggle(list: keyof Pick<QueueDraft, 'riskFactors' | 'routineMedication'>, value: string) {
    const next = draft[list].includes(value) ? draft[list].filter((item) => item !== value) : [...draft[list], value];
    onChange({ ...draft, [list]: next });
  }

  return (
    <div className={styles.modalOverlay} role="presentation" onMouseDown={onClose}>
      <section aria-labelledby="queue-screening-title" aria-modal="true" className={styles.queueModal} role="dialog" onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.modalHeader}>
          <div><h2 id="queue-screening-title">{t('screeningTitle')}</h2><p>{t('screeningSubtitle')}</p></div>
          <button type="button" aria-label={t('closeScreening')} className={styles.modalClose} onClick={onClose}><AppIcon name="x" width={20} height={20} /></button>
        </header>
        <div className={styles.patientStrip}>
          <span className={styles.patientAvatar}>{initials}</span>
          <div className={styles.patientSummaryText}>
            <div className={styles.patientSummaryTitle}><strong>{patient.fullName}</strong><span>ID: {patient.id}</span></div>
            <div className={styles.patientBadges}>
              <span><AppIcon name="user" width={12} height={12} />{pregnancy?.gestationalAge ? t('weeks', { count: pregnancy.gestationalAge }) : '-'}</span>
              <span><AppIcon name="calendar" width={12} height={12} />{formatDueDate(pregnancy?.edd)}</span>
              <span><AppIcon name="clock" width={12} height={12} />{t('lastVisit', { visit: pregnancy?.ancVisit ?? '-' })}</span>
              {pregnancy?.riskLevel === 'HIGH' || priority.level === 'HIGH' ? <b>{t('highRisk')}</b> : null}
            </div>
          </div>
        </div>
        <div className={styles.modalBody}>
          <section className={styles.modalSection}>
            <h3><span />{t('todayVisit')}</h3>
            <span className={styles.fieldLabel}>{t('reasonForVisit')}</span>
            <div className={styles.reasonGrid}>
              {reasonOptions.map((reason) => <button key={reason.label} type="button" className={[styles.reasonCard, draft.reason === reason.label ? styles.reasonActive : '', reason.danger ? styles.reasonDanger : ''].join(' ')} onClick={() => onChange({ ...draft, reason: reason.label })}>{draft.reason === reason.label ? <AppIcon className={styles.reasonCheck} name="checkCircle" width={14} height={14} /> : null}<AppIcon name={reason.icon} width={20} height={20} />{t(reason.label === 'ANC Checkup' ? 'reasonAnc' : reason.label === 'Complaint' ? 'reasonComplaint' : reason.label === 'Referral' ? 'reasonReferral' : 'reasonEmergency')}</button>)}
            </div>
            <div className={styles.twoColumnFields}>
              <label className={styles.fieldGroup}><span className={styles.fieldLabel}>{t('ancVisitType')}</span><select value={draft.ancVisit} onChange={(event) => onChange({ ...draft, ancVisit: event.target.value })}><option>ANC K1 (Trimester 1)</option><option>ANC K2 (Trimester 2)</option><option>ANC K3 (Trimester 3)</option><option>ANC K4 (Trimester 3)</option></select></label>
              <EditField label={t('complaintNotes')} value={draft.complaint} onChange={(value) => onChange({ ...draft, complaint: value })} />
            </div>
          </section>
          <section className={styles.modalSection}>
            <h3><span />{t('vitalSigns')}</h3>
            <div className={styles.vitalGrid}>
              <label className={styles.fieldGroup}><span className={styles.fieldLabel}>{t('bloodPressure')}</span><span className={styles.bpFields}><input placeholder={t('sys')} value={draft.systolic} onChange={(event) => onChange({ ...draft, systolic: event.target.value })} /><span>/</span><input placeholder={t('dia')} value={draft.diastolic} onChange={(event) => onChange({ ...draft, diastolic: event.target.value })} /></span></label>
              <EditField label={t('weight')} value={draft.weight} onChange={(value) => onChange({ ...draft, weight: value })} />
              <EditField label={t('height')} value={draft.height} onChange={(value) => onChange({ ...draft, height: value })} />
              <EditField label={t('muac')} value={draft.muac} onChange={(value) => onChange({ ...draft, muac: value })} helper="Normal (>23.5cm)" good />
              <EditField label={t('fetalHeartRate')} value={draft.fetalHeartRate} onChange={(value) => onChange({ ...draft, fetalHeartRate: value })} helper="Normal: 120-160 bpm" />
              <label className={styles.fieldGroup}><span className={styles.fieldLabel}>{t('temperaturePulse')}</span><span className={styles.tempFields}><input value={draft.temperature} onChange={(event) => onChange({ ...draft, temperature: event.target.value })} /><input value={draft.pulse} onChange={(event) => onChange({ ...draft, pulse: event.target.value })} /></span></label>
            </div>
          </section>
          <section className={styles.modalSection}>
            <h3><span />{t('riskMedication')}</h3>
            <div className={styles.confirmationGrid}>
              <Checklist title={t('detectedRisk')} items={riskOptions} values={draft.riskFactors} tone="risk" onToggle={(item) => toggle('riskFactors', item)} />
              <Checklist title={t('routineMedication')} items={medicationOptions} values={draft.routineMedication} tone="medication" onToggle={(item) => toggle('routineMedication', item)} />
            </div>
          </section>
          <section className={styles.modalSection}>
            <h3><span />{t('assessmentPlacement')}</h3>
            <div className={styles.assessmentBox}>
              <div className={styles.assessmentMain}>
                <EditField label={t('attendingPhysician')} value={draft.responsibleDoctor} onChange={(value) => onChange({ ...draft, responsibleDoctor: value })} />
                <p className={styles.riskNote}>{priority.message}</p>
              </div>
              <div className={styles.priorityCard}><span>{t('queuePriority')}</span><strong>{priority.level}</strong><small><AppIcon name="zap" width={12} height={12} />{t('estimatedMinutes', { count: priority.minutes })}</small></div>
            </div>
          </section>
        </div>
        <footer className={styles.modalFooter}>
          <p><AppIcon name="info" width={14} height={14} />{t('saveHistoryNote')}</p>
          <div className={styles.modalFooterActions}><button type="button" className={styles.cancelButton} onClick={onClose}>{t('cancel')}</button><button type="button" className={styles.enterQueueButton} onClick={onSubmit}><AppIcon name="plus" width={14} height={14} />{t('enterQueue')}</button></div>
        </footer>
      </section>
    </div>
  );
}

function Checklist({ items, onToggle, title, tone, values }: { title: string; items: string[]; values: string[]; tone: 'risk' | 'medication'; onToggle: (item: string) => void }) {
  return <div className={styles.checklistGroup}><span>{title}</span><div className={styles.checklistItems}>{items.map((item) => <label key={item} className={[styles.checkItem, values.includes(item) ? tone === 'risk' ? styles.riskItem : styles.medicationItem : ''].join(' ')}><input type="checkbox" checked={values.includes(item)} onChange={() => onToggle(item)} />{item}</label>)}</div></div>;
}

function EditField({ good, helper, label, onChange, strong, value }: { label: string; value: string; onChange: (value: string) => void; helper?: string; good?: boolean; strong?: boolean }) {
  return <label className={styles.fieldGroup}><span className={styles.fieldLabel}>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} />{helper ? <small className={good ? styles.goodHelper : strong ? styles.strongHelper : undefined}>{helper}</small> : null}</label>;
}
