'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { AppIcon } from '@/components/ui/app-icon';
import { createPatient, createQueue, getCurrentUser, type PregnancyRiskLevel } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './patient-registration.module.css';

type ManualStage = 'manual-personal' | 'pregnancy' | 'screening';
type RequiredPersonalField = 'address' | 'dateOfBirth' | 'emergencyName' | 'emergencyPhone' | 'fullName' | 'nik' | 'phone';
type RequiredPregnancyField = 'ancVisit' | 'emergencySigns' | 'pregnancyType' | 'visitReason';
type RequiredField = RequiredPersonalField | RequiredPregnancyField;

const manualStages: ManualStage[] = ['manual-personal', 'pregnancy', 'screening'];

const stepLabels = ['Personal Data', 'Pregnancy Data', 'Screening & Risk'];

const bloodTypeOptions = ['A', 'B', 'AB', 'O'] as const;
const ancVisitOptions = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6+'] as const;
const noEmergencySignsLabel = 'No symptoms above';

const pregnancyRiskFlags = ['Severe headache', 'Bleeding', 'Severe vomiting', 'Severe abdominal pain', 'Decreased fetal movement'];

const screeningFactors: ReadonlyArray<{ checked?: boolean; label: string; tag?: string }> = [
  { label: 'Hypertension' },
  { label: 'Anemia' },
  { label: 'Gestational DM' },
  { label: 'Preeclampsia' },
  { label: 'Complications' },
  { label: 'History of C-section' },
  { label: 'Gap < 2 Yrs' },
  { label: 'Infection' },
] as const;

const requiredFieldErrors: Record<RequiredField, string> = {
  address: 'Alamat pasien wajib diisi.',
  ancVisit: 'Kunjungan ANC terakhir wajib dipilih.',
  dateOfBirth: 'Tanggal lahir wajib diisi.',
  emergencyName: 'Nama kontak darurat wajib diisi.',
  emergencyPhone: 'Nomor HP kontak darurat wajib diisi.',
  emergencySigns: 'Pilih minimal satu tanda bahaya atau No symptoms above.',
  fullName: 'Nama pasien wajib diisi.',
  nik: 'NIK wajib diisi.',
  phone: 'Nomor HP wajib diisi.',
  pregnancyType: 'Tipe kehamilan wajib dipilih.',
  visitReason: 'Alasan kunjungan wajib dipilih.',
};

type ManualRegistrationForm = {
  allergy: string;
  bloodType: string;
  dateOfBirth: string;
  fullName: string;
  nik: string;
  phone: string;
  address: string;
  bpjsNumber: string;
  emergencyName: string;
  emergencyPhone: string;
  chronicDiseases: string[];
  abortus: string;
  gestationalAge: string;
  gravida: string;
  lmp: string;
  edd: string;
  ancVisit: string;
  para: string;
  visitReason: string;
  pregnancyType: string;
  chiefComplaint: string;
  emergencySigns: string[];
  bloodPressure: string;
  weight: string;
  height: string;
  muac: string;
  pulse: string;
  temperature: string;
  fetalHeartRate: string;
  riskFactors: string[];
  routineMedication: string[];
  clinicalNotes: string;
  responsibleDoctor: string;
  riskLevel: PregnancyRiskLevel;
};

const emptyForm: ManualRegistrationForm = {
  allergy: '',
  bloodType: '',
  dateOfBirth: '',
  fullName: '',
  nik: '',
  phone: '',
  address: '',
  bpjsNumber: '',
  emergencyName: '',
  emergencyPhone: '',
  chronicDiseases: [],
  abortus: '0',
  gestationalAge: '',
  gravida: '',
  lmp: '',
  edd: '',
  ancVisit: '',
  para: '',
  visitReason: '',
  pregnancyType: '',
  chiefComplaint: '',
  emergencySigns: [],
  bloodPressure: '',
  weight: '',
  height: '',
  muac: '',
  pulse: '',
  temperature: '',
  fetalHeartRate: '',
  riskFactors: [],
  routineMedication: [],
  clinicalNotes: '',
  responsibleDoctor: '',
  riskLevel: 'LOW',
};

function toOptionalNumber(value: string) {
  return value.trim() ? Number(value) : undefined;
}

