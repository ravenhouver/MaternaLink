'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { AppIcon } from '@/components/ui/app-icon';
import { LiveWaveform } from '@/components/ui/live-waveform';
import { createAiExaminationDraft, createExamination, getExaminations, getGejala, getKondisi, getObat, getTodayQueue, transcribeSpeech, type AiExaminationDraft, type ExaminationRecord, type ExaminationSource, type GejalaRecord, type KondisiRecord, type ObatRecord, type QueueRecord, type SpeechTranscriptionResult } from '@/lib/api';
import { getMedicineName } from '@/lib/medicine-i18n';
import { routes } from '@/lib/routes';
import styles from './patient-examination.module.css';

type FlowMode = 'method' | 'recording' | 'transcript' | 'manual' | 'detail';
type FieldStatus = 'verified' | 'manual' | 'empty' | 'ai' | 'review';

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

type SelectOption = { value: string; label: string; shortLabel?: string };

type ExaminationFormState = {
  complaint: string;
  bloodPressure: string;
  pulse: string;
  gestationalAge: string;
  ancVisit: string;
  symptomIds: string[];
  diagnosisIds: string[];
  medications: MedicationFormRow[];
  notes: string;
};

type AiDraftMeta = Pick<AiExaminationDraft, 'symptomIds' | 'diagnosisIds' | 'needsReview' | 'minConfidence' | 'model'>;

type MedicationFormRow = {
  id: string;
  medicine: string;
  dosage: string;
  unit: string;
  duration: string;
  durationUnit: string;
  frequency: string;
};

const transcriptFields: ExaminationField[] = [
  { id: 'complaint', label: 'chiefComplaint', type: 'textarea', status: 'verified', wide: true },
  { id: 'bloodPressure', label: 'bloodPressure', suffix: 'mmHg', status: 'verified' },
  { id: 'pulse', label: 'pulseRate', placeholder: 'pulsePlaceholder', suffix: '/bpm', status: 'empty' },
  { id: 'gestationalAge', label: 'gestationalAge', suffix: 'weeks', status: 'verified' },
  { id: 'ancVisit', label: 'ancVisit', value: 'Select Visit', type: 'select', status: 'manual' },
  { id: 'symptomIds', label: 'symptoms', placeholder: 'symptomsPlaceholder', type: 'select', status: 'manual', wide: true },
  { id: 'diagnosisIds', label: 'diagnosis', placeholder: 'diagnosisPlaceholder', status: 'empty', wide: true, icon: true },
  { id: 'notes', label: 'additionalNotes', placeholder: 'notesPlaceholder', type: 'textarea', status: 'empty', wide: true },
];

const manualFields: ExaminationField[] = transcriptFields.map((field) => ({
  ...field,
  status: 'empty',
  value: field.value,
}));

const defaultForm: ExaminationFormState = {
  complaint: '',
  bloodPressure: '',
  pulse: '',
  gestationalAge: '',
  ancVisit: '',
  symptomIds: [],
  diagnosisIds: [],
  medications: [createMedicationRow()],
  notes: '',
};

