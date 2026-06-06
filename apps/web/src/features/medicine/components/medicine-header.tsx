import Typography from 'antd/es/typography';
import styles from '../medicine.module.css';

export function MedicineHeader() {
  return (
    <section className={styles.heading}>
      <Typography.Title level={1}>Prediksi Kebutuhan Obat — Januari 2026</Typography.Title>
      <div className={styles.insight}>
        <img src="/figma-medicine/info.svg" alt="" />
        <Typography.Text>Berdasarkan 5 persalinan, 12 kunjungan ANC, dan 3 pasien risiko tinggi yang diprediksi</Typography.Text>
      </div>
    </section>
  );
}
