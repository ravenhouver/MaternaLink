import Button from 'antd/es/button';
import Typography from 'antd/es/typography';
import { AppIcon } from '@/components/ui/app-icon';
import type { ForecastCalendarEvent } from '@/lib/api';
import styles from '../calendar.module.css';

const asset = (name: string) => `/figma-calendar/${name}`;

const eventCardClass = (type: ForecastCalendarEvent['type']) => [styles.eventCard, type === 'risk' ? styles.riskCard : styles.deliveryCard].join(' ');

export function EventsPanel({ dateLabel, events, note }: { dateLabel: string; events: ForecastCalendarEvent[]; note: string }) {
  const primary = events[0];
  const secondary = events.slice(1, 3);

  return (
    <aside className={styles.eventsPanel} aria-label="Prediksi kalender hari ini">
      <div className={styles.eventsHeading}>
        <Typography.Title level={3}>Prediksi Hari Ini</Typography.Title>
        <span>{dateLabel}</span>
      </div>

      {events.length === 0 ? <article className={styles.eventCard}><Typography.Title level={4}>Belum ada prediksi</Typography.Title><Typography.Text>Data muncul dari HPL, ANC, dan risiko pasien aktif.</Typography.Text></article> : null}
      {primary ? <article className={eventCardClass(primary.type)}>
        <div className={styles.eventTopline}>
          <span>
            <Typography.Title level={4}>{primary.title}</Typography.Title>
            <Typography.Text>{primary.label}</Typography.Text>
          </span>
          {primary.priority ? <strong>UTAMA</strong> : null}
        </div>
        {primary.type === 'delivery' ? <>
          <div className={styles.prepCard}>
            <AppIcon name="clipboard" width={24} height={24} />
            <span>
              <Typography.Text className={styles.prepLabel}>BUTUH PERSIAPAN:</Typography.Text>
              <Typography.Text className={styles.prepCopy}>{primary.prepItems?.join(', ') || 'Belum ada forecast stok'}</Typography.Text>
            </span>
          </div>
          <Button type="primary" className={styles.prepareButton}>Siapkan Tindakan</Button>
        </> : primary.time ? <div className={styles.eventTime}><AppIcon name="clock" width={18} height={18} /><Typography.Text>{primary.time}</Typography.Text></div> : null}
      </article> : null}

      {secondary.map((event) => <article className={eventCardClass(event.type)} key={event.id}>
        <Typography.Title level={4}>{event.title}</Typography.Title>
        <Typography.Text className={styles.riskLabel}>{event.label}</Typography.Text>
        {event.time ? <div className={styles.eventTime}>
          <AppIcon name="clock" width={18} height={18} />
          <Typography.Text>{event.time}</Typography.Text>
        </div> : null}
      </article>)}

      <article className={styles.noteCard}>
        <img src={asset('clinic-interior.png')} alt="Interior klinik" />
        <div className={styles.noteOverlay} />
        <div className={styles.noteCopy}>
          <Typography.Text>CATATAN BIDAN</Typography.Text>
          <Typography.Title level={4}>{note}</Typography.Title>
        </div>
      </article>
    </aside>
  );
}