function createMedicationRow(seed?: Partial<MedicationFormRow>): MedicationFormRow {
  return {
    id: seed?.id ?? `med-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    medicine: seed?.medicine ?? '',
    dosage: seed?.dosage ?? '',
    unit: seed?.unit ?? '',
    duration: seed?.duration ?? '',
    durationUnit: seed?.durationUnit ?? 'day',
    frequency: seed?.frequency ?? '',
  };
}

export function PatientExaminationContent() {
  const t = useTranslations('examination');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queueId = searchParams?.get('queueId') ?? undefined;
  const [mode, setMode] = useState<FlowMode>('method');
  const [queue, setQueue] = useState<QueueRecord | null>(null);
  const [form, setForm] = useState<ExaminationFormState>(defaultForm);
  const [source, setSource] = useState<ExaminationSource>('MANUAL');
  const [conditions, setConditions] = useState<KondisiRecord[]>([]);
  const [symptomOptions, setSymptomOptions] = useState<GejalaRecord[]>([]);
  const [medicines, setMedicines] = useState<ObatRecord[]>([]);
  const [completedExamination, setCompletedExamination] = useState<ExaminationRecord | null>(null);
  const [aiDraft, setAiDraft] = useState<AiDraftMeta | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFormMode = mode === 'transcript' || mode === 'manual';
  const pageTitle = mode === 'detail' ? t('examination') : mode === 'transcript' ? t('transcriptTitle') : mode === 'manual' ? t('manualTitle') : t('title');
  const pageSubtitle = isFormMode ? t('formSubtitle') : t('subtitle');

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
          bloodPressure: vitalSignValue(activeQueue.pregnancy.vitalSigns, ['bloodPressure', 'blood_pressure', 'bp']) ?? current.bloodPressure,
          pulse: vitalSignValue(activeQueue.pregnancy.vitalSigns, ['pulse', 'pulseRate', 'pulse_rate']) ?? current.pulse,
        }));
        if (queueId && activeQueue.status === 'COMPLETED') {
          getExaminations({ patientId: activeQueue.patient.id })
            .then((records) => {
              if (cancelled) return;
              setCompletedExamination(records.find((item) => item.queueId === activeQueue.id) ?? records[0] ?? null);
              setMode('detail');
            })
            .catch(() => {
              if (!cancelled) setMode('detail');
            });
        }
      }
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : t('loadQueueError')));
    return () => {
      cancelled = true;
    };
  }, [queueId]);

  useEffect(() => {
    Promise.all([getKondisi(), getGejala(), getObat()]).then(([nextConditions, nextSymptoms, nextMedicines]) => {
      setConditions(nextConditions);
      setSymptomOptions(nextSymptoms);
      setMedicines(nextMedicines);
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : t('loadMasterError')));
  }, []);

  function updateForm(key: keyof ExaminationFormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateFormList(key: 'symptomIds' | 'diagnosisIds', value: string[]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addMedication() {
    setForm((current) => ({ ...current, medications: [...current.medications, createMedicationRow()] }));
  }

  function removeMedication(id: string) {
    setForm((current) => ({
      ...current,
      medications: current.medications.length > 1 ? current.medications.filter((item) => item.id !== id) : current.medications,
    }));
  }

  function updateMedication(id: string, key: keyof Omit<MedicationFormRow, 'id'>, value: string) {
    setForm((current) => ({
      ...current,
      medications: current.medications.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  }

  useEffect(() => {
    if (!queue || symptomOptions.length === 0) return;
    const storedSymptoms = Array.isArray(queue.pregnancy.emergencySigns) ? queue.pregnancy.emergencySigns : [];
    if (storedSymptoms.length === 0) return;
    const normalized = new Set(storedSymptoms.map((item) => item.toLowerCase()));
    const matched = symptomOptions.filter((item) => normalized.has(item.id.toLowerCase()) || normalized.has(item.nama.toLowerCase())).map((item) => item.id);
    if (matched.length === 0) return;
    setForm((current) => (current.symptomIds.length ? current : { ...current, symptomIds: matched }));
  }, [queue, symptomOptions]);

  async function finishRecording(audio: Blob) {
    setError(null);
    try {
      const result = await transcribeSpeech(audio);
      const speechDraft = applySpeechDraft(form, result);
      const aiDraft = speechDraft.complaint.trim() ? await createAiExaminationDraft({ complaint: speechDraft.complaint, period: currentPeriod() }) : null;
      setForm(aiDraft ? applyAiDraft(speechDraft, aiDraft) : speechDraft);
      setAiDraft(aiDraft);
      setSource('VOICE_TRANSCRIPT_AI');
      setMode('transcript');
    } catch (transcribeError) {
      setError(transcribeError instanceof Error ? transcribeError.message : t('transcribeError'));
    }
  }

  async function saveExamination() {
    if (!queue) {
      setError(t('selectQueueError'));
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const { form: finalForm, draft } = await completeAiDraft(form);
      if (draft) setAiDraft(draft);
      if (finalForm !== form) setForm(finalForm);
      await createExamination({
        queueId: queue.id,
        patientId: queue.patient.id,
        pregnancyId: queue.pregnancy.id,
        source,
        complaint: finalForm.complaint,
        vitalSigns: buildVitalSigns(finalForm),
        gestationalAge: optionalInteger(finalForm.gestationalAge),
        ancVisit: optionalString(finalForm.ancVisit),
        diagnosis: finalForm.diagnosisIds.map((kondisiId) => ({ kondisiId, jumlahKasus: 1 })),
        symptoms: finalForm.symptomIds.map((gejalaId) => ({ gejalaId, jumlah: 1 })),
        medication: finalForm.medications.filter((item) => item.medicine).map(buildMedicationPayload),
        notes: optionalString(finalForm.notes),
        riskSummary: buildExaminationRiskSummary(finalForm, queue.pregnancy.riskLevel),
      });
      router.push(routes.forecastCalendar);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PageContainer size="wide" className={styles.page}>
      <header className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href={routes.queue}>{t('queue')}</Link>
        <AppIcon name="chevronRight" width={14} height={14} />
        <span>{queue?.patient.fullName ?? t('patient')}</span>
        <AppIcon name="chevronRight" width={14} height={14} />
        <strong>{t('examination')}</strong>
      </header>

      <section className={styles.titleRow}>
        <div>
          <h1>{pageTitle}</h1>
          <p>{pageSubtitle}</p>
        </div>
        <div className={styles.sessionId}>
          <span>{t('session')}</span>
          <strong>ID: {queue?.queueNo ?? '-'}</strong>
        </div>
      </section>

      <PatientInfoBar queue={queue} />
      {error ? <p className={styles.examError}>{error}</p> : null}

      {mode === 'method' ? <MethodSelector onManual={() => { setSource('MANUAL'); setMode('manual'); }} onRecord={() => setMode('recording')} /> : null}
      {mode === 'recording' ? <RecordingPanel onBack={() => setMode('method')} onFinish={(audio) => void finishRecording(audio)} /> : null}
      {mode === 'detail' ? <CompletedExaminationDetail examination={completedExamination} queue={queue} /> : null}
      {mode === 'transcript' ? <ExaminationForm aiDraft={aiDraft} conditions={conditions} fields={transcriptFields} form={form} isSaving={isSaving} locale={locale} medicines={medicines} mode="transcript" symptoms={symptomOptions} onAddMedication={addMedication} onChange={updateForm} onListChange={updateFormList} onMedicationChange={updateMedication} onRecordAgain={() => setMode('recording')} onRemoveMedication={removeMedication} onSave={saveExamination} /> : null}
      {mode === 'manual' ? <ExaminationForm aiDraft={aiDraft} conditions={conditions} fields={manualFields} form={form} isSaving={isSaving} locale={locale} medicines={medicines} mode="manual" symptoms={symptomOptions} onAddMedication={addMedication} onChange={updateForm} onListChange={updateFormList} onMedicationChange={updateMedication} onRecordAgain={() => setMode('recording')} onRemoveMedication={removeMedication} onSave={saveExamination} /> : null}
    </PageContainer>
  );
}

function jsonList(value: unknown, fallback = '-') {
  if (!value) return fallback;
  if (Array.isArray(value)) return value.length ? value.map((item) => typeof item === 'object' && item !== null ? Object.values(item).join(' ') : String(item)).join(', ') : fallback;
  if (typeof value === 'object') return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${key}: ${String(item)}`).join(', ');
  return String(value);
}

