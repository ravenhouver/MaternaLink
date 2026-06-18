'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { AppIcon } from '@/components/ui/app-icon';
import { createPatient, createQueue, getCurrentUser, type KiaExtractionResult, type PregnancyRiskLevel } from '@/lib/api';
import { routes } from '@/lib/routes';
import { kiaExtractionStorageKey } from './kia-extraction-storage';
import styles from './patient-registration.module.css';

type ManualStage = 'manual-personal' | 'autofill-personal' | 'pregnancy' | 'screening';
type ManualEntryMode = 'manual' | 'kia';

const manualStages: ManualStage[] = ['manual-personal', 'pregnancy', 'screening'];
const kiaStages: ManualStage[] = ['autofill-personal', 'pregnancy', 'screening'];

const stepLabels = ['Personal Data', 'Pregnancy Data', 'Screening & Risk'];

const bloodTypeOptions = ['A', 'B', 'AB', 'O'] as const;

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

const kiaExtractedForm: ManualRegistrationForm = emptyForm;

function applyKiaExtraction(current: ManualRegistrationForm, extraction: KiaExtractionResult): ManualRegistrationForm {
  return {
    ...current,
    address: extraction.address ?? current.address,
    abortus: extraction.abortus != null ? String(extraction.abortus) : current.abortus,
    ancVisit: extraction.ancVisit ?? current.ancVisit,
    bloodType: extraction.bloodType ?? current.bloodType,
    dateOfBirth: extraction.dateOfBirth ?? current.dateOfBirth,
    edd: extraction.edd ?? current.edd,
    fullName: extraction.fullName ?? current.fullName,
    gestationalAge: extraction.gestationalAge != null ? String(extraction.gestationalAge) : current.gestationalAge,
    gravida: extraction.gravida != null ? String(extraction.gravida) : current.gravida,
    lmp: extraction.lmp ?? current.lmp,
    nik: extraction.nik ?? current.nik,
    para: extraction.para != null ? String(extraction.para) : current.para,
    phone: extraction.phone ?? current.phone,
    riskFactors: extraction.riskFactors?.length ? extraction.riskFactors : current.riskFactors,
  };
}

function toOptionalNumber(value: string) {
  return value.trim() ? Number(value) : undefined;
}

function formatDisplayDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
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

function bmi(weight: string, height: string) {
  const kg = Number(weight);
  const cm = Number(height);
  if (!kg || !cm) return null;
  return kg / ((cm / 100) ** 2);
}

function calculatedRisks(form: ManualRegistrationForm) {
  const age = maternalAge(form.dateOfBirth);
  const systolic = systolicPressure(form.bloodPressure);
  const detected = new Set<string>(form.riskFactors);
  if (age != null && (age < 20 || age > 35)) detected.add(`Maternal age ${age}`);
  if (systolic != null && systolic >= 140) detected.add(`High blood pressure ${form.bloodPressure}`);
  if (form.pregnancyType === 'Multiple') detected.add('Multiple pregnancy');
  for (const sign of form.emergencySigns) detected.add(sign);
  return Array.from(detected);
}

function calculatedRiskLevel(form: ManualRegistrationForm): PregnancyRiskLevel {
  const risks = calculatedRisks(form);
  const systolic = systolicPressure(form.bloodPressure);
  if (form.emergencySigns.length > 0 || (systolic != null && systolic >= 140) || risks.length >= 3) return 'HIGH';
  if (risks.length > 0) return 'MEDIUM';
  return 'LOW';
}