function normalizeCommaSeparated(value: string) {
  const normalized = value.split(',').map((item) => item.trim()).filter(Boolean).join(', ');
  return normalized || undefined;
}

function formatDisplayDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function parseLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function calculateGestationalAge(lmp: string, edd: string, source: 'lmp' | 'edd' = lmp ? 'lmp' : 'edd') {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lmpDate = parseLocalDate(lmp);
  const eddDate = parseLocalDate(edd);
  const msPerDay = 24 * 60 * 60 * 1000;
  const useEdd = source === 'edd' && eddDate;
  const gestationalDays = useEdd
    ? 280 - Math.ceil((eddDate.getTime() - todayStart.getTime()) / msPerDay)
    : lmpDate
    ? Math.floor((todayStart.getTime() - lmpDate.getTime()) / msPerDay)
    : eddDate
      ? 280 - Math.ceil((eddDate.getTime() - todayStart.getTime()) / msPerDay)
      : null;

  if (gestationalDays == null || gestationalDays < 0) return '';
  return String(Math.min(Math.floor(gestationalDays / 7), 42));
}

function toggleItem(items: string[], item: string) {
  return items.includes(item) ? items.filter((value) => value !== item) : [...items, item];
}

function maternalAge(dateOfBirth: string) {
  if (!dateOfBirth) return null;
  const date = new Date(dateOfBirth);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  if (now.getMonth() < date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() < date.getDate())) age -= 1;
  return age;
}

function systolicPressure(value: string) {
  const match = /^(\d{2,3})\s*\//.exec(value.trim());
  return match ? Number(match[1]) : null;
}

function normalizedBloodPressure(value: string) {
  return value.trim().replace(/\s+/g, '');
}

function bmi(weight: string, height: string) {
  const kg = Number(weight);
  const cm = Number(height);
  if (!kg || !cm) return null;
  return kg / ((cm / 100) ** 2);
}

function bmiStatus(value: number | null) {
  if (value == null) return 'FILL WEIGHT & HEIGHT';
  if (value < 18.5) return 'UNDERWEIGHT';
  if (value < 25) return 'NORMAL';
  if (value < 30) return 'OVERWEIGHT';
  if (value < 35) return 'OBESITY I';
  if (value < 40) return 'OBESITY II';
  return 'OBESITY III';
}

function hasEmergencySymptoms(form: ManualRegistrationForm) {
  return form.emergencySigns.some((sign) => sign !== noEmergencySignsLabel);
}

function calculatedRisks(form: ManualRegistrationForm) {
  return Array.from(new Set([...riskSummaryItems(form), ...autoDetectedRisks(form)]));
}

function autoDetectedRisks(form: ManualRegistrationForm) {
  const age = maternalAge(form.dateOfBirth);
  const systolic = systolicPressure(form.bloodPressure);
  const detected = new Set<string>();
  if (age != null && (age < 20 || age > 35)) detected.add(`Age ${age} years`);
  if (form.pregnancyType === 'Multiple') detected.add('Multiple pregnancy');
  if (hasEmergencySymptoms(form)) detected.add('Emergency symptoms reported');
  if (systolic != null && systolic >= 140) detected.add(`BP ${normalizedBloodPressure(form.bloodPressure)} mmHg`);
  if (Number(form.temperature) >= 38) detected.add(`Fever ${form.temperature} °C`);
  return Array.from(detected);
}

function riskSummaryItems(form: ManualRegistrationForm) {
  const age = maternalAge(form.dateOfBirth);
  const systolic = systolicPressure(form.bloodPressure);
  const items = new Set<string>();
  if (systolic != null && systolic >= 140) items.add('High Blood Pressure (Systolic >= 140)');
  if (age != null && (age < 20 || age > 35)) items.add('Maternal Age (High-Risk Maternal Age)');
  for (const factor of form.riskFactors) items.add(`${factor} ${factor === 'Preeclampsia' ? 'History' : 'Risk'} (Manual Check)`);
  if (form.pregnancyType === 'Multiple') items.add('Multiple Pregnancy (Auto Check)');
  if (hasEmergencySymptoms(form)) items.add('Emergency Symptoms (Auto Check)');
  if (Number(form.temperature) >= 38) items.add('Fever (Body Temperature >= 38 °C)');
  return Array.from(items);
}