function CompletedExaminationDetail({ examination, queue }: { examination: ExaminationRecord | null; queue: QueueRecord | null }) {
  const t = useTranslations('examination');
  if (!examination) {
    return (
      <section className={styles.formCard} aria-label={t('examinationData')}>
        <div className={styles.formHeader}><AppIcon name="clipboardCheck" width={20} height={20} /><h2>{t('examinationDataTitle')}</h2></div>
        <p>{queue ? 'Pemeriksaan sudah selesai, tetapi detail pemeriksaan belum ditemukan.' : 'Data antrian belum ditemukan.'}</p>
        <footer className={styles.formFooter}><Link className={styles.outlineAction} href={routes.queue}>{t('queue')}</Link></footer>
      </section>
    );
  }

  return (
    <section className={styles.formCard} aria-label="Completed examination detail">
      <div className={styles.formHeader}><AppIcon name="clipboardCheck" width={20} height={20} /><h2>{t('examinationDataTitle')}</h2></div>
      <div className={styles.formGrid}>
        <label className={`${styles.formField} ${styles.wideField}`}><span className={styles.fieldLabelRow}><span>{t('chiefComplaint')}</span><FieldStatusTag status="verified" /></span><span className={`${styles.inputShell} ${styles.textareaShell}`}><textarea readOnly value={examination.complaint ?? '-'} /></span></label>
        <label className={styles.formField}><span className={styles.fieldLabelRow}><span>{t('gestationalAge')}</span><FieldStatusTag status="verified" /></span><span className={styles.inputShell}><input readOnly value={examination.gestationalAge ?? '-'} /><small>{t('weeks', { count: '' })}</small></span></label>
        <label className={styles.formField}><span className={styles.fieldLabelRow}><span>{t('ancVisit')}</span><FieldStatusTag status="verified" /></span><span className={styles.inputShell}><input readOnly value={examination.ancVisit ?? '-'} /></span></label>
        <label className={`${styles.formField} ${styles.wideField}`}><span className={styles.fieldLabelRow}><span>{t('symptoms')}</span><FieldStatusTag status="verified" /></span><span className={styles.inputShell}><input readOnly value={jsonList(examination.symptoms)} /></span></label>
        <label className={`${styles.formField} ${styles.wideField}`}><span className={styles.fieldLabelRow}><span>{t('diagnosis')}</span><FieldStatusTag status="verified" /></span><span className={styles.inputShell}><input readOnly value={jsonList(examination.diagnosis)} /></span></label>
        <label className={`${styles.formField} ${styles.wideField}`}><span className={styles.fieldLabelRow}><span>{t('medicationGivenTitle')}</span><FieldStatusTag status="verified" /></span><span className={styles.inputShell}><input readOnly value={jsonList(examination.medication)} /></span></label>
        <label className={`${styles.formField} ${styles.wideField}`}><span className={styles.fieldLabelRow}><span>{t('additionalNotes')}</span></span><span className={`${styles.inputShell} ${styles.textareaShell}`}><textarea readOnly value={examination.notes ?? '-'} /></span></label>
      </div>
      <footer className={styles.formFooter}><Link className={styles.outlineAction} href={routes.queue}>{t('queue')}</Link></footer>
    </section>
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
    symptomIds: current.symptomIds,
    diagnosisIds: result.draft.diagnosis ? [result.draft.diagnosis] : current.diagnosisIds,
    medications: result.draft.medicine ? [
      createMedicationRow({
        medicine: result.draft.medicine,
        dosage: result.draft.dosage ?? '',
        unit: result.draft.unit ?? '',
      }),
      ...current.medications.slice(1),
    ] : current.medications,
    notes: result.draft.notes ?? current.notes,
  };
}

