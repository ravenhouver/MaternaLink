'use client';

import Link from 'next/link';
import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import styles from './patient-registration.module.css';

const methods = [
  {
    key: 'manual',
    title: 'Manual Entry',
    subtitle: 'Fill out the form step-by-step',
    description: 'Best for detailed data entry with full control over each input field.',
    icon: 'edit' as const,
    action: 'Start Typing',
  },
  {
    key: 'upload',
    title: 'Upload KIA Book Photo',
    subtitle: 'AI helps read the photo, you check the result',
    description: 'Just upload a photo of the KIA book. The system will automatically extract information and fill the form for you—you just need to verify.',
    icon: 'camera' as const,
    action: 'Capture / Upload Photo',
    featured: true,
  },
];

export function AddPatientMethodContent() {
  return (
    <PageContainer size="wide" className={styles.page}>
      <header className={styles.methodHeader}>
        <h1>New Patient Registration</h1>
        <p>Choose the fastest way to enter patient data into the system.</p>
      </header>

      <section className={styles.methodGrid} aria-label="Patient registration methods">
        {methods.map((method) => (
          <article className={`${styles.methodCard} ${method.featured ? styles.featuredMethod : ''}`} key={method.key}>
            <div className={styles.methodTopline}>
              <span className={styles.methodIcon}><AppIcon name={method.icon} width={26} height={26} /></span>
              {method.featured ? <span className={styles.popularPill}>Popular</span> : null}
            </div>

            <div className={styles.methodCopy}>
              <h2>{method.title}</h2>
              <p className={styles.methodSubtitle}>{method.subtitle}</p>
              <p>{method.description}</p>
            </div>

            {method.featured ? (
              <Link href="/master/add-patient/upload" className={styles.methodAction}>
                <AppIcon name="camera" width={20} height={20} />
                {method.action}
              </Link>
            ) : (
              <Link href="/master/add-patient/manual" className={styles.methodAction}>
                {method.action}
                <AppIcon name="arrowRight" width={14} height={14} />
              </Link>
            )}
          </article>
        ))}
      </section>

      <aside className={styles.securityTips}>
        <AppIcon name="info" width={20} height={20} />
        <div>
          <h2>Data Security Tips</h2>
          <p>Ensure all data entered matches official patient identity documents (KTP/KK) for accurate medical records in the future.</p>
        </div>
      </aside>
    </PageContainer>
  );
}
