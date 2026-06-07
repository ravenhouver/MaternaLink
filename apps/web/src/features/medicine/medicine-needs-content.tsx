'use client';

import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { MedicineHeader } from './components/medicine-header';
import { MedicineSectionCard } from './components/medicine-section-card';
import { SubmissionCard } from './components/submission-card';
import { medicineSections } from './medicine-data';
import styles from './medicine.module.css';

export function MedicineNeedsContent() {
  return (
    <PageContainer size="wide" className={styles.page}>
      <Breadcrumbs items={[{ label: 'Beranda', href: '/' }, { label: 'Kebutuhan Obat' }]} />
      <MedicineHeader />
      <section className={styles.grid} aria-label="Daftar kebutuhan obat">
        {medicineSections.map((section) => (
          <MedicineSectionCard section={section} key={section.title} />
        ))}
      </section>
      <SubmissionCard />
    </PageContainer>
  );
}