async function completeAiDraft(current: ExaminationFormState): Promise<{ form: ExaminationFormState; draft: AiDraftMeta | null }> {
  if (!current.complaint.trim()) return { form: current, draft: null };
  if (current.symptomIds.length > 0 && current.diagnosisIds.length > 0) return { form: current, draft: null };
  const draft = await createAiExaminationDraft({ complaint: current.complaint, period: currentPeriod() });
  return { form: applyAiDraft(current, draft), draft };
}

function applyAiDraft(current: ExaminationFormState, draft: AiExaminationDraft): ExaminationFormState {
  return {
    ...current,
    symptomIds: current.symptomIds.length ? current.symptomIds : draft.symptomIds,
    diagnosisIds: current.diagnosisIds.length ? current.diagnosisIds : draft.diagnosisIds,
    notes: draft.needsReview && !current.notes ? `AI confidence rendah${draft.minConfidence == null ? '' : ` (${Math.round(draft.minConfidence * 100)}%)`}; perlu review bidan.` : current.notes,
  };
}

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function vitalSignValue(value: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!value || typeof value !== 'object') return undefined;
  for (const key of keys) {
    const item = value[key];
    if (typeof item === 'string' && item.trim()) return item;
    if (typeof item === 'number' && Number.isFinite(item)) return String(item);
  }

  return undefined;
}

