import { riskFactors } from '../registration-data';
import styles from '../patient-registration.module.css';

export function RegistrationStepThree() {
  return (
    <section className={styles.riskStepFields} aria-label="Form faktor risiko">
      <div className={styles.riskFactorGrid}>
        {riskFactors.map((factor) => (
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
        <span>Catatan tambahan (optional)...</span>
        <textarea placeholder="Masukkan detail tambahan tentang kondisi kesehatan pasien..." />
      </label>
    </section>
  );
}
