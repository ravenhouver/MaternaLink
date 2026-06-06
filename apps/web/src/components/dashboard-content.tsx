'use client';

import Button from 'antd/es/button';
import Card from 'antd/es/card';
import Col from 'antd/es/col';
import Row from 'antd/es/row';
import Tag from 'antd/es/tag';
import Typography from 'antd/es/typography';

const asset = (name: string) => `/figma-dashboard/${name}`;

const stats = [
  {
    label: 'TOTAL PASIEN\nTERDAFTAR',
    value: '42',
    icon: 'patients.svg',
    accent: '#1a73e8',
    tag: '+4 bulan ini',
  },
  {
    label: 'PERSALINAN BULAN INI',
    value: '8',
    icon: 'delivery.svg',
    accent: '#006948',
    tag: 'Normal',
  },
  {
    label: 'PASIEN RISIKO TINGGI',
    value: '5',
    icon: 'risk.svg',
    accent: '#a33d23',
    tag: 'Butuh Pantauan',
  },
  {
    label: 'OBAT PERLU RESTOK',
    value: '3',
    icon: 'stock.svg',
    accent: '#f59e0b',
    tag: 'Kritis',
  },
];

const quickActions = [
  { label: '+ Pasien Baru', icon: 'add-patient.svg', active: true },
  { label: 'Kalender', icon: 'calendar.svg' },
  { label: 'Daftar Obat', icon: 'medicine.svg' },
  { label: 'Daftar Pasien', icon: 'clipboard.svg' },
];

const activities = [
  {
    name: 'Ibu Maria',
    title: 'Kunjungan ANC',
    meta: '10 Menit yang lalu - Pemeriksaan rutin trimester 2',
    icon: 'activity-anc.svg',
    background: '#eff6ff',
  },
  {
    name: 'Ibu Siti',
    title: 'Data Risiko Diperbarui',
    meta: '1 Jam yang lalu - Tekanan darah meningkat (140/90)',
    icon: 'activity-risk.svg',
    background: '#fef2f2',
  },
  {
    name: 'Ibu Rahayu',
    title: 'Hasil Laboratorium',
    meta: '3 Jam yang lalu - Hemoglobin: 11.5 g/dL (Normal)',
    icon: 'activity-lab.svg',
    background: '#f0fdf4',
  },
];

export function DashboardContent() {
  return (
    <main className="dashboard-page">
      <section className="dashboard-header" aria-label="Ringkasan halaman">
        <div>
          <Typography.Title level={2} className="dashboard-title">
            Selamat datang, Bidan Sari
          </Typography.Title>
          <Typography.Text className="dashboard-subtitle">Laporan aktivitas Klinik Sejahtera hari ini.</Typography.Text>
        </div>

        <div className="header-actions">
          <Button className="notification-button" shape="circle" aria-label="Notifikasi">
            <img src={asset('bell.svg')} alt="" />
          </Button>
          <div className="clinic-pill" aria-label="Profil klinik">
            <span>Klinik Sejahtera</span>
            <span className="clinic-avatar">KS</span>
          </div>
        </div>
      </section>

      <section className="alert-banner" aria-label="Pasien HPL minggu ini">
        <div className="alert-copy">
          <span className="alert-icon">
            <img src={asset('alert.svg')} alt="" />
          </span>
          <span>
            <Typography.Text className="alert-title">2 pasien HPL minggu ini</Typography.Text>
            <Typography.Text className="alert-subtitle">Cek ketersediaan daftar obat dan perlengkapan sekarang.</Typography.Text>
          </span>
        </div>
        <Button className="alert-button" type="default">
          Periksa Sekarang
        </Button>
      </section>

      <Row gutter={[24, 24]} className="stats-grid">
        {stats.map((item) => (
          <Col xs={24} sm={12} xl={6} key={item.label}>
            <Card className="stat-card" style={{ borderTopColor: item.accent }}>
              <div className="stat-topline">
                <img src={asset(item.icon)} alt="" className="stat-icon" />
                <Tag className="stat-tag" style={{ color: item.accent, backgroundColor: `${item.accent}1A` }}>
                  {item.tag}
                </Tag>
              </div>
              <Typography.Text className="stat-label">
                {item.label.split('\n').map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </Typography.Text>
              <Typography.Title level={3} className="stat-value">
                {item.value}
              </Typography.Title>
            </Card>
          </Col>
        ))}
      </Row>

      <section className="content-grid">
        <div className="quick-column">
          <div className="section-heading with-icon">
            <img src={asset('bolt.svg')} alt="" />
            <Typography.Title level={3}>Aksi Cepat</Typography.Title>
          </div>

          <div className="quick-grid">
            {quickActions.map((item) => (
              <button className="quick-action" type="button" key={item.label}>
                <span className={`quick-icon${item.active ? ' active' : ''}`}>
                  <img src={asset(item.icon)} alt="" />
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="activity-column">
          <div className="section-heading activity-heading">
            <Typography.Title level={3}>Aktivitas Terkini</Typography.Title>
            <Button type="link" className="view-all-button">
              Lihat Semua
            </Button>
          </div>

          <Card className="activity-card" styles={{ body: { padding: 0 } }}>
            {activities.map((item) => (
              <button className="activity-row" type="button" key={item.name}>
                <span className="activity-icon" style={{ backgroundColor: item.background }}>
                  <img src={asset(item.icon)} alt="" />
                </span>
                <span className="activity-copy">
                  <Typography.Text className="activity-title">
                    <strong>{item.name}</strong> - {item.title}
                  </Typography.Text>
                  <Typography.Text className="activity-meta">{item.meta}</Typography.Text>
                </span>
                <img src={asset('chevron.svg')} alt="" className="activity-chevron" />
              </button>
            ))}
          </Card>
        </div>
      </section>

      <Button className="floating-action" shape="circle" type="primary" aria-label="Tambah data">
        <img src={asset('plus.svg')} alt="" />
      </Button>
    </main>
  );
}
