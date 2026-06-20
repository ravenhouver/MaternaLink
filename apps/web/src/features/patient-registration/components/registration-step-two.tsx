 'use client';

import Typography from 'antd/es/typography';
import { useTranslations } from 'next-intl';
import { FormField } from '@/components/ui/form-field';
import { AppIcon } from '@/components/ui/app-icon';
import styles from '../patient-registration.module.css';

export function RegistrationStepTwo() {
  const t = useTranslations('registration');

  return (
    <section className={styles.pregnancyStepFields} aria-label={t('pregnancyForm')}>
      <div className={styles.pregnancyAgeSection}>
        <div className={styles.pregnancyAgeHeader}>
          <Typography.Text>{t('currentPregnancyAge')}</Typography.Text>
          <output className={styles.pregnancyWeekValue}>
            <strong>24</strong>
            <span>{t('weeks')}</span>
          </output>
        </div>
        <div className={styles.pregnancySlider} aria-hidden="true">
          <span className={styles.pregnancySliderTrack} />
          <span className={styles.pregnancySliderThumb} />
        </div>
        <div className={styles.pregnancyScale}>
          <span>{t('week1')}</span>
          <span>{t('trimester1')}</span>
          <span>{t('trimester2')}</span>
          <span>{t('trimester3')}</span>
          <span>{t('week42')}</span>
        </div>
      </div>

      <div className={styles.pregnancyDataGrid}>
        <FormField label={t('dueDate')} hint={t('dueHint')}>
          <span className={styles.displayInput}>
            <AppIcon name="calendar" width={20} height={20} />
            <input type="text" value="15 Januari 2026" readOnly />
          </span>
        </FormField>

        <FormField label={t('lastAnc')}>
          <span className={[styles.displayInput, styles.selectLike].join(' ')}>
            <AppIcon name="package" width={20} height={20} />
            <select defaultValue="K3" aria-label={t('lastAnc')}>
              <option>K1</option>
              <option>K2</option>
              <option>K3</option>
              <option>K4</option>
            </select>
            <AppIcon name="chevronDown" className={styles.selectChevron} width={18} height={18} />
          </span>
        </FormField>
      </div>

      <aside className={styles.trimesterStatusCard} aria-label={t('trimesterStatus')}>
        <AppIcon name="info" width={28} height={28} />
        <div>
          <Typography.Title level={3}>{t('trimesterStatus')}</Typography.Title>
          <Typography.Paragraph>{t('trimesterBody')}</Typography.Paragraph>
        </div>
      </aside>
    </section>
  );
}
