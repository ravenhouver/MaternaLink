import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import styles from '../medicine.module.css';

export function MedicineHeader() {
  return (
    <section className={styles.heading}>
      <Typography.Title level={1}>Prediksi Kebutuhan Obat — Januari 2026</Typography.Title>
      <div className={styles.insight}>
        <AppIcon name="info" width={20} height={20} />
        <Typography.Text>Berdasarkan 5 persalinan, 12 kunjungan ANC, dan 3 pasien risiko tinggi yang diprediksi</Typography.Text>
      </div>
    </section>
  );
}