function toMedicationNumber(value: string, fallback: number) {
  const normalized = value.trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized || fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalInteger(value: string) {
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function optionalPositiveNumber(value: string) {
  const parsed = toMedicationNumber(value, 0);
  return parsed > 0 ? parsed : undefined;
}

function buildMedicationPayload(item: MedicationFormRow) {
  const duration = optionalPositiveNumber(item.duration);
  const frequency = optionalPositiveNumber(item.frequency);
  return {
    obatId: item.medicine,
    quantity: Math.max(1, Math.round(toMedicationNumber(item.dosage, 1))),
    unit: optionalString(item.unit),
    duration,
    durationUnit: duration ? item.durationUnit : undefined,
    frequency,
    frequencyUnit: frequency ? 'x/day' : undefined,
  };
}

function buildVitalSigns(form: ExaminationFormState) {
  const pulse = optionalPositiveNumber(form.pulse);
  return {
    ...(form.bloodPressure.trim() ? { bloodPressure: form.bloodPressure.trim() } : {}),
    ...(pulse ? { pulse } : {}),
  };
}

function buildExaminationRiskSummary(form: ExaminationFormState, pregnancyRiskLevel: string) {
  const systolic = /^(\d{2,3})\s*\//.exec(form.bloodPressure.trim())?.[1];
  const risks: string[] = [];
  if (systolic && Number(systolic) >= 140) risks.push(`High blood pressure ${form.bloodPressure}`);
  if (pregnancyRiskLevel === 'HIGH') risks.push('Pregnancy marked high risk');
  return {
    riskLevel: risks.length ? 'HIGH' : pregnancyRiskLevel,
    risks,
  };
}

function PatientInfoBar({ queue }: { queue: QueueRecord | null }) {
  const t = useTranslations('examination');
  return (
    <section className={styles.patientInfo} aria-label={t('patientInfo')}>
      <div className={styles.patientIdentity}>
        <span className={styles.patientPhoto}><img src="/figma-dashboard/profil-bidan.png" alt="Mrs. Anisa Rahmawati" /></span>
        <div>
          <h2>{t('name', { name: queue?.patient.fullName ?? '-' })}</h2>
          <p>NIK: {queue?.patient.nik ?? '-'}</p>
        </div>
      </div>
      <div className={styles.pregnancyBadge}>
        <span>{t('activePregnancy')}</span>
        <strong>{queue?.pregnancy.gestationalAge ? t('weeks', { count: queue.pregnancy.gestationalAge }) : '-'}</strong>
        <small>{t('gestationalAge')}</small>
      </div>
    </section>
  );
}

function MethodSelector({ onManual, onRecord }: { onManual: () => void; onRecord: () => void }) {
  const t = useTranslations('examination');
  return (
    <section className={styles.methodSection}>
      <div className={styles.sectionIntro}>
        <h2>{t('chooseInput')}</h2>
        <p>{t('chooseInputBody')}</p>
      </div>

      <div className={styles.methodGrid}>
        <article className={styles.methodCard}>
          <span className={styles.methodIcon}><AppIcon name="edit" width={24} height={24} /></span>
          <h3>{t('manualEntry')}</h3>
          <p className={styles.methodLead}>{t('manualLead')}</p>
          <p>{t('manualBody')}</p>
          <button type="button" className={styles.outlineAction} onClick={onManual}>
            {t('startTyping')}
            <AppIcon name="arrowRight" width={16} height={16} />
          </button>
        </article>

        <article className={[styles.methodCard, styles.voiceCard].join(' ')}>
          <div className={styles.voiceTopline}>
            <span className={styles.voiceIcon}><AppIcon name="mic" width={24} height={24} /></span>
            <span className={styles.popularBadge}>{t('popular')}</span>
          </div>
          <h3>{t('voiceRecording')}</h3>
          <p className={styles.methodLead}>{t('voiceLead')}</p>
          <p>{t('voiceBody')}</p>
          <button type="button" className={styles.voiceAction} onClick={onRecord}>
            <AppIcon name="circleStop" width={18} height={18} />
            {t('startRecording')}
          </button>
        </article>
      </div>
    </section>
  );
}

function RecordingPanel({ onBack, onFinish }: { onBack: () => void; onFinish: (audio: Blob) => void }) {
  const t = useTranslations('examination');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const shouldSubmitRef = useRef(false);
  const [status, setStatus] = useState<'idle' | 'starting' | 'recording' | 'processing'>('idle');
  const [recordingError, setRecordingError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      shouldSubmitRef.current = false;
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function startRecording() {
    setRecordingError(null);
    setStatus('starting');
    shouldSubmitRef.current = false;
  }

  const handleStreamReady = useCallback((stream: MediaStream) => {
    try {
      if (typeof MediaRecorder === 'undefined') throw new Error(t('micError'));
      const recorder = new MediaRecorder(stream, recorderOptions());
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      });
      recorder.addEventListener('stop', () => {
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        if (shouldSubmitRef.current) onFinish(audio);
      });
      recorder.start();
      setStatus('recording');
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
      setStatus('idle');
      setRecordingError(error instanceof Error ? error.message : t('micError'));
    }
  }, [onFinish, t]);

  const handleWaveformError = useCallback((error: Error) => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setStatus('idle');
    setRecordingError(error.message || t('micError'));
  }, [t]);

  function stopRecording() {
    if (recorderRef.current?.state !== 'recording') return;
    shouldSubmitRef.current = true;
    setStatus('processing');
    recorderRef.current.stop();
  }

  function cancelRecording() {
    shouldSubmitRef.current = false;
    onBack();
  }

  return (
    <section className={styles.recordingCard} aria-live="polite">
      <span className={styles.recordingPulse}><AppIcon name="mic" width={42} height={42} /></span>
      <div>
        <h2>{status === 'processing' ? t('processingRecording') : status === 'starting' ? t('startingMicrophone') : status === 'recording' ? t('recordingProgress') : t('voiceRecording')}</h2>
        <p>{recordingError ?? t('recordingBody')}</p>
      </div>
      <div className={styles.waveformPanel}>
        <LiveWaveform
          active={status === 'starting' || status === 'recording'}
          processing={status === 'processing'}
          mode="scrolling"
          height={100}
          barWidth={4}
          barHeight={6}
          barGap={2}
          barColor="#2563eb"
          fadeEdges={true}
          sensitivity={1.35}
          onError={handleWaveformError}
          onStreamReady={handleStreamReady}
        />
      </div>
      <div className={styles.recordingActions}>
        {status === 'idle' ? (
          <button type="button" className={styles.primaryAction} onClick={startRecording}>
            <AppIcon name="mic" width={18} height={18} />
            {t('startRecording')}
          </button>
        ) : (
          <button type="button" className={styles.primaryAction} disabled={status !== 'recording'} onClick={stopRecording}>
            <AppIcon name="circleStop" width={18} height={18} />
            {status === 'processing' ? t('transcribing') : t('stopRecording')}
          </button>
        )}
        <button type="button" className={styles.outlineAction} disabled={status === 'processing'} onClick={cancelRecording}>{t('cancel')}</button>
      </div>
    </section>
  );
}

