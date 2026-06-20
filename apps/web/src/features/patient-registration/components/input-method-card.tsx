 'use client';

import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { useTranslations } from 'next-intl';
import { AppIcon } from '@/components/ui/app-icon';
import type { InputMethod } from '../registration-data';
import styles from '../patient-registration.module.css';

type InputMethodCardProps = {
  method: InputMethod;
  onSelectManual: () => void;
};

export function InputMethodCard({ method, onSelectManual }: InputMethodCardProps) {
  const t = useTranslations('registration');

  return (
    <article className={[styles.methodCard, method.featured ? styles.featuredMethod : ''].filter(Boolean).join(' ')}>
      {method.featured || method.visual ? <span className={styles.methodOrb} /> : null}
      <div className={styles.methodIcon}>
        <AppIcon name={method.icon} width={28} height={28} />
      </div>
      <div className={styles.methodCopy}>
        <div className={styles.methodTitleRow}>
          <h3>{method.title}</h3>
          {method.featured ? <span className={styles.popularPill}>{t('popular')}</span> : null}
        </div>
        <Typography.Text className={styles.methodSubtitle}>{method.subtitle}</Typography.Text>
        <Typography.Paragraph>{method.description}</Typography.Paragraph>
      </div>
      <Button className={styles.methodButton} onClick={method.key === 'manual' ? onSelectManual : undefined}>
        {method.button}
        <AppIcon name={method.buttonIcon} width={18} height={18} />
      </Button>
    </article>
  );
}
