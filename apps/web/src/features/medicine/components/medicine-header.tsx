'use client';

import Typography from 'antd/es/typography';
import { useTranslations } from 'next-intl';
import { AppIcon } from '@/components/ui/app-icon';
import styles from '../medicine.module.css';

export function MedicineHeader() {
  const t = useTranslations('medicine');

  return (
    <section className={styles.heading}>
      <Typography.Title level={1}>{t('headerTitle')}</Typography.Title>
      <div className={styles.insight}>
        <AppIcon name="info" width={20} height={20} />
        <Typography.Text>{t('headerInsight')}</Typography.Text>
      </div>
    </section>
  );
}
