import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { FormField } from '@/components/ui/form-field';
import { AppIcon } from '@/components/ui/app-icon';
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

      <section className={styles.aiCard} aria-label="Fitur Cerdas AI">
        <span className={styles.aiIcon}>
          <AppIcon name="zap" width={24} height={24} />
        </span>
        <div className={styles.aiCopy}>
          <Typography.Title level={3}>Fitur Cerdas AI</Typography.Title>
          <Typography.Paragraph>Anda dapat mengunggah foto buku KIA. Sistem AI akan mengekstrak data secara otomatis untuk mempercepat proses.</Typography.Paragraph>
          <div className={styles.aiResult}>
            <strong>AI berhasil membaca:</strong>
            <em>&quot;Usia kehamilan 28 minggu, HPL 15 Jan&quot;</em>
            <div className={styles.aiActions}>
              <Button type="primary" className={styles.aiConfirmButton}>Konfirmasi</Button>
              <Button className={styles.aiEditButton}>Edit Manual</Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
