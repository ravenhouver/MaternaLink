'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import { routes } from '@/lib/routes';
import styles from './patient-registration.module.css';

export function AddPatientMethodContent() {
  const t = useTranslations('registration');
  const methods = [
    {
      key: 'manual',
      title: t('manualTitle'),
      subtitle: t('manualSubtitle'),
      description: t('manualDescription'),
      icon: 'edit' as const,
      action: t('manualButton'),
    },
  ];

  return (
    <PageContainer size="wide" className={styles.page}>
      <header className={styles.methodHeader}>
        <h1>{t('newPatientTitle')}</h1>
        <p>{t('methodSubtitle')}</p>
      </header>

      <section className={styles.methodGrid} aria-label="Patient registration methods">
        {methods.map((method) => (
          <article className={styles.methodCard} key={method.key}>
            <div className={styles.methodTopline}>
              <span className={styles.methodIcon}><AppIcon name={method.icon} width={26} height={26} /></span>
            </div>

            <div className={styles.methodCopy}>
              <h2>{method.title}</h2>
              <p className={styles.methodSubtitle}>{method.subtitle}</p>
              <p>{method.description}</p>
            </div>

            <Link href={routes.manualPatient} className={styles.methodAction}>
              {method.action}
              <AppIcon name="arrowRight" width={14} height={14} />
            </Link>
          </article>
        ))}
      </section>

      <aside className={styles.securityTips}>
        <AppIcon name="info" width={20} height={20} />
        <div>
          <h2>{t('methodNotice')}</h2>
          <p>{t('methodNoticeText')}</p>
        </div>
      </aside>
    </PageContainer>
  );
}
