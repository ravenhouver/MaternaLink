import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import styles from '../calendar.module.css';

const asset = (name: string) => `/figma-calendar/${name}`;

export function EventsPanel() {
  return (
    <aside className={styles.eventsPanel} aria-label="Acara hari ini">
      <div className={styles.eventsHeading}>
        <Typography.Title level={3}>Acara Hari Ini</Typography.Title>
        <span>9 OKT</span>
      </div>

      <article className={[styles.eventCard, styles.deliveryCard].join(' ')}>
        <div className={styles.eventTopline}>
          <span>
            <Typography.Title level={4}>Ibu Maria</Typography.Title>
            <Typography.Text>PERSALINAN (HPL)</Typography.Text>
          </span>
          <strong>UTAMA</strong>
        </div>
        <div className={styles.prepCard}>
          <img src={asset('prep.svg')} alt="" />
          <span>
            <Typography.Text className={styles.prepLabel}>BUTUH PERSIAPAN:</Typography.Text>
            <Typography.Text className={styles.prepCopy}>Oksitosin, Spuit, Benang Jahit</Typography.Text>
          </span>
        </div>
        <Button type="primary" className={styles.prepareButton}>
          Siapkan Tindakan
        </Button>
      </article>

      <article className={[styles.eventCard, styles.riskCard].join(' ')}>
        <Typography.Title level={4}>Ibu Anisa</Typography.Title>
        <Typography.Text className={styles.riskLabel}>KONTROL RISIKO TINGGI</Typography.Text>
        <div className={styles.eventTime}>
          <img src={asset('time.svg')} alt="" />
          <Typography.Text>Pukul 14:00 WIB</Typography.Text>
        </div>
      </article>

      <article className={styles.noteCard}>
        <img src={asset('clinic-interior.png')} alt="Interior klinik" />
        <div className={styles.noteOverlay} />
        <div className={styles.noteCopy}>
          <Typography.Text>CATATAN BIDAN</Typography.Text>
          <Typography.Title level={4}>Pastikan stok spuit 5cc tersedia untuk pekan depan.</Typography.Title>
        </div>
      </article>
    </aside>
  );
}
