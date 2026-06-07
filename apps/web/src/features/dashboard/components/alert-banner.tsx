import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import styles from '../dashboard.module.css';

export function AlertBanner() {
  return (
    <section className={styles.alertBanner} aria-label="Pasien HPL minggu ini">
      <div className={styles.alertCopy}>
        <span className={styles.alertIcon}>
          <AppIcon name="alert" width={22} height={22} />
        </span>
        <span>
          <Typography.Text className={styles.alertTitle}>2 pasien HPL minggu ini</Typography.Text>
          <Typography.Text className={styles.alertSubtitle}>Cek ketersediaan daftar obat dan perlengkapan sekarang.</Typography.Text>
        </span>
      </div>
      <Button className={styles.alertButton} type="default">
        Periksa Sekarang
      </Button>
    </section>
  );
}
