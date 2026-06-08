'use client';

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

export function PatientsPageContent() {
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
                      <button type="button" className={styles.queueButton}><AppIcon name="plus" width={18} height={18} />Queue</button>
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
    </PageContainer>
  );
}
