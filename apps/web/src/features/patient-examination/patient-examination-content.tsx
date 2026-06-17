'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { AppIcon } from '@/components/ui/app-icon';
import { createExamination, getTodayQueue, transcribeSpeech, type ExaminationSource, type QueueRecord, type SpeechTranscriptionResult } from '@/lib/api';
import { routes } from '@/lib/routes';
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

type ExaminationFormState = {
  complaint: string;
  bloodPressure: string;
  pulse: string;
  gestationalAge: string;
  ancVisit: string;
  symptoms: string;
  diagnosis: string;
  medicine: string;
  dosage: string;
  unit: string;
  notes: string;
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

const defaultForm: ExaminationFormState = {
  complaint: 'Perut mules',
  bloodPressure: '160/110',
  pulse: '',
  gestationalAge: '36',
  ancVisit: 'K5 - Trimester 3',
  symptoms: '',
  diagnosis: 'K03',
  medicine: 'OBT-010',
  dosage: '1',
  unit: 'Ampul',
  notes: '',
};

export function PatientExaminationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queueId = searchParams.get('queueId') ?? undefined;
  const [mode, setMode] = useState<FlowMode>('method');
  const [queue, setQueue] = useState<QueueRecord | null>(null);
  const [form, setForm] = useState<ExaminationFormState>(defaultForm);
  const [source, setSource] = useState<ExaminationSource>('MANUAL');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFormMode = mode === 'transcript' || mode === 'manual';

  useEffect(() => {
    let cancelled = false;
    getTodayQueue().then((rows) => {
      if (cancelled) return;
      const activeQueue = queueId ? rows.find((row) => row.id === queueId) : rows.find((row) => row.status === 'EXAMINING') ?? rows[0];
      if (activeQueue) {
        setQueue(activeQueue);
        setForm((current) => ({
          ...current,
          gestationalAge: String(activeQueue.pregnancy.gestationalAge ?? current.gestationalAge),
          ancVisit: activeQueue.pregnancy.ancVisit ?? current.ancVisit,
        }));
      }
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data antrian'));
    return () => {
      cancelled = true;
    };
  }, [queueId]);

  function updateForm(key: keyof ExaminationFormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function finishRecording(audio: Blob) {
    setError(null);
    try {
      const result = await transcribeSpeech(audio);
      setForm(applySpeechDraft(form, result));
      setSource('VOICE_TRANSCRIPT_AI');
      setMode('transcript');
    } catch (transcribeError) {
      setError(transcribeError instanceof Error ? transcribeError.message : 'Gagal mentranskrip rekaman suara');
    }
  }

  async function saveExamination() {
    if (!queue) {
      setError('Pilih antrian pasien sebelum menyimpan pemeriksaan.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await createExamination({
        queueId: queue.id,
        patientId: queue.patient.id,
        pregnancyId: queue.pregnancy.id,
        source,
        complaint: form.complaint,
        gestationalAge: Number(form.gestationalAge),
        ancVisit: form.ancVisit,
        diagnosis: form.diagnosis ? [{ kondisiId: form.diagnosis, jumlahKasus: 1 }] : [],
        symptoms: form.symptoms ? [{ gejalaId: 'G05', jumlah: 1 }] : [],
        medication: form.medicine ? [{ obatId: form.medicine, quantity: Number(form.dosage || 1) }] : [],
        notes: form.notes,
      });
      router.push(routes.forecastCalendar);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan pemeriksaan');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageContainer size="wide" className={styles.page}>
      <header className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href={routes.queue}>Daftar Pasien</Link>
        <AppIcon name="chevronRight" width={14} height={14} />
        <span>{queue?.patient.fullName ?? 'Pasien'}</span>
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
          <strong>ID: {queue?.queueNo ?? '-'}</strong>
        </div>
      </section>

      <PatientInfoBar queue={queue} />
      {error ? <p className={styles.examError}>{error}</p> : null}

      {mode === 'method' ? <MethodSelector onManual={() => setMode('manual')} onRecord={() => setMode('recording')} /> : null}
      {mode === 'recording' ? <RecordingPanel onBack={() => setMode('method')} onFinish={(audio) => void finishRecording(audio)} /> : null}
      {mode === 'transcript' ? <ExaminationForm fields={transcriptFields} form={form} isSaving={isSaving} mode="transcript" onChange={updateForm} onRecordAgain={() => setMode('recording')} onSave={saveExamination} /> : null}
      {mode === 'manual' ? <ExaminationForm fields={manualFields} form={form} isSaving={isSaving} mode="manual" onChange={updateForm} onRecordAgain={() => setMode('recording')} onSave={saveExamination} /> : null}
    </PageContainer>
  );
}

function applySpeechDraft(current: ExaminationFormState, result: SpeechTranscriptionResult): ExaminationFormState {
  return {
    ...current,
    complaint: result.draft.complaint || result.transcript || current.complaint,
    bloodPressure: result.draft.bloodPressure ?? current.bloodPressure,
    pulse: result.draft.pulse ?? current.pulse,
    gestationalAge: result.draft.gestationalAge != null ? String(result.draft.gestationalAge) : current.gestationalAge,
    ancVisit: result.draft.ancVisit ?? current.ancVisit,
    symptoms: result.draft.symptoms.length ? result.draft.symptoms.join(', ') : current.symptoms,
    diagnosis: result.draft.diagnosis ?? current.diagnosis,
    medicine: result.draft.medicine ?? current.medicine,
    dosage: result.draft.dosage ?? current.dosage,
    unit: result.draft.unit ?? current.unit,
    notes: result.draft.notes ?? current.notes,
  };
}

function PatientInfoBar({ queue }: { queue: QueueRecord | null }) {
  return (
    <section className={styles.patientInfo} aria-label="Patient information">
      <div className={styles.patientIdentity}>
        <span className={styles.patientPhoto}><img src="/figma-dashboard/profil-bidan.png" alt="Mrs. Anisa Rahmawati" /></span>
        <div>
          <h2>Name: {queue?.patient.fullName ?? '-'}</h2>
          <p>NIK: {queue?.patient.nik ?? '-'}</p>
        </div>
      </div>
      <div className={styles.pregnancyBadge}>
        <span>Active Pregnancy</span>
        <strong>{queue?.pregnancy.gestationalAge ?? '-'} weeks</strong>
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

function RecordingPanel({ onBack, onFinish }: { onBack: () => void; onFinish: (audio: Blob) => void }) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [status, setStatus] = useState<'starting' | 'recording' | 'processing'>('starting');
  const [recordingError, setRecordingError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const recorder = new MediaRecorder(stream, { mimeType: preferredMimeType() });
        streamRef.current = stream;
        recorderRef.current = recorder;
        chunksRef.current = [];
        recorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        });
        recorder.addEventListener('stop', () => {
          if (cancelled) return;
          const audio = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          stream.getTracks().forEach((track) => track.stop());
          onFinish(audio);
        });
        recorder.start();
        setStatus('recording');
      } catch (error) {
        setRecordingError(error instanceof Error ? error.message : 'Tidak bisa mengakses mikrofon');
      }
    }

    void startRecording();
    return () => {
      cancelled = true;
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [onFinish]);

  function stopRecording() {
    if (recorderRef.current?.state !== 'recording') return;
    setStatus('processing');
    recorderRef.current.stop();
  }

  return (
    <section className={styles.recordingCard} aria-live="polite">
      <span className={styles.recordingPulse}><AppIcon name="mic" width={42} height={42} /></span>
      <div>
        <h2>{status === 'processing' ? 'Processing Recording' : status === 'starting' ? 'Starting Microphone' : 'Recording in Progress'}</h2>
        <p>{recordingError ?? 'Capture doctor notes. Finish recording to transcribe and review extracted examination data.'}</p>
      </div>
      <div className={styles.waveform} aria-hidden="true">
        {Array.from({ length: 24 }).map((_, index) => <span key={index} style={{ height: `${18 + (index % 6) * 9}px` }} />)}
      </div>
      <div className={styles.recordingActions}>
        <button type="button" className={styles.outlineAction} onClick={onBack}>Cancel</button>
        <button type="button" className={styles.primaryAction} disabled={status !== 'recording'} onClick={stopRecording}>
          <AppIcon name="circleStop" width={18} height={18} />
          {status === 'processing' ? 'Transcribing...' : 'Finish Recording'}
        </button>
      </div>
    </section>
  );
}

function preferredMimeType() {
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
  if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) return 'audio/ogg;codecs=opus';
  return 'audio/webm';
}

