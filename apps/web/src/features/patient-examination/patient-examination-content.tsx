'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { AppIcon } from '@/components/ui/app-icon';
import styles from './patient-examination.module.css';

type FlowMode = 'method' | 'recording' | 'transcript' | 'manual';
type FieldStatus = 'verified' | 'manual' | 'empty';

type ExaminationField = {
  id: string;
  label: string;
  value?: string;
  placeholder?: string;
  suffix?: string;
  status?: FieldStatus;
  type?: 'input' | 'textarea' | 'select';
  wide?: boolean;
  icon?: boolean;
};

const transcriptFields: ExaminationField[] = [
  { id: 'complaint', label: 'Chief Complaint', value: 'Perut mules', type: 'textarea', status: 'verified', wide: true },
  { id: 'bloodPressure', label: 'Blood Pressure', value: '160/110', suffix: 'mmHg', status: 'verified' },
  { id: 'pulse', label: 'Pulse Rate', placeholder: 'Contoh: 80', suffix: '/bpm', status: 'empty' },
  { id: 'gestationalAge', label: 'Gestational Age', value: '36', suffix: 'weeks', status: 'verified' },
  { id: 'ancVisit', label: 'ANC Visit', value: 'Select Visit', type: 'select', status: 'manual' },
  { id: 'symptoms', label: 'Additional Symptoms', placeholder: 'Note other symptoms like dizziness, swelling, or blurred vision...', type: 'textarea', status: 'manual', wide: true },
  { id: 'diagnosis', label: 'Diagnosis', placeholder: 'Start typing diagnosis (ICD-10)...', status: 'empty', wide: true, icon: true },
  { id: 'medicine', label: 'Medication Given', value: 'MgSO4 4g IV', status: 'verified' },
  { id: 'dosage', label: 'Dosage', placeholder: 'Example: 1x1', status: 'empty' },
  { id: 'unit', label: 'Unit', value: 'Tablet', type: 'select', status: 'empty' },
  { id: 'notes', label: 'Additional Notes (Optional)', placeholder: 'Any additional information...', type: 'textarea', status: 'empty', wide: true },
];

const manualFields: ExaminationField[] = transcriptFields.map((field) => ({
  ...field,
  status: 'empty',
  value: field.id === 'complaint' ? 'Perut mules' : field.id === 'bloodPressure' ? '160/110' : field.id === 'gestationalAge' ? '36' : field.id === 'ancVisit' ? 'K5 - Trimester 3' : field.value,
}));

export function PatientExaminationContent() {
  const [mode, setMode] = useState<FlowMode>('method');
  const isFormMode = mode === 'transcript' || mode === 'manual';

  return (
    <PageContainer size="wide" className={styles.page}>
      <header className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/inputs">Daftar Pasien</Link>
        <AppIcon name="chevronRight" width={14} height={14} />
        <span>Ny. Anisa Rahmawati</span>
        <AppIcon name="chevronRight" width={14} height={14} />
        <strong>Pemeriksaan</strong>
      </header>

      <section className={styles.titleRow}>
        <div>
          <h1>{isFormMode ? 'Voice Transcription Results' : 'Patient Examination'}</h1>
          <p>{isFormMode ? 'Check results - empty fields must be filled manually' : 'Perform daily medical recording to monitor maternal and fetal health'}</p>
        </div>
        <div className={styles.sessionId}>
          <span>Examination Session</span>
          <strong>ID: #EXM-20240520-001</strong>
        </div>
      </section>

      <PatientInfoBar />

      {mode === 'method' ? <MethodSelector onManual={() => setMode('manual')} onRecord={() => setMode('recording')} /> : null}
      {mode === 'recording' ? <RecordingPanel onBack={() => setMode('method')} onFinish={() => setMode('transcript')} /> : null}
      {mode === 'transcript' ? <ExaminationForm fields={transcriptFields} mode="transcript" onRecordAgain={() => setMode('recording')} /> : null}
      {mode === 'manual' ? <ExaminationForm fields={manualFields} mode="manual" onRecordAgain={() => setMode('recording')} /> : null}
    </PageContainer>
  );
}

function PatientInfoBar() {
  return (
    <section className={styles.patientInfo} aria-label="Patient information">
      <div className={styles.patientIdentity}>
        <span className={styles.patientPhoto}><img src="/figma-dashboard/profil-bidan.png" alt="Mrs. Anisa Rahmawati" /></span>
        <div>
          <h2>Name: Mrs. Anisa Rahmawati</h2>
          <p>No. RM: #RM-202405012</p>
        </div>
      </div>
      <div className={styles.pregnancyBadge}>
        <span>Active Pregnancy</span>
        <strong>36 weeks</strong>
        <small>Gestational Age</small>
      </div>
    </section>
  );
}