function calculatedRiskLevel(form: ManualRegistrationForm): PregnancyRiskLevel {
  const risks = calculatedRisks(form);
  const systolic = systolicPressure(form.bloodPressure);
  if (hasEmergencySymptoms(form) || (systolic != null && systolic >= 140) || risks.length >= 3) return 'HIGH';
  if (risks.length > 0) return 'MEDIUM';
  return 'LOW';
}

function getPersonalValidationErrors(form: ManualRegistrationForm) {
  const errors: Partial<Record<RequiredPersonalField, string>> = {};
  if (!form.fullName.trim()) errors.fullName = requiredFieldErrors.fullName;
  if (!form.nik.trim()) errors.nik = requiredFieldErrors.nik;
  if (!form.dateOfBirth) errors.dateOfBirth = requiredFieldErrors.dateOfBirth;
  if (!form.phone.trim()) errors.phone = requiredFieldErrors.phone;
  if (!form.address.trim()) errors.address = requiredFieldErrors.address;
  if (!form.emergencyName.trim()) errors.emergencyName = requiredFieldErrors.emergencyName;
  if (!form.emergencyPhone.trim()) errors.emergencyPhone = requiredFieldErrors.emergencyPhone;
  return errors;
}

function getPregnancyValidationErrors(form: ManualRegistrationForm) {
  const errors: Partial<Record<RequiredPregnancyField, string>> = {};
  if (!form.ancVisit.trim()) errors.ancVisit = requiredFieldErrors.ancVisit;
  if (!form.visitReason.trim()) errors.visitReason = requiredFieldErrors.visitReason;
  if (!form.pregnancyType.trim()) errors.pregnancyType = requiredFieldErrors.pregnancyType;
  if (form.emergencySigns.length === 0) errors.emergencySigns = requiredFieldErrors.emergencySigns;
  return errors;
}

