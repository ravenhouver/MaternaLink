'use client';

import Button from 'antd/es/button';
import Input from 'antd/es/input';
import Typography from 'antd/es/typography';
import { useTranslations } from 'next-intl';
import { AppIcon } from '@/components/ui/app-icon';
import styles from '../medicine.module.css';

const { TextArea } = Input;

export function SubmissionCard() {
  const t = useTranslations('medicine');

  return (
    <section className={styles.submissionCard}>
      <div className={styles.submissionInner}>
        <Typography.Title level={3}>{t('finalizeReport')}</Typography.Title>
        <label className={styles.submissionLabel} htmlFor="medicine-note">
          {t('addHealthOfficeNote')}
        </label>
        <TextArea id="medicine-note" className={styles.submissionTextarea} placeholder={t('notePlaceholder')} rows={3} />
        <Button type="primary" className={styles.submitButton}>
          <AppIcon name="send" width={18} height={18} />
          {t('sendToHealthOffice')}
        </Button>
      </div>
    </section>
  );
}