function MethodSelector({ onManual, onRecord }: { onManual: () => void; onRecord: () => void }) {
  return (
    <section className={styles.methodSection}>
      <div className={styles.sectionIntro}>
        <h2>Choose Input Method</h2>
        <p>{"Choose how to record today's patient check-up results"}</p>
      </div>

      <div className={styles.methodGrid}>
        <article className={styles.methodCard}>
          <span className={styles.methodIcon}><AppIcon name="edit" width={24} height={24} /></span>
          <h3>Manual Entry</h3>
          <p className={styles.methodLead}>Fill out the medical form step-by-step</p>
          <p>Best for detailed data entry with full control over each input field.</p>
          <button type="button" className={styles.outlineAction} onClick={onManual}>
            Start Typing
            <AppIcon name="arrowRight" width={16} height={16} />
          </button>
        </article>

        <article className={[styles.methodCard, styles.voiceCard].join(' ')}>
          <div className={styles.voiceTopline}>
            <span className={styles.voiceIcon}><AppIcon name="mic" width={24} height={24} /></span>
            <span className={styles.popularBadge}>Popular</span>
          </div>
          <h3>Voice Recording</h3>
          <p className={styles.methodLead}>AI listens to your audio, you check the result.</p>
          <p>Record your doctor's explanation or check-up results. The system will automatically transcribe the information and fill the form for you - you just need to verify.</p>
          <button type="button" className={styles.voiceAction} onClick={onRecord}>
            <AppIcon name="circleStop" width={18} height={18} />
            Start Recording
          </button>
        </article>
      </div>
    </section>
  );
}

function RecordingPanel({ onBack, onFinish }: { onBack: () => void; onFinish: () => void }) {
  return (
    <section className={styles.recordingCard} aria-live="polite">
      <span className={styles.recordingPulse}><AppIcon name="mic" width={42} height={42} /></span>
      <div>
        <h2>Recording in Progress</h2>
        <p>Capture doctor notes for Mrs. Anisa Rahmawati. Finish recording to review extracted examination data.</p>
      </div>
      <div className={styles.waveform} aria-hidden="true">
        {Array.from({ length: 24 }).map((_, index) => <span key={index} style={{ height: `${18 + (index % 6) * 9}px` }} />)}
      </div>
      <div className={styles.recordingActions}>
        <button type="button" className={styles.outlineAction} onClick={onBack}>Cancel</button>
        <button type="button" className={styles.primaryAction} onClick={onFinish}>
          <AppIcon name="circleStop" width={18} height={18} />
          Finish Recording
        </button>
      </div>
    </section>
  );
}

function ExaminationForm({ fields, mode, onRecordAgain }: { fields: ExaminationField[]; mode: 'transcript' | 'manual'; onRecordAgain: () => void }) {
  const manualCount = fields.filter((field) => field.status === 'manual').length;

  return (
    <section className={styles.formCard} aria-label="Examination data">
      <div className={styles.formHeader}>
        <AppIcon name="clipboardCheck" width={20} height={20} />
        <h2>Examination Data</h2>
      </div>

      <div className={styles.formGrid}>
        {fields.map((field) => <FormField key={field.id} field={field} />)}
      </div>

      <footer className={styles.formFooter}>
        {mode === 'transcript' && manualCount > 0 ? (
          <div className={styles.warningBox}>
            <AppIcon name="info" width={18} height={18} />
            <span>{manualCount} fields unread - please complete them before saving</span>
          </div>
        ) : null}
        <div className={styles.footerActions}>
          {mode === 'transcript' ? (
            <button type="button" className={styles.outlineAction} onClick={onRecordAgain}>
              <AppIcon name="mic" width={18} height={18} />
              Re-record
            </button>
          ) : null}
          <button type="button" className={styles.primaryAction}>
            <AppIcon name="save" width={18} height={18} />
            Save Examination
          </button>
        </div>
        <p>Make sure all data is filled in correctly before saving.</p>
      </footer>
    </section>
  );
}

function FormField({ field }: { field: ExaminationField }) {
  const className = [styles.formField, field.wide ? styles.wideField : '', field.status === 'manual' ? styles.manualField : '', field.status === 'verified' ? styles.verifiedField : ''].filter(Boolean).join(' ');
  const value = field.value ?? field.placeholder ?? '';

  return (
    <label className={className}>
      <span className={styles.fieldLabelRow}>
        <span>{field.label}</span>
        {field.status === 'verified' ? <em className={styles.verifiedTag}>Verified</em> : null}
        {field.status === 'manual' ? <em className={styles.manualTag}>Fill Manually</em> : null}
      </span>
      <span className={[styles.inputShell, field.type === 'textarea' ? styles.textareaShell : ''].join(' ')}>
        {field.icon ? <AppIcon name="search" width={16} height={16} /> : null}
        <span className={!field.value ? styles.placeholder : undefined}>{value}</span>
        {field.suffix ? <small>{field.suffix}</small> : null}
        {field.type === 'select' ? <AppIcon name="chevronDown" width={18} height={18} /> : null}
      </span>
    </label>
  );
}
