import Typography from 'antd/es/typography';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { PageContainer } from '@/components/layout/page-container';
import { inputMethods } from '../registration-data';
import { InputMethodCard } from './input-method-card';
import styles from '../patient-registration.module.css';

type AddPatientMethodSelectorProps = {
  onSelectManual: () => void;
};

export function AddPatientMethodSelector({ onSelectManual }: AddPatientMethodSelectorProps) {
  return (
    <PageContainer size="wide" className={styles.page}>
      <Breadcrumbs
        separatorSrc="/figma-add-patient/chevron.svg"
        items={[{ label: 'Beranda', href: '/' }, { label: 'Daftar Pasien', href: '/master' }, { label: 'Tambah Pasien Baru' }]}
      />

      <section className={styles.header}>
        <Typography.Title level={1}>Pilih Metode Input</Typography.Title>
        <Typography.Paragraph>
          Silakan pilih cara yang paling nyaman bagi Anda untuk memasukkan data pasien baru. Teknologi kami siap membantu mempercepat proses administrasi.
        </Typography.Paragraph>
      </section>

      <section className={styles.methodGrid} aria-label="Metode input pasien">
        {inputMethods.map((method) => (
          <InputMethodCard method={method} onSelectManual={onSelectManual} key={method.key} />
        ))}
      </section>

      <section className={styles.methodNotice} aria-label="Catatan metode input">
        <img src="/figma-add-patient/shield.svg" alt="" />
        <Typography.Text>Apapun metode yang dipilih, kamu tetap bisa edit data sebelum disimpan</Typography.Text>
      </section>

      <section className={styles.digitalContextCard}>
        <div className={styles.digitalContextCopy}>
          <Typography.Title level={2}>Digitalisasi Posyandu &amp; Puskesmas</Typography.Title>
          <Typography.Paragraph>
            Sistem ini dirancang untuk memudahkan tenaga kesehatan di seluruh pelosok Indonesia. Mendukung penggunaan luring (offline) dan sinkronisasi otomatis saat terhubung internet.
          </Typography.Paragraph>
          <div className={styles.digitalStats}>
            <span>
              <strong>99.2%</strong>
              <small>AKURASI AI</small>
            </span>
            <i />
            <span>
              <strong>3x Lipat</strong>
              <small>LEBIH CEPAT</small>
            </span>
          </div>
        </div>
        <div className={styles.digitalContextImage}>
          <img src="/figma-add-patient/health-worker.png" alt="Tenaga kesehatan membawa tablet" />
          <span />
        </div>
      </section>
    </PageContainer>
  );
}