export function ManualEntryFlowContent() {
  const t = useTranslations('registration');
  const router = useRouter();
  const stages = manualStages;
  const [stage, setStage] = useState<ManualStage>('manual-personal');
  const [form, setForm] = useState<ManualRegistrationForm>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequiredField, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stageIndex = stages.indexOf(stage);
  const visualStep = stage === 'manual-personal' ? 1 : stage === 'pregnancy' ? 2 : 3;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [stage]);

  useEffect(() => {
    getCurrentUser().then((user) => {
      const responsibleDoctor = user?.displayName ?? user?.username;
      if (responsibleDoctor) setForm((current) => ({ ...current, responsibleDoctor }));
    }).catch(() => undefined);
  }, []);

  function goNext() {
    setError(null);
    if (stage === 'manual-personal') {
      const validationErrors = getPersonalValidationErrors(form);
      setFieldErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }
    if (stage === 'pregnancy') {
      const validationErrors = getPregnancyValidationErrors(form);
      setFieldErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) {
        return;
      }
    }
    setStage((current) => stages[Math.min(stages.indexOf(current) + 1, stages.length - 1)]);
  }

  function goBack() {
    if (stageIndex === 0) {
      return;
    }
    setStage(stages[stageIndex - 1]);
  }

  function updateField<K extends keyof ManualRegistrationForm>(key: K, value: ManualRegistrationForm[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'lmp' || key === 'edd') {
        return { ...next, gestationalAge: calculateGestationalAge(next.lmp, next.edd, key) };
      }
      return next;
    });
    if (key === 'address' || key === 'ancVisit' || key === 'dateOfBirth' || key === 'emergencyName' || key === 'emergencyPhone' || key === 'emergencySigns' || key === 'fullName' || key === 'nik' || key === 'phone' || key === 'pregnancyType' || key === 'visitReason') {
      setFieldErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  async function submitRegistration() {
    setError(null);
    if (!form.fullName.trim() || !form.nik.trim() || !form.dateOfBirth || !form.phone.trim() || !form.address.trim() || !form.emergencyName.trim() || !form.emergencyPhone.trim() || !form.gestationalAge.trim() || !form.ancVisit.trim() || !form.visitReason.trim() || !form.pregnancyType.trim() || form.emergencySigns.length === 0) {
      setError(t('requiredSubmit'));
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createPatient({
        fullName: form.fullName.trim(),
        nik: form.nik.trim(),
        dateOfBirth: form.dateOfBirth || undefined,
        phone: form.phone.trim(),
        address: form.address.trim(),
        bpjsNumber: form.bpjsNumber.trim() || undefined,
        emergencyName: form.emergencyName.trim(),
        emergencyPhone: form.emergencyPhone.trim(),
        bloodType: form.bloodType || undefined,
        allergy: normalizeCommaSeparated(form.allergy),
        chronicHistory: form.chronicDiseases.join(', ') || undefined,
        lmp: form.lmp || undefined,
        edd: form.edd || undefined,
        gestationalAge: toOptionalNumber(form.gestationalAge),
        ancVisit: form.ancVisit || undefined,
        gravida: toOptionalNumber(form.gravida),
        para: toOptionalNumber(form.para),
        abortus: toOptionalNumber(form.abortus),
        pregnancyType: form.pregnancyType || undefined,
        visitReason: form.visitReason || undefined,
        chiefComplaint: form.chiefComplaint.trim() || undefined,
        emergencySigns: form.emergencySigns.filter((sign) => sign !== noEmergencySignsLabel),
        vitalSigns: {
          bloodPressure: form.bloodPressure || null,
          weight: toOptionalNumber(form.weight) ?? null,
          height: toOptionalNumber(form.height) ?? null,
          bmi: bmi(form.weight, form.height),
          muac: toOptionalNumber(form.muac) ?? null,
          pulse: toOptionalNumber(form.pulse) ?? null,
          temperature: toOptionalNumber(form.temperature) ?? null,
          fetalHeartRate: toOptionalNumber(form.fetalHeartRate) ?? null,
        },
        riskFactors: calculatedRisks(form),
        routineMedication: form.routineMedication,
        clinicalNotes: form.clinicalNotes.trim() || undefined,
        responsibleDoctor: form.responsibleDoctor.trim() || undefined,
        priority: calculatedRiskLevel(form) === 'HIGH' ? 'HIGH' : calculatedRiskLevel(form) === 'MEDIUM' ? 'MEDIUM' : 'ROUTINE',
        riskLevel: calculatedRiskLevel(form),
      });
      await createQueue({ patientId: created.patient.id, pregnancyId: created.pregnancy.id, assignedDoctor: form.responsibleDoctor.trim() || undefined });
      router.push(routes.queue);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('registrationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer size="wide" className={styles.manualFlowPage}>
      {stage === 'manual-personal' ? <ManualInfoBanner /> : null}
      <WizardStepper currentStep={visualStep} />
      {error ? <p className={styles.formError}>{error}</p> : null}

      {stage === 'manual-personal' ? <ManualPersonalPanel fieldErrors={fieldErrors} form={form} onFieldChange={updateField} onNext={goNext} /> : null}
      {stage === 'pregnancy' ? <PregnancyPanel fieldErrors={fieldErrors} form={form} onBack={goBack} onFieldChange={updateField} onNext={goNext} /> : null}
      {stage === 'screening' ? <ScreeningPanel form={form} isSubmitting={isSubmitting} onFieldChange={updateField} onBack={goBack} onSubmit={submitRegistration} /> : null}
    </PageContainer>
  );
}

function ManualInfoBanner() {
  const t = useTranslations('registration');
  return (
    <div className={styles.manualInfoBanner}>
      <span className={styles.manualInfoCopy}>
        <AppIcon name="edit" width={18} height={18} />
        <strong>{t('manualInputInfo')}</strong>
      </span>
    </div>
  );
}

function WizardStepper({ currentStep }: { currentStep: number }) {
  const t = useTranslations('registration');
  const labels = [t('stepSelf'), t('stepPregnancy'), t('screeningRisk')];
  return (
    <nav className={styles.manualStepper} aria-label={t('registrationSteps')}>
      {labels.map((label, index) => {
        const stepNumber = index + 1;
        const done = stepNumber < currentStep;
        const active = stepNumber === currentStep;

        return (
          <div className={styles.manualStepWrap} key={label}>
            <div className={`${styles.manualStep} ${active ? styles.activeManualStep : ''} ${done ? styles.doneManualStep : ''}`}>
              <span>{done ? <AppIcon name="checkCircle" width={20} height={20} /> : stepNumber}</span>
              <strong>{label}</strong>
            </div>
            {index < stepLabels.length - 1 ? <i className={done ? styles.doneStepLine : active ? styles.activeStepLine : ''} /> : null}
          </div>
        );
      })}
    </nav>
  );
}

function ManualPersonalPanel({ fieldErrors, form, onFieldChange, onNext }: { fieldErrors: Partial<Record<RequiredField, string>>; form: ManualRegistrationForm; onFieldChange: <K extends keyof ManualRegistrationForm>(key: K, value: ManualRegistrationForm[K]) => void; onNext: () => void }) {
  const t = useTranslations('registration');
  return (
    <section className={styles.manualCard} aria-label={t('manualIdentityForm')}>
      <div className={styles.manualFormBody}>
        <FormSection icon="user" title={t('patientIdentity')}>
          <div className={styles.manualFormGrid}>
            <ManualField error={fieldErrors.fullName} label={t('patientFullNameRequired')} placeholder={t('patientExample')} wide value={form.fullName} onChange={(value) => onFieldChange('fullName', value)} />
            <ManualField error={fieldErrors.nik} label={t('nikRequired')} placeholder={t('nikPlaceholder')} value={form.nik} onChange={(value) => onFieldChange('nik', value)} />
            <ManualField error={fieldErrors.dateOfBirth} label={t('dateOfBirthRequired')} placeholder={t('selectDate')} type="date" value={form.dateOfBirth} onChange={(value) => onFieldChange('dateOfBirth', value)} />
            <ManualField error={fieldErrors.address} label={t('residentialAddressRequired')} placeholder={t('addressPlaceholder')} wide textarea value={form.address} onChange={(value) => onFieldChange('address', value)} />
            <ManualField error={fieldErrors.phone} label={t('phoneRequired')} placeholder="8123456789" prefix="+62" value={form.phone} onChange={(value) => onFieldChange('phone', value)} />
            <ManualField label={t('insuranceNumber')} placeholder={t('insurancePlaceholder')} value={form.bpjsNumber} onChange={(value) => onFieldChange('bpjsNumber', value)} />
          </div>
        </FormSection>

        <FormSection icon="asterisk" title={t('emergencyHistory')}>
          <div className={styles.manualFormGrid}>
            <ManualField error={fieldErrors.emergencyName} label={t('nextKinName')} placeholder={t('nextKinNamePlaceholder')} value={form.emergencyName} onChange={(value) => onFieldChange('emergencyName', value)} />
            <ManualField error={fieldErrors.emergencyPhone} label={t('nextKinPhone')} placeholder="+62..." value={form.emergencyPhone} onChange={(value) => onFieldChange('emergencyPhone', value)} />
            <ManualField label={t('bloodType')} placeholder={t('selectBloodType')} select options={bloodTypeOptions} value={form.bloodType} onChange={(value) => onFieldChange('bloodType', value)} />
            <ManualField label={t('allergies')} placeholder={t('commaPlaceholder')} value={form.allergy} onChange={(value) => onFieldChange('allergy', value)} />
            <div className={styles.wideManualField}>
              <span className={styles.manualLabel}>{t('chronicDisease')}</span>
              <div className={styles.checkboxRow}>
                {['Hypertension', 'Diabetes', 'Heart', 'Asthma', 'Others'].map((label) => (
                  <label key={label}><input type="checkbox" checked={form.chronicDiseases.includes(label)} onChange={() => onFieldChange('chronicDiseases', toggleItem(form.chronicDiseases, label))} /> {label}</label>
                ))}
              </div>
            </div>
          </div>
        </FormSection>
      </div>

      <ActionFooter backHref={routes.newPatient} nextLabel={t('continuePregnancy')} onNext={onNext} />
    </section>
  );
}

function PregnancyPanel({ fieldErrors, form, onBack, onFieldChange, onNext }: { fieldErrors: Partial<Record<RequiredField, string>>; form: ManualRegistrationForm; onBack: () => void; onFieldChange: <K extends keyof ManualRegistrationForm>(key: K, value: ManualRegistrationForm[K]) => void; onNext: () => void }) {
  const t = useTranslations('registration');
  const gestationalProgress = `${Math.min(Number(form.gestationalAge) || 0, 40) * 2.5}%`;

  function toggleEmergencySign(label: string) {
    const next = label === noEmergencySignsLabel
      ? [noEmergencySignsLabel]
      : toggleItem(form.emergencySigns.filter((sign) => sign !== noEmergencySignsLabel), label);
    onFieldChange('emergencySigns', next);
  }

  return (
    <section className={styles.manualCard} aria-label={t('pregnancyForm')}>
      <div className={styles.manualFormBody}>
        <FormSection icon="user" title={t('pregnancyIdentity')}>
          <div className={styles.manualFormGrid}>
            <ManualField label={t('lmp')} placeholder={t('selectDate')} type="date" value={form.lmp} onChange={(value) => onFieldChange('lmp', value)} />
            <ManualField label={t('edd')} placeholder={t('selectDate')} type="date" value={form.edd} onChange={(value) => onFieldChange('edd', value)} />
            <div className={styles.wideManualField}>
              <div className={styles.gestationHeader}><span>{t('currentGestAge')}</span><strong>{form.gestationalAge || '0'} {t('weeks')}</strong></div>
              <input className={styles.manualInput} placeholder={t('autoGestAge')} readOnly value={form.gestationalAge} />
              <div className={styles.gestationTrack}><span style={{ width: gestationalProgress }} /></div>
              <div className={styles.gestationScale}><small>{t('week1')}</small><small>{t('week20')}</small><small>{t('week40')}</small></div>
            </div>
            <ManualField error={fieldErrors.ancVisit} label={t('lastAncRequired')} placeholder={t('selectAnc')} select options={ancVisitOptions} value={form.ancVisit} onChange={(value) => onFieldChange('ancVisit', value)} />
          </div>
        </FormSection>

        <FormSection icon="clipboard" title={t('pregnancyHistory')}>
          <div className={styles.gpaGrid}>
            <ManualField label="G (Gravida)" placeholder="0" value={form.gravida} onChange={(value) => onFieldChange('gravida', value)} />
            <ManualField label="P (Para)" placeholder="0" value={form.para} onChange={(value) => onFieldChange('para', value)} />
            <ManualField label="A (Abortus)" placeholder="0" value={form.abortus} onChange={(value) => onFieldChange('abortus', value)} />
          </div>
        </FormSection>

        <FormSection icon="stethoscope" title={t('todayExamManual')}>
          <div className={styles.manualFormGrid}>
            <ManualField error={fieldErrors.visitReason} label={t('visitReasonRequired')} placeholder={t('selectReason')} select options={['ANC routine', 'Complaint', 'Follow-up', 'Emergency']} value={form.visitReason} onChange={(value) => onFieldChange('visitReason', value)} />
            <div className={`${styles.manualField} ${fieldErrors.pregnancyType ? styles.invalidManualField : ''}`}>
              <span className={styles.manualLabel}>{t('pregnancyTypeRequired')}</span>
              <div className={styles.radioRow}><label><input checked={form.pregnancyType === 'Single'} name="pregnancyType" type="radio" onChange={() => onFieldChange('pregnancyType', 'Single')} /> {t('single')}</label><label><input checked={form.pregnancyType === 'Multiple'} name="pregnancyType" type="radio" onChange={() => onFieldChange('pregnancyType', 'Multiple')} /> {t('multiple')}</label></div>
              {fieldErrors.pregnancyType ? <span className={styles.manualFieldError}>{fieldErrors.pregnancyType}</span> : null}
            </div>
            <ManualField label={t('chiefComplaint')} placeholder={t('chiefComplaintPlaceholder')} textarea wide value={form.chiefComplaint} onChange={(value) => onFieldChange('chiefComplaint', value)} />
            <div className={`${styles.wideManualField} ${fieldErrors.emergencySigns ? styles.invalidManualField : ''}`}>
              <span className={styles.manualLabel}>{t('emergencyChecklist')}</span>
              <div className={styles.flagGrid}>
                {pregnancyRiskFlags.map((label) => <label key={label}><input checked={form.emergencySigns.includes(label)} type="checkbox" onChange={() => toggleEmergencySign(label)} /> {label}</label>)}
                <label><input checked={form.emergencySigns.includes(noEmergencySignsLabel)} type="checkbox" onChange={() => toggleEmergencySign(noEmergencySignsLabel)} /> {t('noSymptomsAbove')}</label>
              </div>
              {fieldErrors.emergencySigns ? <span className={styles.manualFieldError}>{fieldErrors.emergencySigns}</span> : null}
            </div>
          </div>
        </FormSection>
      </div>

      <ActionFooter backLabel={t('backPersonal')} nextLabel={t('continueScreening')} onBack={onBack} onNext={onNext} />
    </section>
  );
}

function ScreeningPanel({ form, isSubmitting, onBack, onFieldChange, onSubmit }: { form: ManualRegistrationForm; isSubmitting: boolean; onBack: () => void; onFieldChange: <K extends keyof ManualRegistrationForm>(key: K, value: ManualRegistrationForm[K]) => void; onSubmit: () => void }) {
  const t = useTranslations('registration');
  const detectedRisks = autoDetectedRisks(form);
  const riskSummary = riskSummaryItems(form);
  const riskLevel = calculatedRiskLevel(form);
  const bmiValue = bmi(form.weight, form.height);
  const feverDetected = Number(form.temperature) >= 38;
  return (
    <section className={styles.manualCard} aria-label={t('screeningRiskForm')}>
      <div className={styles.screeningLayout}>
        <div className={styles.screeningMain}>
          <FormSection icon="activity" title={t('vitalSigns')}>
            <div className={`${styles.manualFormGrid} ${styles.vitalGrid}`}>
              <ManualField label={t('bloodPressureRequired')} placeholder="145 / 95" alert={Boolean(systolicPressure(form.bloodPressure) && Number(systolicPressure(form.bloodPressure)) >= 140)} value={form.bloodPressure} onChange={(value) => onFieldChange('bloodPressure', value)} />
              <ManualField label={t('weight')} placeholder="72" value={form.weight} onChange={(value) => onFieldChange('weight', value)} />
              <ManualField label={t('height')} placeholder="158" value={form.height} onChange={(value) => onFieldChange('height', value)} />
              <div className={styles.bmiCard}><strong>{t('bmiStatus')}</strong><b>{bmiValue ? bmiValue.toFixed(1) : '-'} kg/m2</b><small>{bmiStatus(bmiValue)}</small></div>
              <ManualField label={t('muac')} placeholder="cm" value={form.muac} onChange={(value) => onFieldChange('muac', value)} />
              <ManualField label={t('pulseRate')} placeholder="bpm" value={form.pulse} onChange={(value) => onFieldChange('pulse', value)} />
              <ManualField label={t('bodyTemperature')} placeholder="38.2" error={feverDetected ? t('feverDetected') : undefined} value={form.temperature} onChange={(value) => onFieldChange('temperature', value)} />
              <ManualField label={t('fetalHeartRate')} placeholder={t('optional')} value={form.fetalHeartRate} onChange={(value) => onFieldChange('fetalHeartRate', value)} />
            </div>
          </FormSection>

          <FormSection icon="alert" title={t('pregnancyRiskFactors')}>
            <div className={styles.factorGrid}>
              {screeningFactors.map((factor) => (
                <label className={styles.factorCard} key={factor.label}>
                  <span>{factor.label}</span>
                  <input type="checkbox" checked={form.riskFactors.includes(factor.label)} onChange={() => onFieldChange('riskFactors', toggleItem(form.riskFactors, factor.label))} />
                  {factor.tag ? <small>{factor.tag}</small> : null}
                </label>
              ))}
            </div>
            <div className={styles.detectedRisks}>
              <strong>{t('autoDetectedRisks')}</strong>
              <div>{detectedRisks.length ? detectedRisks.map((risk) => <span key={risk}>{risk}</span>) : <span>{t('noDetectedRisk')}</span>}</div>
            </div>
          </FormSection>
        </div>

        <aside className={styles.screeningAside}>
          <div className={styles.sideCard}>
            <label className={styles.manualLabel}>{t('responsibleDoctor')}</label>
            <input className={styles.manualInput} placeholder={t('responsibleClinician')} readOnly value={form.responsibleDoctor} />
          </div>
          <div className={styles.priorityCard}><small>{t('prioritySuggestion')}</small><strong>{t('priority', { level: riskLevel === 'HIGH' ? 'HIGH' : riskLevel === 'MEDIUM' ? 'MEDIUM' : 'ROUTINE' })}</strong><AppIcon name="alert" width={18} height={18} /></div>
          <div className={styles.riskSummaryCard}>
            <strong><AppIcon name="alert" width={16} height={16} /> {t('riskSummary')}</strong>
            <ol>{riskSummary.length ? riskSummary.map((risk) => <li key={risk}>{risk}</li>) : <li>{t('noRiskSelected')}</li>}</ol>
            <p>{riskLevel === 'HIGH' ? t('highRiskAdvice') : t('routineAdvice')}</p>
          </div>
          <div className={styles.sideCard}>
            <h3>{t('routineMedication')}</h3>
            {['Folic Acid', 'Iron Tablets', 'Anti-hypertensive', 'Anti-diabetes'].map((label) => <label className={styles.medCheck} key={label}><input type="checkbox" checked={form.routineMedication.includes(label)} onChange={() => onFieldChange('routineMedication', toggleItem(form.routineMedication, label))} /> {label}</label>)}
            <label className={styles.manualLabel}>{t('note')}<textarea placeholder={t('notePlaceholder')} value={form.clinicalNotes} onChange={(event) => onFieldChange('clinicalNotes', event.target.value)} /></label>
          </div>
        </aside>
      </div>

      <ActionFooter backLabel={t('backPregnancy')} nextLabel={isSubmitting ? t('submitting') : t('submit')} onBack={onBack} onNext={onSubmit} disabled={isSubmitting} />
    </section>
  );
}

type ManualFieldProps = {
  alert?: boolean;
  error?: string;
  label: string;
  onChange?: (value: string) => void;
  options?: readonly string[];
  placeholder: string;
  prefix?: string;
  select?: boolean;
  textarea?: boolean;
  type?: 'date' | 'text';
  value?: string;
  wide?: boolean;
};

function ManualField({ alert, error, label, onChange, options, placeholder, prefix, select, textarea, type = 'text', value, wide }: ManualFieldProps) {
  const selectProps = onChange
    ? { value: value ?? '', onChange: (event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value) }
    : { defaultValue: value ?? '' };

  return (
    <label className={`${styles.manualField} ${wide ? styles.wideManualField : ''} ${alert ? styles.alertManualField : ''} ${error ? styles.invalidManualField : ''}`}>
      <span className={styles.manualLabel}>{label}</span>
      {prefix ? (
        <span className={styles.prefixInput}><small>{prefix}</small><input placeholder={placeholder} type={type} value={value} onChange={(event) => onChange?.(event.target.value)} /></span>
      ) : textarea ? (
        <textarea placeholder={placeholder} value={value} onChange={(event) => onChange?.(event.target.value)} />
      ) : select ? (
        <span className={styles.selectInput}>
          <select {...selectProps}>
            <option value="">{placeholder}</option>
            {options?.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <AppIcon name="chevronDown" width={18} height={18} />
        </span>
      ) : (
        <input placeholder={placeholder} type={type} value={value} onChange={(event) => onChange?.(event.target.value)} />
      )}
      {error ? <span className={styles.manualFieldError}>{error}</span> : null}
    </label>
  );
}

function FormSection({ children, icon, title, tone = 'dark' }: { children: ReactNode; icon: 'activity' | 'alert' | 'asterisk' | 'briefcase' | 'clipboard' | 'stethoscope' | 'user' | 'users'; title: string; tone?: 'blue' | 'dark' }) {
  return (
    <section className={styles.manualSection}>
      <h2 className={tone === 'blue' ? styles.blueSectionTitle : ''}>
        {icon === 'asterisk' ? <span className={styles.asteriskIcon}>*</span> : <AppIcon name={icon} width={18} height={18} />}
        {title}
      </h2>
      {children}
    </section>
  );
}

function ActionFooter({ backHref, backLabel = 'Back', disabled, nextLabel, onBack, onNext }: { backHref?: string; backLabel?: string; disabled?: boolean; nextLabel: string; onBack?: () => void; onNext: () => void }) {
  return (
    <footer className={styles.manualFooter}>
      {backHref ? (
        <Link href={backHref} className={styles.manualBack}><AppIcon name="arrowLeft" width={18} height={18} />{backLabel}</Link>
      ) : (
        <button type="button" className={styles.manualBack} onClick={onBack}><AppIcon name="arrowLeft" width={18} height={18} />{backLabel}</button>
      )}
      <button type="button" className={styles.manualNext} disabled={disabled} onClick={onNext}>{nextLabel}<AppIcon name="arrowRight" width={18} height={18} /></button>
    </footer>
  );
}
