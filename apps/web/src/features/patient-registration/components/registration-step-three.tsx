 'use client';

import { useTranslations } from 'next-intl';
import { riskFactors } from '../registration-data';
import styles from '../patient-registration.module.css';

export function RegistrationStepThree() {
  const t = useTranslations('registration');
  const factors = riskFactors.map((factor, index) => ({
    ...factor,
    title: t(['riskHypertension', 'riskAnemia', 'riskDiabetes', 'riskProblem', 'riskYoung', 'riskMature', 'riskTwin'][index]),
    description: t(['riskHypertensionDesc', 'riskAnemiaDesc', 'riskDiabetesDesc', 'riskProblemDesc', 'riskYoungDesc', 'riskMatureDesc', 'riskTwinDesc'][index]),
  }));

  return (
    <section className={styles.riskStepFields} aria-label={t('riskForm')}>
      <div className={styles.riskFactorGrid}>
        {factors.map((factor) => (
          <label className={[styles.riskFactorCard, factor.wide ? styles.wide : ''].filter(Boolean).join(' ')} key={factor.title}>
            <span className={styles.riskFactorCopy}>
              <strong>{factor.title}</strong>
              <small>{factor.description}</small>
            </span>
            <input type="checkbox" aria-label={factor.title} />
            <span className={styles.riskToggle} aria-hidden="true" />
          </label>
        ))}
      </div>

      <label className={styles.riskNoteField}>
        <span>{t('note')}</span>
        <textarea placeholder={t('notePlaceholder')} />
      </label>
    </section>
  );
}
