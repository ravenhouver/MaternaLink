'use client';

import { useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import styles from './patients.module.css';

type PatientRow = {
  name: string;
  id: string;
  gestationalAge: string;
  dueDate: string;
  dueHint: string;
  ancDone: number;
  ancTotal: number;
  urgent?: boolean;
};

const patients: PatientRow[] = [
  { name: 'Maria', id: 'ML-2024-001', gestationalAge: '32 weeks', dueDate: '12 Feb 2024', dueHint: '(7 days left)', ancDone: 4, ancTotal: 4, urgent: true },
  { name: 'Anisa', id: 'ML-2024-002', gestationalAge: '28 weeks', dueDate: '5 Mar 2024', dueHint: '(29 days left)', ancDone: 3, ancTotal: 4 },
  { name: 'Dewi', id: 'ML-2024-003', gestationalAge: '39 weeks', dueDate: 'Tomorrow!', dueHint: '9 Feb 2024', ancDone: 4, ancTotal: 4, urgent: true },
];

const reasonOptions = [
  { label: 'ANC Checkup', icon: 'stethoscope' as const, active: true },
  { label: 'Complaint', icon: 'briefcase' as const },
  { label: 'Referral', icon: 'clipboard' as const },
  { label: 'Emergency', icon: 'alert' as const, danger: true },
];

const riskFactors = [
  { label: 'Gestational Hypertension', checked: true },
  { label: 'Mild Anemia (Hb < 11)', checked: false },
  { label: 'History of Preeclampsia', checked: true },
  { label: 'Diabetes Mellitus', checked: false },
];

const medications = [
  { label: 'Folic Acid', checked: true },
  { label: 'Iron Supplement (TTD)', checked: true },
  { label: 'Calcium', checked: false },
  { label: 'Low Dose Aspirin', checked: false },
];

export function PatientsPageContent() {
  const [queuedPatient, setQueuedPatient] = useState<PatientRow | null>(null);

  return (
    <PageContainer size="wide" className={styles.page}>
      <section className={styles.headerCard}>
        <div>
          <div className={styles.titleRow}>
            <h1>Patient List</h1>
            <span>124 registered patients</span>
          </div>
          <p>Manage maternal data, monitor risk status, and pregnancy schedules in a unified view.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" aria-label="Notifications"><AppIcon name="bell" width={20} height={20} /></button>
          <button type="button" aria-label="Help"><AppIcon name="info" width={20} height={20} /></button>
        </div>
      </section>

      <section className={styles.toolbar} aria-label="Search and filter patients">
        <label className={styles.searchBox}>
          <AppIcon name="search" width={18} height={18} />
          <input type="search" placeholder="Search patient..." />
        </label>
        <button type="button" className={styles.filterButton}>
          <AppIcon name="filter" width={18} height={18} />
          Filter
          <AppIcon name="chevronDown" width={16} height={16} />
        </button>
      </section>

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
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td data-label="Name">
                    <strong className={styles.patientName}>{patient.name}</strong>
                    <span className={styles.patientId}>ID: {patient.id}</span>
                  </td>
                  <td data-label="Gestational Age">{patient.gestationalAge}</td>
                  <td data-label="Due Date">
                    <strong className={patient.urgent ? styles.urgentDate : undefined}>{patient.dueDate}</strong>
                    <span className={patient.urgent ? styles.urgentHint : styles.dueHint}>{patient.dueHint}</span>
                  </td>
                  <td data-label="ANC Visit">
                    <span className={styles.ancDots} aria-label={`${patient.ancDone} of ${patient.ancTotal} ANC visits`}>
                      {Array.from({ length: patient.ancTotal }).map((_, index) => (
                        <i className={index < patient.ancDone ? styles.ancDone : styles.ancPending} key={index} />
                      ))}
                    </span>
                  </td>
                  <td data-label="Action">
                    <div className={styles.actionGroup}>
                      <button type="button" className={styles.detailButton}>View Details</button>
                      <button type="button" className={styles.queueButton} onClick={() => setQueuedPatient(patient)}><AppIcon name="plus" width={18} height={18} />Queue</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className={styles.pagination}>
          <p>Showing 1-3 of 124 patients</p>
          <div className={styles.paginationControls}>
            <button type="button" aria-label="Previous page"><AppIcon name="chevronLeft" width={18} height={18} /></button>
            <button type="button" aria-current="page">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button" aria-label="Next page"><AppIcon name="chevronRight" width={18} height={18} /></button>
          </div>
        </footer>
      </section>

      {queuedPatient ? <QueueScreeningModal patient={queuedPatient} onClose={() => setQueuedPatient(null)} /> : null}
    </PageContainer>
  );
}

function QueueScreeningModal({ patient, onClose }: { patient: PatientRow; onClose: () => void }) {
  const initial = patient.name.charAt(0).toUpperCase();

  return (
    <div className={styles.modalOverlay} role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="queue-screening-title"
        aria-modal="true"
        className={styles.queueModal}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <div>
            <h2 id="queue-screening-title">Pre-Queue Screening</h2>
            <p>Complete today's visit data before the patient enters the queue.</p>
          </div>
          <button type="button" aria-label="Close pre-queue screening" className={styles.modalClose} onClick={onClose}>
            <AppIcon name="x" width={20} height={20} />
          </button>
        </header>

        <div className={styles.patientStrip}>
          <span className={styles.patientAvatar}>{initial}</span>
          <div className={styles.patientSummaryText}>
            <div className={styles.patientSummaryTitle}>
              <strong>Ibu {patient.name}</strong>
              <span>ID: {patient.id}</span>
            </div>
            <div className={styles.patientBadges}>
              <span><AppIcon name="user" width={13} height={13} />{patient.gestationalAge}</span>
              <span><AppIcon name="calendar" width={13} height={13} />{patient.dueDate}</span>
              <span><AppIcon name="clock" width={13} height={13} />Last: K3</span>
              {patient.urgent ? <b>High Risk</b> : null}
            </div>
          </div>
        </div>

        <div className={styles.modalBody}>
          <ModalSection number="I." title="Today's Visit">
            <label className={styles.fieldLabel}>Reason for Visit</label>
            <div className={styles.reasonGrid}>
              {reasonOptions.map((option) => (
                <button
                  className={`${styles.reasonCard} ${option.active ? styles.reasonActive : ''} ${option.danger ? styles.reasonDanger : ''}`}
                  key={option.label}
                  type="button"
                >
                  {option.active ? <AppIcon className={styles.reasonCheck} name="checkCircle" width={16} height={16} /> : null}
                  <AppIcon name={option.icon} width={24} height={24} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
            <div className={styles.twoColumnFields}>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>ANC Visit Type</span>
                <select defaultValue="ANC K4 (Trimester 3)">
                  <option>ANC K4 (Trimester 3)</option>
                  <option>ANC K3 (Trimester 2)</option>
                </select>
              </label>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Complaint Notes (Optional)</span>
                <input placeholder="Write patient's main complaint if any..." type="text" />
              </label>
            </div>
          </ModalSection>

          <ModalSection number="II." title="Vital Signs">
            <div className={styles.vitalGrid}>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Blood Pressure (mmHg)</span>
                <div className={styles.bpFields}>
                  <input aria-label="Systolic blood pressure" placeholder="Sys" />
                  <span>/</span>
                  <input aria-label="Diastolic blood pressure" placeholder="Dia" />
                </div>
                <small>Previous visit: 130/85</small>
              </div>
              <InputMetric label="Weight (kg)" value="68.5" helper="Previous visit: 66.2 kg" />
              <InputMetric label="Height (cm)" value="158" helper="BMI: 27.4 (Overweight)" strongHelper />
              <InputMetric label="MUAC (cm)" value="24.5" helper="Normal (>23.5cm)" goodHelper />
              <InputMetric label="Fetal Heart Rate (bpm)" value="142" helper="Normal: 120-160 bpm" />
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Temperature & Pulse</span>
                <div className={styles.tempFields}>
                  <input aria-label="Temperature" defaultValue="36.5°C" />
                  <input aria-label="Pulse" defaultValue="88bpm" />
                </div>
              </div>
            </div>
          </ModalSection>

          <ModalSection number="III." title="Risk & Medication Confirmation">
            <div className={styles.confirmationGrid}>
              <Checklist title="Detected Risk Factors" items={riskFactors} tone="risk" />
              <Checklist title="Routine Medication" items={medications} tone="medication" />
            </div>
          </ModalSection>

          <ModalSection number="IV." title="Assessment & Placement">
            <div className={styles.assessmentBox}>
              <div className={styles.assessmentMain}>
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Attending Physician (DPJP)</span>
                  <select defaultValue="dr. Ratna Wulandari, Sp.OG">
                    <option>dr. Ratna Wulandari, Sp.OG</option>
                    <option>dr. Dewi Lestari, Sp.OG</option>
                  </select>
                </label>
                <p className={styles.riskNote}>Patient identified as <strong>High Risk</strong> due to history of Preeclampsia and late trimester gestational age. Recommended for <u>Priority Queue</u>.</p>
              </div>
              <aside className={styles.priorityCard}>
                <span>Queue Priority</span>
                <strong>High</strong>
                <small><AppIcon name="zap" width={13} height={13} />Estimated: 12 Minutes</small>
              </aside>
            </div>
          </ModalSection>
        </div>

        <footer className={styles.modalFooter}>
          <p><AppIcon name="info" width={17} height={17} />Visit data will be saved to the patient's examination history.</p>
          <div className={styles.modalFooterActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Cancel</button>
            <button type="button" className={styles.enterQueueButton} onClick={onClose}><AppIcon name="plus" width={16} height={16} />Enter into Queue</button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function ModalSection({ children, number, title }: { children: React.ReactNode; number: string; title: string }) {
  return (
    <section className={styles.modalSection}>
      <h3><span />{number} {title}</h3>
      {children}
    </section>
  );
}

function InputMetric({ goodHelper, helper, label, strongHelper, value }: { goodHelper?: boolean; helper: string; label: string; strongHelper?: boolean; value: string }) {
  return (
    <label className={styles.fieldGroup}>
      <span className={styles.fieldLabel}>{label}</span>
      <input defaultValue={value} />
      <small className={`${goodHelper ? styles.goodHelper : ''} ${strongHelper ? styles.strongHelper : ''}`}>{helper}</small>
    </label>
  );
}

function Checklist({ items, title, tone }: { items: { label: string; checked: boolean }[]; title: string; tone: 'risk' | 'medication' }) {
  return (
    <div className={styles.checklistGroup}>
      <span className={styles.fieldLabel}>{title}</span>
      <div className={styles.checklistItems}>
        {items.map((item) => (
          <label className={`${styles.checkItem} ${item.checked ? styles.checkedItem : ''} ${item.checked && tone === 'risk' ? styles.riskItem : ''} ${item.checked && tone === 'medication' ? styles.medicationItem : ''}`} key={item.label}>
            <input defaultChecked={item.checked} type="checkbox" />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
