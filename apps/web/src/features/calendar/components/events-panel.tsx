import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import styles from '../calendar.module.css';

const asset = (name: string) => `/figma-calendar/${name}`;

export type CalendarPanelEvent = {
  title: string;
  label: string;
  time: string;
  priority?: boolean;
};

export function EventsPanel({ events }: { events: CalendarPanelEvent[] }) {
  return (
    <aside className={styles.eventsPanel} aria-label="Acara hari ini">
      <div className={styles.eventsHeading}>
        <Typography.Title level={3}>Acara Hari Ini</Typography.Title>
        <span>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }).toUpperCase()}</span>
      </div>

      {events.length === 0 ? <article className={styles.eventCard}><Typography.Title level={4}>Belum ada acara</Typography.Title><Typography.Text>Data kalender akan muncul dari pasien terdaftar.</Typography.Text></article> : null}
      {events[0] ? <article className={[styles.eventCard, styles.deliveryCard].join(' ')}>
        <div className={styles.eventTopline}>
          <span>
            <Typography.Title level={4}>{events[0].title}</Typography.Title>
            <Typography.Text>{events[0].label}</Typography.Text>
          </span>
          {events[0].priority ? <strong>UTAMA</strong> : null}
        </div>
        <div className={styles.prepCard}>
          <AppIcon name="clipboard" width={24} height={24} />
          <span>
            <Typography.Text className={styles.prepLabel}>BUTUH PERSIAPAN:</Typography.Text>
            <Typography.Text className={styles.prepCopy}>Oksitosin, Spuit, Benang Jahit</Typography.Text>
          </span>
        </div>
        <Button type="primary" className={styles.prepareButton}>
          Siapkan Tindakan
        </Button>
      </article> : null}

      {events.slice(1, 3).map((event) => <article className={[styles.eventCard, styles.riskCard].join(' ')} key={`${event.title}-${event.label}`}>
        <Typography.Title level={4}>{event.title}</Typography.Title>
        <Typography.Text className={styles.riskLabel}>{event.label}</Typography.Text>
        <div className={styles.eventTime}>
          <AppIcon name="clock" width={18} height={18} />
          <Typography.Text>{event.time}</Typography.Text>
        </div>
      </article>)}

      <article className={styles.noteCard}>
        <img src={asset('clinic-interior.png')} alt="Interior klinik" />
        <div className={styles.noteOverlay} />
        <div className={styles.noteCopy}>
          <Typography.Text>CATATAN BIDAN</Typography.Text>
          <Typography.Title level={4}>{events.length} acara klinis aktif dari database pasien.</Typography.Title>
        </div>
      </article>
    </aside>
  );
}