export function ManualEntryFlowContent({ mode = 'manual' }: { mode?: ManualEntryMode }) {
  const router = useRouter();
  const stages = mode === 'kia' ? kiaStages : manualStages;
  const [stage, setStage] = useState<ManualStage>(mode === 'kia' ? 'autofill-personal' : 'manual-personal');
  const [form, setForm] = useState<ManualRegistrationForm>(mode === 'kia' ? kiaExtractedForm : emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const stageIndex = stages.indexOf(stage);
  const visualStep = stage === 'manual-personal' || stage === 'autofill-personal' ? 1 : stage === 'pregnancy' ? 2 : 3;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [stage]);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user?.displayName) updateField('responsibleDoctor', user.displayName);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (mode !== 'kia') return;
    const stored = window.sessionStorage.getItem(kiaExtractionStorageKey);
    if (!stored) return;
    try {
      setForm((current) => applyKiaExtraction(current, JSON.parse(stored) as KiaExtractionResult));
    } catch {
      window.sessionStorage.removeItem(kiaExtractionStorageKey);
    }
  }, [mode]);

  function goNext() {
    setError(null);
    if (stage === 'manual-personal' && (!form.fullName.trim() || !form.nik.trim() || !form.dateOfBirth || !form.phone.trim() || !form.address.trim())) {
      setError('Lengkapi nama, NIK, tanggal lahir, nomor HP, dan alamat pasien.');
      return;
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
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitRegistration() {
    setError(null);
    if (!form.fullName.trim() || !form.nik.trim() || !form.dateOfBirth || !form.phone.trim() || !form.address.trim() || !form.gestationalAge.trim() || !form.ancVisit.trim()) {
      setError('Lengkapi semua field wajib sebelum submit.');
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
        emergencyName: form.emergencyName.trim() || undefined,
        emergencyPhone: form.emergencyPhone.trim() || undefined,
        bloodType: form.bloodType || undefined,
        allergy: form.allergy.trim() || undefined,
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
        emergencySigns: form.emergencySigns,
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
      setError(submitError instanceof Error ? submitError.message : 'Registrasi gagal');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer size="wide" className={styles.manualFlowPage}>
      {stage === 'manual-personal' ? <ManualInfoBanner /> : null}
      <WizardStepper currentStep={visualStep} />
      {error ? <p className={styles.formError}>{error}</p> : null}

      {stage === 'manual-personal' ? <ManualPersonalPanel form={form} onFieldChange={updateField} onNext={goNext} /> : null}
      {stage === 'autofill-personal' ? <AutofillPersonalPanel form={form} onFieldChange={updateField} onNext={goNext} /> : null}
      {stage === 'pregnancy' ? <PregnancyPanel form={form} onBack={goBack} onFieldChange={updateField} onNext={goNext} /> : null}
      {stage === 'screening' ? <ScreeningPanel form={form} isSubmitting={isSubmitting} onFieldChange={updateField} onBack={goBack} onSubmit={submitRegistration} /> : null}
    </PageContainer>
  );
}

function ManualInfoBanner() {
  return (
    <div className={styles.manualInfoBanner}>
      <span className={styles.manualInfoCopy}>
        <AppIcon name="edit" width={18} height={18} />
        <strong>Manual input — fill all fields below</strong>
      </span>
      <Link href={routes.kiaUpload}>Use KIA Upload instead?</Link>
    </div>
  );
}

function WizardStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav className={styles.manualStepper} aria-label="Registration steps">
      {stepLabels.map((label, index) => {
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

function ManualPersonalPanel({ form, onFieldChange, onNext }: { form: ManualRegistrationForm; onFieldChange: <K extends keyof ManualRegistrationForm>(key: K, value: ManualRegistrationForm[K]) => void; onNext: () => void }) {
  return (
    <section className={styles.manualCard} aria-label="Manual patient identity form">
      <div className={styles.manualFormBody}>
        <FormSection icon="user" title="PATIENT IDENTITY">
          <div className={styles.manualFormGrid}>
            <ManualField label="Patient Full Name *" placeholder="Example: Siti Aminah" wide value={form.fullName} onChange={(value) => onFieldChange('fullName', value)} />
            <ManualField label="NIK *" placeholder="16 digit NIK" value={form.nik} onChange={(value) => onFieldChange('nik', value)} />
            <ManualField label="Date of Birth *" placeholder="Select date" type="date" value={form.dateOfBirth} onChange={(value) => onFieldChange('dateOfBirth', value)} />
            <ManualField label="Residential Address *" placeholder="Street, RT/RW, Sub-district, District" wide textarea value={form.address} onChange={(value) => onFieldChange('address', value)} />
            <ManualField label="Phone Number (WhatsApp) *" placeholder="8123456789" prefix="+62" value={form.phone} onChange={(value) => onFieldChange('phone', value)} />
            <ManualField label="BPJS / Insurance Number (Optional)" placeholder="Enter number if available" value={form.bpjsNumber} onChange={(value) => onFieldChange('bpjsNumber', value)} />
          </div>
        </FormSection>

        <FormSection icon="asterisk" title="EMERGENCY CONTACT & BASIC HISTORY">
          <div className={styles.manualFormGrid}>
            <ManualField label="Next of Kin Name *" placeholder="Husband/parent name" value={form.emergencyName} onChange={(value) => onFieldChange('emergencyName', value)} />
            <ManualField label="Next of Kin Phone No. *" placeholder="+62..." value={form.emergencyPhone} onChange={(value) => onFieldChange('emergencyPhone', value)} />
            <ManualField label="Blood Type" placeholder="Select Blood Type" select options={bloodTypeOptions} value={form.bloodType} onChange={(value) => onFieldChange('bloodType', value)} />
            <ManualField label="Drug / Food Allergies" placeholder="Use commas to separate" value={form.allergy} onChange={(value) => onFieldChange('allergy', value)} />
            <div className={styles.wideManualField}>
              <span className={styles.manualLabel}>Chronic Disease History</span>
              <div className={styles.checkboxRow}>
                {['Hypertension', 'Diabetes', 'Heart', 'Asthma', 'Others'].map((label) => (
                  <label key={label}><input type="checkbox" checked={form.chronicDiseases.includes(label)} onChange={() => onFieldChange('chronicDiseases', toggleItem(form.chronicDiseases, label))} /> {label}</label>
                ))}
              </div>
            </div>
          </div>
        </FormSection>
      </div>

      <ActionFooter backHref={routes.newPatient} nextLabel="Continue to Pregnancy Data" onNext={onNext} />
    </section>
  );
}

function AutofillPersonalPanel({ form, onFieldChange, onNext }: { form: ManualRegistrationForm; onFieldChange: <K extends keyof ManualRegistrationForm>(key: K, value: ManualRegistrationForm[K]) => void; onNext: () => void }) {
  return (
    <section className={styles.manualCard} aria-label="Auto-filled patient identity review">
      <div className={styles.autoBanner}>
        <span><AppIcon name="checkCircle" width={20} height={20} /></span>
        <div>
          <strong>Data from KIA Book has been auto-filled</strong>
          <p>Review and correct if anything is not as expected.</p>
        </div>
        <Link href={routes.kiaUpload}>Change KIA photo</Link>
      </div>

      <div className={styles.manualFormBody}>
        <FormSection icon="user" title="Main Identity" tone="blue">
          <div className={styles.manualFormGrid}>
            <ManualField label="Full Name *" placeholder="Patient name" value={form.fullName} onChange={(value) => onFieldChange('fullName', value)} />
            <ManualField label="NIK *" placeholder="16 digit NIK" value={form.nik} onChange={(value) => onFieldChange('nik', value)} />
            <ManualField label="Date of Birth *" placeholder="Select date" type="date" value={form.dateOfBirth} onChange={(value) => onFieldChange('dateOfBirth', value)} />
            <ManualField label="Phone Number *" placeholder="Example: 08123456789" value={form.phone} onChange={(value) => onFieldChange('phone', value)} />
            <ManualField label="Residential Address *" placeholder="Enter complete address based on current residence..." wide textarea value={form.address} onChange={(value) => onFieldChange('address', value)} />
            <ManualField label="BPJS Number (Optional)" placeholder="13-digit BPJS card number" value={form.bpjsNumber} onChange={(value) => onFieldChange('bpjsNumber', value)} />
          </div>
        </FormSection>

        <FormSection icon="users" title="Next of Kin" tone="blue">
          <div className={styles.manualFormGrid}>
            <ManualField label="Next of Kin Name *" placeholder="Husband or guardian name" value={form.emergencyName} onChange={(value) => onFieldChange('emergencyName', value)} />
            <ManualField label="Next of Kin Phone No. *" placeholder="Example: 08123456789" value={form.emergencyPhone} onChange={(value) => onFieldChange('emergencyPhone', value)} />
          </div>
        </FormSection>

        <FormSection icon="briefcase" title="Medical Information" tone="blue">
          <div className={`${styles.manualFormGrid} ${styles.threeColumnGrid}`}>
            <ManualField label="Blood Type" placeholder="Select Type" select options={bloodTypeOptions} value={form.bloodType} onChange={(value) => onFieldChange('bloodType', value)} />
            <ManualField label="Allergy" placeholder="Food/medicine allergy" value={form.allergy} onChange={(value) => onFieldChange('allergy', value)} />
            <ManualField label="Chronic History" placeholder="Asthma, Hypertension, etc." value={form.chronicDiseases.join(', ')} onChange={(value) => onFieldChange('chronicDiseases', value.split(',').map((item) => item.trim()).filter(Boolean))} />
          </div>
        </FormSection>
      </div>

      <ActionFooter backHref={routes.kiaUpload} backLabel="Back" nextLabel="Continue to Pregnancy Data" onNext={onNext} />
    </section>
  );
}

function PregnancyPanel({ form, onBack, onFieldChange, onNext }: { form: ManualRegistrationForm; onBack: () => void; onFieldChange: <K extends keyof ManualRegistrationForm>(key: K, value: ManualRegistrationForm[K]) => void; onNext: () => void }) {
  return (
    <section className={styles.manualCard} aria-label="Pregnancy data form">
      <div className={styles.autoBanner}>
        <span><AppIcon name="checkCircle" width={20} height={20} /></span>
        <strong>Data from the MCH Handbook has been auto-filled by MaternaLink AI.</strong>
        <Link href={routes.kiaUpload}>Change Handbook Photo</Link>
      </div>

      <div className={styles.manualFormBody}>
        <FormSection icon="user" title="I. PREGNANCY IDENTITY (AUTO-FILLED)">
          <div className={styles.manualFormGrid}>
            <ManualField label="LMP (Last Menstrual Period)" placeholder="Select date" type="date" value={form.lmp} onChange={(value) => onFieldChange('lmp', value)} />
            <ManualField label="EDD (Estimated Due Date)" placeholder="Select date" type="date" value={form.edd} onChange={(value) => onFieldChange('edd', value)} />
            <div className={styles.wideManualField}>
              <div className={styles.gestationHeader}><span>Current Gestational Age</span><strong>{form.gestationalAge || '0'} Weeks</strong></div>
              <input className={styles.manualInput} placeholder="Gestational age in weeks" value={form.gestationalAge} onChange={(event) => onFieldChange('gestationalAge', event.target.value)} />
              <div className={styles.gestationTrack}><span /></div>
              <div className={styles.gestationScale}><small>1 Week</small><small>20 Weeks</small><small>40 Weeks</small></div>
            </div>
            <ManualField label="Last ANC Visit" placeholder="K1/K2/K3/K4/K5" value={form.ancVisit} onChange={(value) => onFieldChange('ancVisit', value)} />
          </div>
        </FormSection>

        <FormSection icon="clipboard" title="II. PREGNANCY HISTORY">
          <div className={styles.gpaGrid}>
            <ManualField label="G (Gravida)" placeholder="0" value={form.gravida} onChange={(value) => onFieldChange('gravida', value)} />
            <ManualField label="P (Para)" placeholder="0" value={form.para} onChange={(value) => onFieldChange('para', value)} />
            <ManualField label="A (Abortus)" placeholder="0" value={form.abortus} onChange={(value) => onFieldChange('abortus', value)} />
          </div>
        </FormSection>

        <FormSection icon="stethoscope" title="III. TODAY\'S EXAMINATION (MANUAL INPUT)">
          <div className={styles.manualFormGrid}>
            <ManualField label="Reason for Today’s Visit *" placeholder="Select reason..." select options={['ANC routine', 'Complaint', 'Follow-up', 'Emergency']} value={form.visitReason} onChange={(value) => onFieldChange('visitReason', value)} />
            <div className={styles.manualField}>
              <span className={styles.manualLabel}>Pregnancy Type *</span>
              <div className={styles.radioRow}><label><input checked={form.pregnancyType === 'Single'} name="pregnancyType" type="radio" onChange={() => onFieldChange('pregnancyType', 'Single')} /> Single</label><label><input checked={form.pregnancyType === 'Multiple'} name="pregnancyType" type="radio" onChange={() => onFieldChange('pregnancyType', 'Multiple')} /> Multiple</label></div>
            </div>
            <ManualField label="Chief Complaint" placeholder="Describe any complaints if any..." textarea wide value={form.chiefComplaint} onChange={(value) => onFieldChange('chiefComplaint', value)} />
            <div className={styles.wideManualField}>
              <span className={styles.manualLabel}>Emergency Signs Checklist *</span>
              <div className={styles.flagGrid}>
                {pregnancyRiskFlags.map((label) => <label key={label}><input checked={form.emergencySigns.includes(label)} type="checkbox" onChange={() => onFieldChange('emergencySigns', toggleItem(form.emergencySigns, label))} /> {label}</label>)}
                <label><input checked={form.emergencySigns.length === 0} type="checkbox" onChange={() => onFieldChange('emergencySigns', [])} /> No symptoms above</label>
              </div>
            </div>
          </div>
        </FormSection>
      </div>

      <ActionFooter backLabel="Back to Personal Data" nextLabel="Continue to Screening & Risk" onBack={onBack} onNext={onNext} />
    </section>
  );
}

function ScreeningPanel({ form, isSubmitting, onBack, onFieldChange, onSubmit }: { form: ManualRegistrationForm; isSubmitting: boolean; onBack: () => void; onFieldChange: <K extends keyof ManualRegistrationForm>(key: K, value: ManualRegistrationForm[K]) => void; onSubmit: () => void }) {
  const detectedRisks = calculatedRisks(form);
  const riskLevel = calculatedRiskLevel(form);
  const bmiValue = bmi(form.weight, form.height);
  return (
    <section className={styles.manualCard} aria-label="Screening and risk form">
      <div className={styles.autoBanner}>
        <span><AppIcon name="checkCircle" width={20} height={20} /></span>
        <strong>Data from the MCH Handbook has been auto-filled by MaternaLink AI.</strong>
        <Link href={routes.kiaUpload}>Change Handbook Photo</Link>
      </div>

      <div className={styles.screeningLayout}>
        <div className={styles.screeningMain}>
          <FormSection icon="activity" title="Vital Signs">
            <div className={`${styles.manualFormGrid} ${styles.vitalGrid}`}>
              <ManualField label="Blood Pressure (mmHg) *" placeholder="145 / 95" alert={Boolean(systolicPressure(form.bloodPressure) && Number(systolicPressure(form.bloodPressure)) >= 140)} value={form.bloodPressure} onChange={(value) => onFieldChange('bloodPressure', value)} />
              <ManualField label="Weight (kg)" placeholder="72" value={form.weight} onChange={(value) => onFieldChange('weight', value)} />
              <ManualField label="Height (cm)" placeholder="158" value={form.height} onChange={(value) => onFieldChange('height', value)} />
              <div className={styles.bmiCard}><strong>BMI Status</strong><b>{bmiValue ? bmiValue.toFixed(1) : '-'} kg/m2</b><small>{bmiValue == null ? 'FILL WEIGHT & HEIGHT' : bmiValue >= 30 ? 'OBESITY' : bmiValue >= 25 ? 'OVERWEIGHT' : 'NORMAL'}</small></div>
              <ManualField label="MUAC (cm)" placeholder="cm" value={form.muac} onChange={(value) => onFieldChange('muac', value)} />
              <ManualField label="Pulse Rate (bpm)" placeholder="bpm" value={form.pulse} onChange={(value) => onFieldChange('pulse', value)} />
              <ManualField label="Body Temperature (C)" placeholder="38.2" alert={Number(form.temperature) >= 38} value={form.temperature} onChange={(value) => onFieldChange('temperature', value)} />
              <ManualField label="Fetal Heart Rate (bpm)" placeholder="Optional" value={form.fetalHeartRate} onChange={(value) => onFieldChange('fetalHeartRate', value)} />
            </div>
          </FormSection>

          <FormSection icon="alert" title="Pregnancy Risk Factors">
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
              <strong>AUTO-DETECTED RISKS</strong>
              <div>{detectedRisks.length ? detectedRisks.map((risk) => <span key={risk}>{risk}</span>) : <span>No detected risk yet</span>}</div>
            </div>
          </FormSection>
        </div>

        <aside className={styles.screeningAside}>
          <div className={styles.sideCard}>
            <label className={styles.manualLabel}>Responsible Doctor</label>
            <input className={styles.manualInput} placeholder="Responsible clinician" value={form.responsibleDoctor} onChange={(event) => onFieldChange('responsibleDoctor', event.target.value)} />
          </div>
          <div className={styles.sideCard}>
            <label className={styles.manualLabel}>Risk Level</label>
            <select className={styles.manualInput} value={riskLevel} onChange={(event) => onFieldChange('riskLevel', event.target.value as PregnancyRiskLevel)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className={styles.priorityCard}><small>PRIORITY SUGGESTION</small><strong>PRIORITY: {riskLevel === 'HIGH' ? 'HIGH' : riskLevel === 'MEDIUM' ? 'MEDIUM' : 'ROUTINE'}</strong><AppIcon name="alert" width={18} height={18} /></div>
          <div className={styles.riskSummaryCard}>
            <strong><AppIcon name="alert" width={16} height={16} /> RISK SUMMARY</strong>
            <ol>{detectedRisks.length ? detectedRisks.map((risk) => <li key={risk}>{risk}</li>) : <li>No risk factor selected or detected.</li>}</ol>
            <p>{riskLevel === 'HIGH' ? 'System recommends close observation or referral if condition worsens within 24 hours.' : 'System recommends routine ANC monitoring based on current data.'}</p>
          </div>
          <div className={styles.sideCard}>
            <h3>Routine Medication</h3>
            {['Folic Acid', 'Iron Tablets', 'Anti-hypertensive', 'Anti-diabetes'].map((label) => <label className={styles.medCheck} key={label}><input type="checkbox" checked={form.routineMedication.includes(label)} onChange={() => onFieldChange('routineMedication', toggleItem(form.routineMedication, label))} /> {label}</label>)}
            <label className={styles.manualLabel}>Additional Notes<textarea placeholder="Write down any complaints or specific instructions..." value={form.clinicalNotes} onChange={(event) => onFieldChange('clinicalNotes', event.target.value)} /></label>
          </div>
        </aside>
      </div>

      <ActionFooter backLabel="Back to Pregnancy Data" nextLabel={isSubmitting ? 'Submitting...' : 'Submit'} onBack={onBack} onNext={onSubmit} disabled={isSubmitting} />
    </section>
  );
}

type ManualFieldProps = {
  alert?: boolean;
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

function ManualField({ alert, label, onChange, options, placeholder, prefix, select, textarea, type = 'text', value, wide }: ManualFieldProps) {
  const selectProps = onChange
    ? { value: value ?? '', onChange: (event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value) }
    : { defaultValue: value ?? '' };

  return (
    <label className={`${styles.manualField} ${wide ? styles.wideManualField : ''} ${alert ? styles.alertManualField : ''}`}>
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
    </label>
  );
}

type AutoFieldProps = {
  fromKia?: boolean;
  hint?: string;
  label: string;
  textarea?: boolean;
  value: string;
  wide?: boolean;
};

function AutoField({ fromKia, hint, label, textarea, value, wide }: AutoFieldProps) {
  return (
    <label className={`${styles.manualField} ${wide ? styles.wideManualField : ''} ${fromKia ? styles.fromKiaField : ''}`}>
      <span className={styles.manualLabel}>{label}</span>
      <span className={textarea ? styles.autoTextarea : styles.autoInput}>{value}{fromKia ? <small>FROM KIA</small> : null}</span>
      {hint ? <em>{hint}</em> : null}
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