function recorderOptions(): MediaRecorderOptions | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return undefined;
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return { mimeType: 'audio/webm;codecs=opus' };
  if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) return { mimeType: 'audio/ogg;codecs=opus' };
  if (MediaRecorder.isTypeSupported('audio/webm')) return { mimeType: 'audio/webm' };
  return undefined;
}

function ExaminationForm({ aiDraft, conditions, fields, form, isSaving, locale, medicines, mode, symptoms, onAddMedication, onChange, onListChange, onMedicationChange, onRecordAgain, onRemoveMedication, onSave }: { aiDraft: AiDraftMeta | null; conditions: KondisiRecord[]; fields: ExaminationField[]; form: ExaminationFormState; isSaving: boolean; locale: string; medicines: ObatRecord[]; mode: 'transcript' | 'manual'; symptoms: GejalaRecord[]; onAddMedication: () => void; onChange: (key: keyof ExaminationFormState, value: string) => void; onListChange: (key: 'symptomIds' | 'diagnosisIds', value: string[]) => void; onMedicationChange: (id: string, key: keyof Omit<MedicationFormRow, 'id'>, value: string) => void; onRecordAgain: () => void; onRemoveMedication: (id: string) => void; onSave: () => void }) {
  const t = useTranslations('examination');
  const manualCount = fields.filter((field) => field.status === 'manual').length;
  const mainFields = fields.filter((field) => field.id !== 'notes');
  const notesField = fields.find((field) => field.id === 'notes');

  return (
    <section className={styles.formCard} aria-label={t('examinationData')}>
      <div className={styles.formHeader}>
        <AppIcon name="clipboardCheck" width={20} height={20} />
        <h2>{t('examinationDataTitle')}</h2>
      </div>

      <div className={styles.formGrid}>
        {mainFields.map((field) => <FormField aiDraft={aiDraft} conditions={conditions} key={field.id} field={field} form={form} locale={locale} medicines={medicines} symptoms={symptoms} onChange={onChange} onListChange={onListChange} />)}
        <MedicationPanel form={form} locale={locale} medicines={medicines} onAdd={onAddMedication} onChange={onMedicationChange} onRemove={onRemoveMedication} />
        {notesField ? <FormField aiDraft={aiDraft} conditions={conditions} field={notesField} form={form} locale={locale} medicines={medicines} symptoms={symptoms} onChange={onChange} onListChange={onListChange} /> : null}
      </div>

      <footer className={styles.formFooter}>
        {mode === 'transcript' && manualCount > 0 ? (
          <div className={styles.warningBox}>
            <AppIcon name="info" width={18} height={18} />
            <span>{t('unreadFields', { count: manualCount })}</span>
          </div>
        ) : null}
        <div className={styles.footerActions}>
          {mode === 'transcript' ? (
            <button type="button" className={styles.outlineAction} onClick={onRecordAgain}>
              <AppIcon name="mic" width={18} height={18} />
              {t('rerecord')}
            </button>
          ) : null}
          <button type="button" className={styles.primaryAction} disabled={isSaving} onClick={onSave}>
            <AppIcon name="save" width={18} height={18} />
            {isSaving ? t('saving') : t('saveExamination')}
          </button>
        </div>
        <p>{t('saveHint')}</p>
      </footer>
    </section>
  );
}

