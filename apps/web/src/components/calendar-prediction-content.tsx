'use client';

import Button from 'antd/es/button';
import Typography from 'antd/es/typography';

const asset = (name: string) => `/figma-calendar/${name}`;

const summaryItems = [
  { value: '5', label: 'Persalinan Bulan Ini', icon: 'summary-delivery.svg', tone: 'blue-soft' },
  { value: '12', label: 'Kunjungan ANC', icon: 'summary-anc.svg', tone: 'blue' },
  { value: '3', label: 'Pasien Risiko Tinggi', icon: 'summary-risk.svg', tone: 'red' },
];

const weekdays = ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'];

type CalendarDay = {
  day: number;
  muted?: boolean;
  shaded?: boolean;
  selected?: boolean;
  events?: Array<'anc' | 'delivery' | 'risk'>;
};

const days: CalendarDay[] = [
  { day: 28, muted: true, shaded: true },
  { day: 29, muted: true, shaded: true },
  { day: 30, muted: true, shaded: true },
  { day: 1, events: ['anc'] },
  { day: 2 },
  { day: 3, shaded: true, events: ['delivery'] },
  { day: 4 },
  { day: 5 },
  { day: 6, shaded: true, events: ['risk'] },
  { day: 7 },
  { day: 8 },
  { day: 9, selected: true, shaded: true, events: ['anc', 'risk'] },
  { day: 10 },
  { day: 11, events: ['anc'] },
  { day: 12 },
  { day: 13 },
  { day: 14 },
  { day: 15, shaded: true },
  { day: 16 },
  { day: 17 },
  { day: 18 },
  { day: 19 },
  { day: 20 },
  { day: 21 },
  { day: 22 },
  { day: 23 },
  { day: 24 },
  { day: 25 },
  { day: 26 },
  { day: 27 },
  { day: 28 },
  { day: 29 },
  { day: 30 },
  { day: 31 },
  { day: 1, muted: true, shaded: true },
];

const eventLabels = {
  anc: 'ANC',
  delivery: 'PERSALINAN',
  risk: 'RISIKO TINGGI',
};

export function CalendarPredictionContent() {
  return (
    <main className="calendar-page">
      <nav className="calendar-breadcrumb" aria-label="Breadcrumb">
        <span>Beranda</span>
        <img src={asset('breadcrumb-chevron.svg')} alt="" />
        <span>Daftar Pasien</span>
        <img src={asset('breadcrumb-chevron.svg')} alt="" />
        <strong>Kalender Prediksi</strong>
      </nav>

      <section className="calendar-summary" aria-label="Ringkasan kalender">
        {summaryItems.map((item) => (
          <article className="calendar-summary-card" key={item.label}>
            <span className={`calendar-summary-icon ${item.tone}`}>
              <img src={asset(item.icon)} alt="" />
            </span>
            <span>
              <Typography.Text className="calendar-summary-value">{item.value}</Typography.Text>
              <Typography.Text className="calendar-summary-label">{item.label}</Typography.Text>
            </span>
          </article>
        ))}
      </section>

      <section className="calendar-toolbar" aria-label="Kontrol kalender">
        <div className="calendar-month-control">
          <Typography.Title level={2}>Oktober 2024</Typography.Title>
          <div className="calendar-arrows">
            <Button shape="circle" aria-label="Bulan sebelumnya">
              <img src={asset('prev.svg')} alt="" />
            </Button>
            <Button shape="circle" aria-label="Bulan berikutnya">
              <img src={asset('next.svg')} alt="" />
            </Button>
          </div>
        </div>

        <div className="calendar-view-toggle" role="tablist" aria-label="Mode kalender">
          <button type="button" className="active" role="tab" aria-selected="true">
            Bulanan
          </button>
          <button type="button" role="tab" aria-selected="false">
            Mingguan
          </button>
        </div>
      </section>

      <section className="calendar-layout">
        <div className="monthly-card">
          <div className="calendar-weekdays">
            {weekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid" aria-label="Kalender Oktober 2024">
            {days.map((item, index) => (
              <div
                className={`calendar-cell${item.muted ? ' muted' : ''}${item.shaded ? ' shaded' : ''}${item.selected ? ' selected' : ''}`}
                key={`${item.day}-${index}`}
              >
                <span>{item.day}</span>
                {item.events ? (
                  <div className="calendar-dots" aria-label={item.events.map((event) => eventLabels[event]).join(', ')}>
                    {item.events.map((event) => (
                      <i className={event} key={event} />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="calendar-legend">
            {Object.entries(eventLabels).map(([key, label]) => (
              <span key={key}>
                <i className={key} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <aside className="events-panel" aria-label="Acara hari ini">
          <div className="events-heading">
            <Typography.Title level={3}>Acara Hari Ini</Typography.Title>
            <span>9 OKT</span>
          </div>

          <article className="event-card delivery">
            <div className="event-topline">
              <span>
                <Typography.Title level={4}>Ibu Maria</Typography.Title>
                <Typography.Text>PERSALINAN (HPL)</Typography.Text>
              </span>
              <strong>UTAMA</strong>
            </div>
            <div className="prep-card">
              <img src={asset('prep.svg')} alt="" />
              <span>
                <Typography.Text className="prep-label">BUTUH PERSIAPAN:</Typography.Text>
                <Typography.Text className="prep-copy">Oksitosin, Spuit, Benang Jahit</Typography.Text>
              </span>
            </div>
            <Button type="primary" className="prepare-button">
              Siapkan Tindakan
            </Button>
          </article>

          <article className="event-card risk">
            <Typography.Title level={4}>Ibu Anisa</Typography.Title>
            <Typography.Text className="risk-label">KONTROL RISIKO TINGGI</Typography.Text>
            <div className="event-time">
              <img src={asset('time.svg')} alt="" />
              <Typography.Text>Pukul 14:00 WIB</Typography.Text>
            </div>
          </article>

          <article className="calendar-note-card">
            <img src={asset('clinic-interior.png')} alt="Interior klinik" />
            <div className="calendar-note-overlay" />
            <div className="calendar-note-copy">
              <Typography.Text>CATATAN BIDAN</Typography.Text>
              <Typography.Title level={4}>Pastikan stok spuit 5cc tersedia untuk pekan depan.</Typography.Title>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
