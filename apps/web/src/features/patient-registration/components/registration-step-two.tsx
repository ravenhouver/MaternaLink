import Typography from 'antd/es/typography';
import { FormField } from '@/components/ui/form-field';
import styles from '../patient-registration.module.css';

export function RegistrationStepTwo() {
  return (
    <section className={styles.pregnancyStepFields} aria-label="Form data kehamilan">
      <div className={styles.pregnancyAgeSection}>
        <div className={styles.pregnancyAgeHeader}>
          <Typography.Text>Usia kehamilan saat ini (minggu)</Typography.Text>
          <output className={styles.pregnancyWeekValue}>
            <strong>24</strong>
            <span>Minggu</span>
          </output>
        </div>
        <div className={styles.pregnancySlider} aria-hidden="true">
          <span className={styles.pregnancySliderTrack} />
          <span className={styles.pregnancySliderThumb} />
        </div>
        <div className={styles.pregnancyScale}>
          <span>1 Minggu</span>
          <span>Trimester 1</span>
          <span>Trimester 2</span>
          <span>Trimester 3</span>
          <span>42 Minggu</span>
        </div>
      </div>

      <div className={styles.pregnancyDataGrid}>
        <FormField label="Hari Perkiraan Lahir (HPL)" hint="Dihitung otomatis berdasarkan HPHT">
          <span className={styles.displayInput}>
            <img src="/figma-registration/calendar.svg" alt="" />
            <input type="text" value="15 Januari 2026" readOnly />
          </span>
        </FormField>

        <FormField label="Kunjungan ANC Terakhir">
          <span className={[styles.displayInput, styles.selectLike].join(' ')}>
            <img src="/figma-registration/anc-kit.svg" alt="" />
            <select defaultValue="K3" aria-label="Kunjungan ANC Terakhir">
              <option>K1</option>
              <option>K2</option>
              <option>K3</option>
              <option>K4</option>
            </select>
            <img src="/figma-registration/select-chevron.svg" alt="" className={styles.selectChevron} />
          </span>
        </FormField>
      </div>

      <aside className={styles.trimesterStatusCard} aria-label="Status Trimester">
        <img src="/figma-registration/status-icon.svg" alt="" />
        <div>
          <Typography.Title level={3}>Status Trimester</Typography.Title>
          <Typography.Paragraph>
            Pasien saat ini berada di akhir trimester kedua. Disarankan untuk memantau tekanan darah dan detak jantung janin secara rutin setiap kunjungan.
          </Typography.Paragraph>
        </div>
      </aside>
    </section>
  );
}
