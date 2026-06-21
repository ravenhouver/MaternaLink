'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/layout/page-container';
import { AppIcon } from '@/components/ui/app-icon';
import { createQueue, getPatient, getTodayQueue, type ExaminationRecord, type PatientRecord, type PregnancyRecord } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './patient-detail.module.css';

type DetailTab = 'medical' | 'personal';

export function PatientDetailContent({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [tab, setTab] = useState<DetailTab>('medical');
  const [isLoading, setIsLoading] = useState(true);
  const [isQueueing, setIsQueueing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getPatient(patientId)
      .then((nextPatient) => {
        if (!cancelled) setPatient(nextPatient);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Gagal memuat detail pasien');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const pregnancy = useMemo(() => activePregnancy(patient), [patient]);
  const exams = patient?.examinations ?? [];

  async function queuePatient() {
    if (!patient || !pregnancy) return;
    setIsQueueing(true);
    setError(null);
    try {
      await createQueue({ patientId: patient.id, pregnancyId: pregnancy.id });
    } catch (queueError) {
      setError(queueError instanceof Error ? queueError.message : 'Gagal memasukkan pasien ke antrean');
    } finally {
      setIsQueueing(false);
    }
  }

  async function startExamination() {
    if (!patient || !pregnancy) return;
    setIsQueueing(true);
    setError(null);
    try {
      const queue = await createQueue({ patientId: patient.id, pregnancyId: pregnancy.id });
      router.push(`${routes.examination}?queueId=${encodeURIComponent(queue.id)}`);
    } catch (queueError) {
      const activeQueue = await getTodayQueue()
        .then((rows) => rows.find((row) => row.patient.id === patient.id && row.pregnancy.id === pregnancy.id && row.status !== 'COMPLETED' && row.status !== 'CANCELLED'))
        .catch(() => null);
      if (activeQueue) router.push(`${routes.examination}?queueId=${encodeURIComponent(activeQueue.id)}`);
      else setError(queueError instanceof Error ? queueError.message : 'Gagal memulai pemeriksaan');
    } finally {
      setIsQueueing(false);
    }
  }

  if (isLoading) return <PageContainer size="wide" className={styles.page}><section className={styles.emptyState}>Loading patient detail...</section></PageContainer>;
  if (!patient) return <PageContainer size="wide" className={styles.page}><section className={styles.emptyState}>{error ?? 'Patient not found'}</section></PageContainer>;

  return (
    <PageContainer size="wide" className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href={routes.dashboard}>Home</Link>
        <AppIcon name="chevronRight" width={14} height={14} />
        <Link href={routes.patients}>Patient List</Link>
        <AppIcon name="chevronRight" width={14} height={14} />
        <strong>{patient.fullName}</strong>
      </nav>

      <PatientHeader patient={patient} pregnancy={pregnancy} isQueueing={isQueueing} onQueue={queuePatient} />
      {error ? <p className={styles.errorText}>{error}</p> : null}

      <div className={styles.tabs} role="tablist" aria-label="Patient detail tabs">
        <button type="button" role="tab" aria-selected={tab === 'medical'} className={tab === 'medical' ? styles.activeTab : undefined} onClick={() => setTab('medical')}>
          <AppIcon name="clipboard" width={18} height={18} />
          Medical Record
        </button>
        <button type="button" role="tab" aria-selected={tab === 'personal'} className={tab === 'personal' ? styles.activeTab : undefined} onClick={() => setTab('personal')}>
          <AppIcon name="user" width={18} height={18} />
          Personal Info
        </button>
      </div>

      {tab === 'medical' ? <MedicalRecordTab patient={patient} pregnancy={pregnancy} exams={exams} isQueueing={isQueueing} onStartExamination={startExamination} /> : <PersonalInfoTab patient={patient} pregnancy={pregnancy} />}
    </PageContainer>
  );
}

function PatientHeader({ patient, pregnancy, isQueueing, onQueue }: { patient: PatientRecord; pregnancy: PregnancyRecord | null; isQueueing: boolean; onQueue: () => void }) {
  return (
    <section className={styles.patientHeader}>
      <div className={styles.identityBlock}>
        <span className={styles.avatar}>{initials(patient.fullName)}</span>
        <div className={styles.identityCopy}>
          <div className={styles.nameRow}>
            <h1>{patient.fullName}</h1>
            <span>Active Pregnancy</span>
          </div>
          <p>ID: {formatPatientCode(patient.id)} - No. RM: #{formatMedicalRecord(patient)}</p>
        </div>
      </div>
      <div className={styles.headerStats}>
        <Metric label="Gestational Age" value={pregnancy?.gestationalAge ? `${pregnancy.gestationalAge} weeks` : '-'} />
        <Metric label="Due Date" value={formatShortDate(pregnancy?.edd)} />
        <Metric label="Last ANC Visit" value={pregnancy?.ancVisit ?? '-'} />
      </div>
      <div className={styles.headerActions}>
        <button type="button" className={styles.primaryButton} disabled={!pregnancy || isQueueing} onClick={onQueue}>
          <AppIcon name="plus" width={18} height={18} />
          {isQueueing ? 'Queueing...' : 'Queue'}
        </button>
        <Link className={styles.secondaryButton} href={`${routes.patients}?edit=${encodeURIComponent(patient.id)}`}>Edit Patient</Link>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function MedicalRecordTab({ exams, isQueueing, onStartExamination, patient, pregnancy }: { patient: PatientRecord; pregnancy: PregnancyRecord | null; exams: ExaminationRecord[]; isQueueing: boolean; onStartExamination: () => void }) {
  const latestExam = exams[0] ?? null;
  return (
    <div className={styles.medicalGrid}>
      <aside className={styles.sideStack}>
        <InfoCard title="Pregnancy Status" icon="calendar">
          <KeyValue label="LMP" value={formatDate(pregnancy?.lmp)} />
          <KeyValue label="EDD" value={formatDate(pregnancy?.edd)} />
          <KeyValue label="Gest. Age" value={pregnancy?.gestationalAge ? `${pregnancy.gestationalAge} weeks (${trimester(pregnancy.gestationalAge)})` : '-'} accent />
          <KeyValue label="Preg. Type" value={pregnancy?.pregnancyType ?? '-'} />
          <KeyValue label="G/P/A" value={`G${pregnancy?.gravida ?? 0} / P${pregnancy?.para ?? 0} / A${pregnancy?.abortus ?? 0}`} />
          <AncProgress visit={pregnancy?.ancVisit} />
        </InfoCard>
        <InfoCard title="Active Risk Factors" tone="danger">
          <ChipList items={jsonStrings(pregnancy?.riskFactors, fallbackRisks(pregnancy))} tone="danger" empty="No active risk factor" />
        </InfoCard>
        <InfoCard title="Routine Medication">
          <CheckList items={jsonStrings(pregnancy?.routineMedication)} />
        </InfoCard>
        <InfoCard title="Medical Background">
          <div className={styles.compactGrid}>
            <KeyValue label="Blood Type" value={patient.bloodType ?? '-'} accent />
            <KeyValue label="Allergy" value={patient.allergy ?? '-'} danger={Boolean(patient.allergy)} />
          </div>
          <KeyValue label="Chronic Conditions" value={patient.chronicHistory ?? '-'} />
        </InfoCard>
      </aside>

      <main className={styles.historyPanel}>
        <div className={styles.sectionTitleRow}>
          <h2>Examination History <span>({exams.length} records)</span></h2>
          <button type="button" disabled={!pregnancy || isQueueing} onClick={onStartExamination} className={styles.primaryButton}><AppIcon name="plus" width={18} height={18} />{isQueueing ? 'Queueing...' : 'New Examination'}</button>
        </div>
        {latestExam ? <FeaturedExam exam={latestExam} pregnancy={pregnancy} /> : <section className={styles.emptyExam}>No examination record yet.</section>}
        <div className={styles.examList}>
          {exams.slice(latestExam ? 1 : 0).map((exam) => <CollapsedExam key={exam.id} exam={exam} />)}
        </div>
      </main>
    </div>
  );
}

function FeaturedExam({ exam, pregnancy }: { exam: ExaminationRecord; pregnancy: PregnancyRecord | null }) {
  const risk = riskLevel(exam, pregnancy);
  const vital = exam.vitalSigns ?? {};
  const medication = medicationItems(exam.medication);
  return (
    <article className={[styles.featuredExam, styles[`risk${risk}`]].join(' ')}>
      <div className={styles.examMain}>
        <div className={styles.examHead}>
          <DateBadge value={exam.createdAt} />
          <div>
            <h3>Session #{shortId(exam.id)}</h3>
            <p><AppIcon name="clipboard" width={14} height={14} /> {doctorName(exam)}</p>
          </div>
          <RiskBadge risk={risk} />
        </div>
        <section className={styles.complaintBox}>
          <strong>Chief Complaint</strong>
          <p>{exam.complaint ?? 'No complaint recorded.'}</p>
        </section>
        <h4>Vital Signs</h4>
        <div className={styles.vitalGrid}>
          <Vital label="Blood Pressure" value={vitalText(vital, ['bloodPressure', 'blood_pressure', 'bp'], '-')} hint={bloodPressureHint(vital)} danger={bloodPressureDanger(vital)} />
          <Vital label="Temperature" value={vitalText(vital, ['temperature', 'temp'], '-')} hint="Recorded" />
          <Vital label="Heart Rate" value={vitalText(vital, ['pulse', 'pulseRate', 'pulse_rate'], '-')} hint="Normal" />
          <Vital label="Respiratory" value={vitalText(vital, ['respiratory', 'respiratoryRate'], '-')} hint="Normal" />
          <Vital label="Gestational Age" value={exam.gestationalAge ? `${exam.gestationalAge} weeks` : pregnancy?.gestationalAge ? `${pregnancy.gestationalAge} weeks` : '-'} hint={trimester(exam.gestationalAge ?? pregnancy?.gestationalAge)} />
          <Vital label="ANC Visit" value={exam.ancVisit ?? pregnancy?.ancVisit ?? '-'} hint="Visit" />
        </div>
        <TagSection title="Additional Symptoms" items={jsonLabels(exam.symptoms)} />
        <TagSection title="Diagnosis & Findings" items={jsonLabels(exam.diagnosis)} accent />
      </div>
      <aside className={styles.prescriptionBox}>
        <h4>Medication Issued</h4>
        <div className={styles.medTable}>{medication.length ? medication.map((item) => <div key={item.name}><strong>{item.name}</strong><span>{item.dosage}</span></div>) : <p>No medication recorded.</p>}</div>
        <button type="button" onClick={() => window.print()}><AppIcon name="printer" width={16} height={16} />Print Prescription</button>
      </aside>
    </article>
  );
}

function CollapsedExam({ exam }: { exam: ExaminationRecord }) {
  const risk = riskLevel(exam, null);
  return (
    <article className={[styles.collapsedExam, styles[`risk${risk}`]].join(' ')}>
      <DateBadge value={exam.createdAt} />
      <div>
        <h3>#{shortId(exam.id)} <span>by {doctorName(exam)}</span></h3>
        <p>{exam.complaint ?? 'Routine ANC Checkup'}</p>
      </div>
      <RiskBadge risk={risk} />
      <AppIcon name="chevronDown" width={18} height={18} />
    </article>
  );
}

function PersonalInfoTab({ patient, pregnancy }: { patient: PatientRecord; pregnancy: PregnancyRecord | null }) {
  return (
    <div className={styles.personalGrid}>
      <div className={styles.sideStack}>
        <InfoCard title="Main Identity">
          <div className={styles.infoGrid}>
            <KeyValue label="Full Name" value={patient.fullName} />
            <KeyValue label="NIK" value={patient.nik} />
            <KeyValue label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
            <KeyValue label="Phone Number" value={patient.phone ?? '-'} />
            <KeyValue label="Address" value={patient.address ?? '-'} wide />
          </div>
        </InfoCard>
        <InfoCard title="Insurance & Administration">
          <div className={styles.infoGrid}>
            <KeyValue label="BPJS Number" value={patient.bpjsNumber ?? '-'} />
            <KeyValue label="Patient ID" value={formatPatientCode(patient.id)} />
            <KeyValue label="No. RM" value={`#${formatMedicalRecord(patient)}`} />
            <KeyValue label="Registration Date" value="-" />
            <KeyValue label="Puskesmas" value="PKM Cilodong" />
            <KeyValue label="Responsible Doctor" value={pregnancy?.responsibleDoctor ?? '-'} />
          </div>
        </InfoCard>
        <InfoCard title="Next of Kin">
          <div className={styles.infoGrid}>
            <KeyValue label="Name" value={patient.emergencyName ?? '-'} />
            <KeyValue label="Relationship" value="Suami (Husband)" />
            <KeyValue label="Phone" value={patient.emergencyPhone ?? '-'} />
          </div>
        </InfoCard>
      </div>
      <div className={styles.sideStack}>
        <InfoCard title="Medical Background">
          <div className={styles.infoGridThree}>
            <KeyValue label="Blood Type" value={patient.bloodType ?? '-'} accent />
            <KeyValue label="Allergy" value={patient.allergy ?? '-'} danger={Boolean(patient.allergy)} />
            <KeyValue label="Chronic Conditions" value={patient.chronicHistory ?? '-'} />
          </div>
        </InfoCard>
        <InfoCard title="Pregnancy History">
          <div className={styles.gpaTiles}><strong><span>G</span>{pregnancy?.gravida ?? 0}</strong><strong><span>P</span>{pregnancy?.para ?? 0}</strong><strong><span>A</span>{pregnancy?.abortus ?? 0}</strong></div>
          <p className={styles.previousPregnancy}>Previous Pregnancy: data follows active pregnancy record and historical entries.</p>
        </InfoCard>
        <InfoCard title="High Risk Classification" tone="dangerHeader">
          <ChipList items={jsonStrings(pregnancy?.riskFactors, fallbackRisks(pregnancy))} tone="danger" empty="No high risk factor" />
        </InfoCard>
      </div>
    </div>
  );
}

function InfoCard({ children, icon, title, tone }: { children: React.ReactNode; icon?: 'calendar'; title: string; tone?: 'danger' | 'dangerHeader' }) {
  return <section className={[styles.card, tone === 'dangerHeader' ? styles.dangerHeaderCard : ''].join(' ')}><h2>{icon ? <AppIcon name={icon} width={17} height={17} /> : null}{title}</h2><div className={styles.cardBody}>{children}</div></section>;
}

function KeyValue({ label, value, accent, danger, badge, wide }: { label: string; value: string; accent?: boolean; danger?: boolean; badge?: string; wide?: boolean }) {
  return <div className={[styles.keyValue, wide ? styles.wide : ''].join(' ')}><span>{label}</span><strong className={[accent ? styles.accent : '', danger ? styles.dangerText : ''].join(' ')}>{value}</strong>{badge ? <em>{badge}</em> : null}</div>;
}

function AncProgress({ visit }: { visit?: string | null }) {
  const done = Math.max(0, Math.min(4, Number(String(visit ?? '').match(/\d+/)?.[0] ?? 0)));
  return <div className={styles.ancProgress}><span>ANC Progress</span><div>{[0, 1, 2, 3].map((item) => <i key={item} className={item < done ? styles.done : undefined} />)}</div><small>{visit ?? '-'} Visit</small></div>;
}

function ChipList({ items, tone, empty }: { items: string[]; tone?: 'danger'; empty: string }) {
  return <div className={styles.chipList}>{items.length ? items.map((item) => <span className={tone === 'danger' ? styles.dangerChip : undefined} key={item}>{tone === 'danger' ? <AppIcon name="alert" width={13} height={13} /> : null}{item}</span>) : <span>{empty}</span>}</div>;
}

function CheckList({ items }: { items: string[] }) {
  return <div className={styles.checkList}>{items.map((item) => <span key={item}><AppIcon name="checkCircle" width={17} height={17} />{item}</span>)}</div>;
}

function DateBadge({ value }: { value: string }) {
  const date = new Date(value);
  return <time className={styles.dateBadge} dateTime={value}><span>{Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span><strong>{Number.isNaN(date.getTime()) ? '-' : date.getFullYear()}</strong></time>;
}

function Vital({ label, value, hint, danger }: { label: string; value: string; hint: string; danger?: boolean }) {
  return <div className={danger ? styles.vitalDanger : undefined}><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>;
}

function TagSection({ title, items, accent }: { title: string; items: string[]; accent?: boolean }) {
  return <section className={styles.tagSection}><h4>{title}</h4><div>{items.length ? items.map((item) => <span className={accent ? styles.blueTag : undefined} key={item}>{item}</span>) : <span>None recorded</span>}</div></section>;
}

function RiskBadge({ risk }: { risk: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const label = risk === 'HIGH' ? 'Emergency Review' : risk === 'MEDIUM' ? 'Moderate Risk' : 'Low Risk';
  return <span className={[styles.riskBadge, styles[`badge${risk}`]].join(' ')}>{label}</span>;
}

function activePregnancy(patient: PatientRecord | null) {
  return patient?.pregnancies?.[0] ?? null;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((item) => item[0]?.toUpperCase()).join('') || 'P';
}

function formatPatientCode(id: string) {
  return id.startsWith('ML-') ? id : `ML-${id.slice(-8).toUpperCase()}`;
}

function formatMedicalRecord(patient: PatientRecord) {
  return `RM-${patient.nik.slice(-8) || patient.id.slice(-8)}`;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatShortDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function trimester(weeks?: number | null) {
  if (!weeks) return '-';
  if (weeks <= 13) return 'T1';
  if (weeks <= 27) return 'T2';
  return 'T3';
}

function shortId(id: string) {
  return `EXM-${id.slice(-10).toUpperCase()}`;
}

function doctorName(exam: ExaminationRecord) {
  return exam.createdBy?.displayName ?? exam.createdBy?.username ?? '-';
}

function jsonStrings(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  return fallback;
}

function jsonLabels(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      const row = item as Record<string, unknown>;
      return String(row.nama ?? row.name ?? row.kondisiId ?? row.gejalaId ?? row.obatId ?? 'Recorded item');
    }
    return String(item);
  });
}

function medicationItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    const quantity = row.quantity ? String(row.quantity) : '';
    const unit = row.unit ? String(row.unit) : '';
    return { name: String(row.nama ?? row.name ?? row.obatId ?? 'Medication'), dosage: [quantity, unit].filter(Boolean).join(' ') || '-' };
  });
}

function fallbackRisks(pregnancy: PregnancyRecord | null) {
  return pregnancy?.riskLevel === 'HIGH' ? ['High risk pregnancy'] : [];
}

function riskLevel(exam: ExaminationRecord, pregnancy: PregnancyRecord | null): 'LOW' | 'MEDIUM' | 'HIGH' {
  const summaryRisk = typeof exam.riskSummary?.riskLevel === 'string' ? exam.riskSummary.riskLevel : undefined;
  if (summaryRisk === 'HIGH' || pregnancy?.riskLevel === 'HIGH') return 'HIGH';
  if (summaryRisk === 'MEDIUM' || pregnancy?.riskLevel === 'MEDIUM') return 'MEDIUM';
  return 'LOW';
}

function vitalText(vital: Record<string, unknown>, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = vital[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function bloodPressureDanger(vital: Record<string, unknown>) {
  const text = vitalText(vital, ['bloodPressure', 'blood_pressure', 'bp'], '');
  const systolic = Number(text.match(/\d{2,3}/)?.[0] ?? 0);
  return systolic >= 140;
}

function bloodPressureHint(vital: Record<string, unknown>) {
  return bloodPressureDanger(vital) ? 'Hypertension' : 'Normal';
}
