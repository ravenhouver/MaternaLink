 'use client';

import Typography from 'antd/es/typography';
import { useTranslations } from 'next-intl';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { AppIcon } from '@/components/ui/app-icon';
import { routes } from '@/lib/routes';
import { inputMethods } from '../registration-data';
import { InputMethodCard } from './input-method-card';
import styles from '../patient-registration.module.css';

type AddPatientMethodSelectorProps = {
  onSelectManual: () => void;
};

export function AddPatientMethodSelector({ onSelectManual }: AddPatientMethodSelectorProps) {
  const t = useTranslations('registration');
  const methods = inputMethods.map((method) => ({
    ...method,
    title: t(method.key === 'manual' ? 'manualTitle' : 'voiceTitle'),
    subtitle: t(method.key === 'manual' ? 'manualSubtitle' : 'voiceSubtitle'),
    description: t(method.key === 'manual' ? 'manualDescription' : 'voiceDescription'),
    button: t(method.key === 'manual' ? 'manualButton' : 'voiceButton'),
  }));

  return (
    <PageContainer size="wide" className={styles.page}>
      <Breadcrumbs
        items={[{ label: t('home'), href: routes.dashboard }, { label: t('patients'), href: routes.patients }, { label: t('addPatient') }]}
      />

      <section className={styles.header}>
        <Typography.Title level={1}>{t('chooseMethod')}</Typography.Title>
        <Typography.Paragraph>{t('methodSubtitle')}</Typography.Paragraph>
      </section>

      <section className={styles.methodGrid} aria-label={t('methodGrid')}>
        {methods.map((method) => (
          <InputMethodCard method={method} onSelectManual={onSelectManual} key={method.key} />
        ))}
      </section>

      <section className={styles.methodNotice} aria-label={t('methodNotice')}>
        <AppIcon name="shield" width={22} height={22} />
        <Typography.Text>{t('methodNoticeText')}</Typography.Text>
      </section>

      <section className={styles.digitalContextCard}>
        <div className={styles.digitalContextCopy}>
          <Typography.Title level={2}>{t('digitalTitle')}</Typography.Title>
          <Typography.Paragraph>{t('digitalBody')}</Typography.Paragraph>
          <div className={styles.digitalStats}>
            <span>
              <strong>99.2%</strong>
              <small>{t('aiAccuracy')}</small>
            </span>
            <i />
            <span>
              <strong>3x Lipat</strong>
              <small>{t('faster')}</small>
            </span>
          </div>
        </div>
        <div className={styles.digitalContextImage}>
          <img src="/figma-add-patient/health-worker.png" alt={t('healthWorkerAlt')} />
          <span />
        </div>
      </section>
    </PageContainer>
  );
}
