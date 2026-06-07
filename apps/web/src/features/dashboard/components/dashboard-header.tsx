import Typography from 'antd/es/typography';
import { IconButton } from '@/components/ui/icon-button';
import styles from '../dashboard.module.css';

export function DashboardHeader() {
  return (
    <section className={styles.header} aria-label="Ringkasan halaman">
      <div>
        <Typography.Title level={2} className={styles.title}>
          Selamat datang, Bidan Sari
        </Typography.Title>
        <Typography.Text className={styles.subtitle}>Laporan aktivitas Klinik Sejahtera hari ini.</Typography.Text>
      </div>

      <div className={styles.headerActions}>
        <IconButton className={styles.notificationButton} label="Notifikasi" icon="bell" />
        <div className={styles.clinicPill} aria-label="Profil klinik">
          <span>Klinik Sejahtera</span>
          <span className={styles.clinicAvatar}>KS</span>
        </div>
      </div>
    </section>
  );
}
