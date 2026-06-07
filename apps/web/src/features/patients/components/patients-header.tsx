import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import styles from '../patients.module.css';

export function PatientsHeader() {
  return (
    <section className={styles.hero}>
      <div>
        <Typography.Title level={1} className={styles.title}>
          Daftar Pasien
        </Typography.Title>
        <Typography.Paragraph className={styles.subtitle}>
          Kelola data ibu hamil, pantau status risiko, dan jadwal persalinan dalam satu pandangan terpadu.
        </Typography.Paragraph>
      </div>
      <Button type="primary" className={styles.addPatientButton} href="/master/add-patient">
        <AppIcon name="userPlus" width={20} height={20} />
        Tambah Pasien Baru
      </Button>
    </section>
  );
}
