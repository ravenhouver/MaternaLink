import Button from 'antd/es/button';
import Input from 'antd/es/input';
import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import styles from '../medicine.module.css';

const { TextArea } = Input;

export function SubmissionCard() {
  return (
    <section className={styles.submissionCard}>
      <div className={styles.submissionInner}>
        <Typography.Title level={3}>Finalisasi Laporan Kebutuhan</Typography.Title>
        <label className={styles.submissionLabel} htmlFor="medicine-note">
          Tambahkan catatan untuk dinas kesehatan
        </label>
        <TextArea id="medicine-note" className={styles.submissionTextarea} placeholder="Misal: Prioritaskan pengiriman Oksitosin karena stok saat ini kritis..." rows={3} />
        <Button type="primary" className={styles.submitButton}>
          <AppIcon name="send" width={18} height={18} />
          Kirim ke Dinas
        </Button>
      </div>
    </section>
  );
}
