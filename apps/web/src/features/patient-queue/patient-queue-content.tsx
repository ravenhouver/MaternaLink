'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import styles from './patient-queue.module.css';

type SummaryCard = {
  label: string;
  value: string;
  unit: string;
  icon: AppIconName;
  tone: 'blue' | 'red' | 'green';
};

type QueuePatient = {
  queueNo: string;
  name: string;
  nik: string;
  pregnancy: string;
  dueDate: string;
  risk: 'HIGH RISK' | 'NORMAL';
  doctor: string;
  state?: 'EXAMINING';
  highlighted?: boolean;
};

const summaryCards: SummaryCard[] = [
  { label: 'In Queue', value: '2', unit: 'patients', icon: 'hourglass', tone: 'blue' },
  { label: 'Under Examination', value: '1', unit: 'patients', icon: 'stethoscope', tone: 'red' },
  { label: 'Completed Today', value: '12', unit: 'patients', icon: 'checkCircle', tone: 'green' },
];

const patients: QueuePatient[] = [
  { queueNo: 'A-001', name: 'Mrs. Maria', nik: 'NIK: 327102********01', pregnancy: 'Age: 32 weeks', dueDate: 'Due Date: 12 Feb 2024', risk: 'HIGH RISK', doctor: 'dr. Ratna Wulandari' },
  { queueNo: 'A-002', name: 'Mrs. Marinda', nik: 'NIK: 327111********01', pregnancy: 'Age: 32 weeks', dueDate: 'Due Date: 12 Feb 2024', risk: 'HIGH RISK', doctor: 'dr. Ratna Wulandari' },
  { queueNo: 'A-003', name: 'Mrs. Anisa', nik: 'NIK: 327103********09', pregnancy: 'Age: 28 weeks', dueDate: 'Due Date: 5 Mar 2024', risk: 'NORMAL', doctor: 'dr. Ahmad Fauzi' },
  { queueNo: 'A-004', name: 'Mrs. Dewi', nik: 'NIK: 327105********12', pregnancy: 'Due Date: Tomorrow!', dueDate: 'D-1 Delivery', risk: 'HIGH RISK', doctor: 'dr. Ratna Wulandari', state: 'EXAMINING', highlighted: true },
];

export function PatientQueueContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <PageContainer size="wide" className={styles.page}>
      <section className={styles.headerCard}>
        <div>
          <h1>Patient Queue</h1>
          <p>{"Manage today's consultation queue - register new patients and monitor examination turns."}</p>
        </div>
        <Link href="/master/add-patient" className={styles.primaryButton}>
          <AppIcon name="plus" width={20} height={20} />
          Add New Patient
        </Link>
      </section>

      <section className={styles.summaryGrid} aria-label="Queue summary">
        {summaryCards.map((card) => (
          <article className={styles.summaryCard} key={card.label}>
            <span className={[styles.summaryIcon, styles[card.tone]].join(' ')}>
              <AppIcon name={card.icon} width={24} height={24} />
            </span>
            <div>
              <h2>{card.label}</h2>
              <p><strong>{card.value}</strong> {card.unit}</p>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.toolbar} aria-label="Search and filter patients">
        <label className={styles.searchBox}>
          <AppIcon name="search" width={18} height={18} />
          <input type="search" placeholder="Search patient..." />
        </label>
        <div className={styles.filterWrap}>
          <button type="button" className={styles.filterButton} aria-expanded={isFilterOpen} aria-haspopup="dialog" onClick={() => setIsFilterOpen((open) => !open)}>
            <AppIcon name="filter" width={18} height={18} />
            Filter
            <AppIcon name="chevronDown" width={16} height={16} />
          </button>
          {isFilterOpen ? <QueueFilterDialog onClose={() => setIsFilterOpen(false)} /> : null}
        </div>
      </section>

      <section className={styles.queueCard} aria-label="Patient queue table">
        <div className={styles.tableScroll}>
          <table className={styles.queueTable}>
            <thead>
              <tr>
                <th>Queue No.</th>
                <th>Patient Data</th>
                <th>Pregnancy Info</th>
                <th>Status & Doctor</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr className={patient.highlighted ? styles.highlightedRow : undefined} key={patient.queueNo}>
                  <td data-label="Queue No.">
                    <div className={styles.queueCell}>
                      <span className={styles.queueBadge}>{patient.queueNo}</span>
                      {patient.state ? <span className={styles.examiningBadge}>{patient.state}</span> : null}
                    </div>
                  </td>
                  <td data-label="Patient Data">
                    <strong className={styles.patientName}>{patient.name}</strong>
                    <span className={styles.patientMeta}>{patient.nik}</span>
                  </td>
                  <td data-label="Pregnancy Info">
                    <strong className={patient.highlighted ? styles.dueSoon : undefined}>{patient.pregnancy}</strong>
                    <span>{patient.dueDate}</span>
                  </td>
                  <td data-label="Status & Doctor">
                    <span className={patient.risk === 'HIGH RISK' ? styles.highRiskBadge : styles.normalBadge}>{patient.risk}</span>
                    <span className={styles.doctorLine}><AppIcon name="user" width={14} height={14} />{patient.doctor}</span>
                  </td>
                  <td data-label="Action">
                    {patient.state ? (
                      <div className={styles.actionGroup}>
                        <button type="button" className={styles.completeButton}>Complete</button>
                        <button type="button" className={styles.secondaryButton}>View Details</button>
                      </div>
                    ) : (
                      <Link href="/inputs/examination" className={styles.callButton}>Call</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className={styles.paginationFooter}>
          <p>Showing 1-3 of 8 patients in queue</p>
          <div className={styles.paginationControls}>
            <button type="button" aria-label="Previous page" disabled><AppIcon name="chevronLeft" width={18} height={18} /></button>
            <button type="button" aria-current="page">1</button>
            <button type="button" aria-label="Next page"><AppIcon name="chevronRight" width={18} height={18} /></button>
          </div>
        </footer>
      </section>
    </PageContainer>
  );
}

function QueueFilterDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.filterPanel} role="dialog" aria-label="Patient queue filters">
      <fieldset>
        <legend>Due Date Period</legend>
        <label><input defaultChecked name="due-date-period" type="radio" /> <span>All</span></label>
        <label><input name="due-date-period" type="radio" /> <span>Due This Month</span></label>
        <label><input name="due-date-period" type="radio" /> <span>Due Next Month</span></label>
      </fieldset>

      <fieldset>
        <legend>Risk Status</legend>
        <label><input defaultChecked name="risk-status" type="radio" /> <span>All</span></label>
        <label><input name="risk-status" type="radio" /> <span>High Risk</span></label>
        <label><input name="risk-status" type="radio" /> <span>Normal</span></label>
      </fieldset>

      <label className={styles.doctorFilter}>
        <span>Assigned Doctor</span>
        <select defaultValue="all">
          <option value="all">All Doctors</option>
          <option value="ratna">dr. Ratna Wulandari</option>
          <option value="ahmad">dr. Ahmad Fauzi</option>
        </select>
      </label>

      <footer className={styles.filterFooter}>
        <button type="button" className={styles.resetButton}>Reset</button>
        <button type="button" className={styles.applyButton} onClick={onClose}>Apply</button>
      </footer>
    </div>
  );
}