function ExaminationForm({ fields, form, isSaving, mode, onChange, onRecordAgain, onSave }: { fields: ExaminationField[]; form: ExaminationFormState; isSaving: boolean; mode: 'transcript' | 'manual'; onChange: (key: keyof ExaminationFormState, value: string) => void; onRecordAgain: () => void; onSave: () => void }) {
  const manualCount = fields.filter((field) => field.status === 'manual').length;

  return (
    <section className={styles.formCard} aria-label="Examination data">
      <div className={styles.formHeader}>
        <AppIcon name="clipboardCheck" width={20} height={20} />
        <h2>Examination Data</h2>
      </div>

      <div className={styles.formGrid}>
        {fields.map((field) => <FormField key={field.id} field={field} form={form} onChange={onChange} />)}
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
          <button type="button" className={styles.primaryAction} disabled={isSaving} onClick={onSave}>
            <AppIcon name="save" width={18} height={18} />
            {isSaving ? 'Saving...' : 'Save Examination'}
          </button>
        </div>
        <p>Make sure all data is filled in correctly before saving.</p>
      </footer>
    </section>
  );
}

function FormField({ field, form, onChange }: { field: ExaminationField; form: ExaminationFormState; onChange: (key: keyof ExaminationFormState, value: string) => void }) {
  const className = [styles.formField, field.wide ? styles.wideField : '', field.status === 'manual' ? styles.manualField : '', field.status === 'verified' ? styles.verifiedField : ''].filter(Boolean).join(' ');
  const key = field.id as keyof ExaminationFormState;
  const value = form[key] ?? '';

  return (
    <label className={className}>
      <span className={styles.fieldLabelRow}>
        <span>{field.label}</span>
        {field.status === 'verified' ? <em className={styles.verifiedTag}>Verified</em> : null}
        {field.status === 'manual' ? <em className={styles.manualTag}>Fill Manually</em> : null}
      </span>
      <span className={[styles.inputShell, field.type === 'textarea' ? styles.textareaShell : ''].join(' ')}>
        {field.icon ? <AppIcon name="search" width={16} height={16} /> : null}
        {field.type === 'textarea' ? (
          <textarea placeholder={field.placeholder} value={value} onChange={(event) => onChange(key, event.target.value)} />
        ) : field.type === 'select' ? (
          <select value={value} onChange={(event) => onChange(key, event.target.value)}>
            <option value="">{field.placeholder ?? 'Select'}</option>
            <option value="K1">K1</option>
            <option value="K2">K2</option>
            <option value="K3">K3</option>
            <option value="K4">K4</option>
            <option value="K5 - Trimester 3">K5 - Trimester 3</option>
            <option value="Tablet">Tablet</option>
            <option value="Ampul">Ampul</option>
          </select>
        ) : (
          <input placeholder={field.placeholder} value={value} onChange={(event) => onChange(key, event.target.value)} />
        )}
        {field.suffix ? <small>{field.suffix}</small> : null}
      </span>
    </label>
  );
}
