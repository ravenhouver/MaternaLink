'use client';

import { PageContainer } from '@/components/layout/page-container';
import { PaginationBar } from './components/pagination-bar';
import { PatientsFilters } from './components/patients-filters';
import { PatientsHeader } from './components/patients-header';
import { PatientsTable } from './components/patients-table';
import { patientFilters, patients } from './patients-data';
import styles from './patients.module.css';

export function PatientsPageContent() {
  return (
    <PageContainer size="wide" className={styles.page}>
      <PatientsHeader />
      <PatientsFilters filters={patientFilters} />
      <section className={styles.tableCard}>
        <PatientsTable patients={patients} />
        <PaginationBar />
      </section>
    </PageContainer>
  );
}