function FormField({ aiDraft, conditions, field, form, locale, medicines, symptoms, onChange, onListChange }: { aiDraft: AiDraftMeta | null; conditions: KondisiRecord[]; field: ExaminationField; form: ExaminationFormState; locale: string; medicines: ObatRecord[]; symptoms: GejalaRecord[]; onChange: (key: keyof ExaminationFormState, value: string) => void; onListChange: (key: 'symptomIds' | 'diagnosisIds', value: string[]) => void }) {
  const t = useTranslations('examination');
  const status = fieldStatus(field, form, aiDraft);
  const className = [styles.formField, field.wide ? styles.wideField : '', status === 'manual' ? styles.manualField : '', status === 'verified' ? styles.verifiedField : '', status === 'ai' ? styles.aiField : '', status === 'review' ? styles.reviewField : ''].filter(Boolean).join(' ');
  const key = field.id as keyof ExaminationFormState;
  const value = form[key] ?? '';
  const multiKey: 'symptomIds' | 'diagnosisIds' | null = field.id === 'symptomIds' ? 'symptomIds' : field.id === 'diagnosisIds' ? 'diagnosisIds' : null;
  const selectedValues = multiKey === 'symptomIds' ? form.symptomIds : multiKey === 'diagnosisIds' ? form.diagnosisIds : [];
  const options = selectOptions(field.id, conditions, symptoms, medicines, locale);

  function removeSelected(nextValue: string) {
    if (!multiKey) return;
    onListChange(multiKey, selectedValues.filter((item) => item !== nextValue));
  }

  function addSelected(nextValue: string) {
    if (!multiKey || !nextValue || selectedValues.includes(nextValue)) return;
    onListChange(multiKey, [...selectedValues, nextValue]);
  }

  if (multiKey) {
    return (
      <div className={className}>
        <span className={styles.fieldLabelRow}>
          <span>{t(field.label)}</span>
          <FieldStatusTag status={status} />
        </span>
        <span className={styles.inputShell}>
          {field.icon ? <AppIcon name="search" width={16} height={16} /> : null}
          <span className={styles.multiSelectBox}>
            {selectedValues.map((item) => {
              const option = options.find((entry) => entry.value === item);
              return (
                <button type="button" className={styles.selectedTag} key={item} onClick={() => removeSelected(item)}>
                  {option?.shortLabel ?? option?.label ?? item}
                  <AppIcon name="x" width={14} height={14} />
                </button>
              );
            })}
            <select aria-label={t(field.label)} value="" onChange={(event) => addSelected(event.target.value)}>
              <option value="">{field.placeholder ? t(field.placeholder) : t('select')}</option>
              {options.filter((option) => !selectedValues.includes(option.value)).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </span>
        </span>
      </div>
    );
  }

  return (
    <label className={className}>
      <span className={styles.fieldLabelRow}>
        <span>{t(field.label)}</span>
        <FieldStatusTag status={status} />
      </span>
      <span className={[styles.inputShell, field.type === 'textarea' ? styles.textareaShell : ''].join(' ')}>
        {field.icon ? <AppIcon name="search" width={16} height={16} /> : null}
        {field.type === 'textarea' ? (
          <textarea placeholder={field.placeholder ? t(field.placeholder) : undefined} value={String(value)} onChange={(event) => onChange(key, event.target.value)} />
        ) : field.type === 'select' ? (
          <select value={String(value)} onChange={(event) => onChange(key, event.target.value)}>
            <option value="">{field.placeholder ? t(field.placeholder) : t('select')}</option>
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ) : (
          <input placeholder={field.placeholder ? t(field.placeholder) : undefined} value={String(value)} onChange={(event) => onChange(key, event.target.value)} />
        )}
        {field.suffix ? <small>{field.suffix === 'weeks' ? t('weeks', { count: '' }) : field.suffix}</small> : null}
      </span>
    </label>
  );
}

function FieldStatusTag({ status }: { status?: FieldStatus }) {
  const t = useTranslations('examination');
  if (status === 'verified') return <em className={styles.verifiedTag}>{t('verified')}</em>;
  if (status === 'manual') return <em className={styles.manualTag}>{t('fillManual')}</em>;
  if (status === 'ai') return <em className={styles.aiTag}>{t('aiDraft')}</em>;
  if (status === 'review') return <em className={styles.reviewTag}>{t('needsReview')}</em>;
  return null;
}

function fieldStatus(field: ExaminationField, form: ExaminationFormState, draft: AiDraftMeta | null): FieldStatus | undefined {
  if (!draft) return field.status;
  if (field.id === 'symptomIds' && form.symptomIds.length > 0 && draft.symptomIds.length > 0) return draft.needsReview ? 'review' : 'ai';
  if (field.id === 'diagnosisIds' && form.diagnosisIds.length > 0 && draft.diagnosisIds.length > 0) return draft.needsReview ? 'review' : 'ai';
  if (field.id === 'notes' && draft.needsReview) return 'review';
  return field.status;
}

function MedicationPanel({ form, locale, medicines, onAdd, onChange, onRemove }: { form: ExaminationFormState; locale: string; medicines: ObatRecord[]; onAdd: () => void; onChange: (id: string, key: keyof Omit<MedicationFormRow, 'id'>, value: string) => void; onRemove: (id: string) => void }) {
  const t = useTranslations('examination');
  return (
    <section className={styles.medicationPanel} aria-label={t('medicationGiven')}>
      <div className={styles.medicationHeader}>
        <h3>{t('medicationGivenTitle')}</h3>
        <button type="button" className={styles.addMedicineButton} onClick={onAdd}>
          <AppIcon name="plus" width={16} height={16} />
          {t('addMedicine')}
        </button>
      </div>
      {form.medications.map((row, index) => (
        <div className={styles.medicationRow} key={row.id}>
          <div className={styles.medicationGrid}>
            <label className={styles.compactField}>
              <span>{t('medicationName')}</span>
              <select aria-label={`${t('medicationName')} ${index + 1}`} value={row.medicine} onChange={(event) => onChange(row.id, 'medicine', event.target.value)}>
                <option value="">{t('selectMedicine')}</option>
                {medicines.map((item) => <option key={item.id} value={item.id}>{getMedicineName(item, locale)}</option>)}
              </select>
            </label>
            <label className={styles.compactField}>
              <span>{t('dosage')}</span>
              <div className={styles.comboInput}>
                <input aria-label={`${t('dosage')} ${index + 1}`} placeholder="1.000,00" value={row.dosage} onChange={(event) => onChange(row.id, 'dosage', event.target.value)} />
                <select aria-label={`${t('dosage')} ${t('unit')} ${index + 1}`} value={row.unit} onChange={(event) => onChange(row.id, 'unit', event.target.value)}>
                  <option value="">{t('unit')}</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Ampul">Ampul</option>
                  <option value="Botol">Botol</option>
                  <option value="Strip">Strip</option>
                  <option value="Vial">Vial</option>
                </select>
              </div>
            </label>
            <label className={styles.compactField}>
              <span>{t('duration')}</span>
              <div className={styles.comboInput}>
                <input aria-label={`${t('duration')} ${index + 1}`} placeholder="1.000,00" value={row.duration} onChange={(event) => onChange(row.id, 'duration', event.target.value)} />
                <select aria-label={`${t('duration')} ${t('unit')} ${index + 1}`} value={row.durationUnit} onChange={(event) => onChange(row.id, 'durationUnit', event.target.value)}>
                  <option value="day">{t('day')}</option>
                  <option value="week">{t('week')}</option>
                </select>
              </div>
            </label>
            <label className={styles.compactField}>
              <span>{t('frequency')}</span>
              <div className={styles.comboInput}>
                <input aria-label={`${t('frequency')} ${index + 1}`} placeholder="1" value={row.frequency} onChange={(event) => onChange(row.id, 'frequency', event.target.value)} />
                <span>{t('perDay')}</span>
              </div>
            </label>
          </div>
          {form.medications.length > 1 ? (
            <button type="button" className={styles.removeMedicineButton} aria-label={t('removeMedication', { index: index + 1 })} onClick={() => onRemove(row.id)}>
              <AppIcon name="x" width={18} height={18} />
            </button>
          ) : null}
        </div>
      ))}
    </section>
  );
}

function selectOptions(fieldId: string, conditions: KondisiRecord[], symptoms: GejalaRecord[], medicines: ObatRecord[], locale: string): SelectOption[] {
  if (fieldId === 'ancVisit') return ['K1', 'K2', 'K3', 'K4', 'K5', 'K6'].map((value) => ({ value, label: value }));
  if (fieldId === 'symptomIds') return symptoms.map((item) => ({ value: item.id, label: `${item.id} - ${item.nama}`, shortLabel: item.nama }));
  if (fieldId === 'diagnosisIds') return conditions.map((item) => ({ value: item.id, label: `${item.id} - ${item.nama}`, shortLabel: item.nama }));
  if (fieldId === 'medicine') return medicines.map((item) => ({ value: item.id, label: `${item.id} - ${getMedicineName(item, locale)}` }));
  if (fieldId === 'unit') return ['Tablet', 'Ampul', 'Botol', 'Strip', 'Vial'].map((value) => ({ value, label: value }));
  return [];
}
