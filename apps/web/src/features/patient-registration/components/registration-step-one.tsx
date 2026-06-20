 'use client';

import { useTranslations } from 'next-intl';
import { FormField } from '@/components/ui/form-field';
import styles from '../patient-registration.module.css';

export function RegistrationStepOne() {
  const t = useTranslations('registration');

  return (
    <>
      <section className={styles.registrationCard} aria-label={t('patientIdentityForm')}>
        <FormField label={t('patientName')} className={styles.fullField}>
          <input type="text" placeholder={t('patientExample')} />
        </FormField>

        <div className={styles.registrationFieldGrid}>
          <FormField label={t('age')}>
            <span className={styles.inputAffix}>
              <input type="number" placeholder="00" min="0" />
              <small>{t('years')}</small>
            </span>
          </FormField>

          <FormField label={t('phone')}>
            <input type="tel" placeholder="0812xxxxxxx" />
          </FormField>
        </div>
      </section>
    </>
  );
}
