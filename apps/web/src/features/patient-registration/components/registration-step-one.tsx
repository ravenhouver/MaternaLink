import { FormField } from '@/components/ui/form-field';
import styles from '../patient-registration.module.css';

export function RegistrationStepOne() {
  return (
    <>
      <section className={styles.registrationCard} aria-label="Form data diri pasien">
        <FormField label="Nama Lengkap Pasien" className={styles.fullField}>
          <input type="text" placeholder="Contoh: Siti Aminah" />
        </FormField>

        <div className={styles.registrationFieldGrid}>
          <FormField label="Usia">
            <span className={styles.inputAffix}>
              <input type="number" placeholder="00" min="0" />
              <small>Tahun</small>
            </span>
          </FormField>

          <FormField label="Nomor Telepon (WhatsApp)">
            <input type="tel" placeholder="0812xxxxxxx" />
          </FormField>
        </div>
      </section>
    </>
  );
}
