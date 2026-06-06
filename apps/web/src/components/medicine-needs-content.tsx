'use client';

import Button from 'antd/es/button';
import Input from 'antd/es/input';
import Typography from 'antd/es/typography';

const { TextArea } = Input;

const asset = (name: string) => `/figma-medicine/${name}`;

type MedicineStatus = 'safe' | 'warning' | 'danger';

type MedicineItem = {
  name: string;
  need: string;
  status: MedicineStatus;
  label: string;
};

type MedicineSection = {
  title: string;
  emoji: string;
  icon: string;
  items: MedicineItem[];
};

const sections: MedicineSection[] = [
  {
    title: 'ANC Kit',
    emoji: '💊',
    icon: 'anc-kit.svg',
    items: [
      { name: 'Tablet Tambah Darah', need: 'Kebutuhan: 360 Butir', status: 'safe', label: 'Cukup' },
      { name: 'Asam Folat', need: 'Kebutuhan: 120 Butir', status: 'safe', label: 'Cukup' },
    ],
  },
  {
    title: 'Persalinan Kit',
    emoji: '🩺',
    icon: 'delivery-kit.svg',
    items: [
      { name: 'Oksitosin', need: 'Kebutuhan: 50 Ampul', status: 'danger', label: 'Perlu Restok' },
      { name: 'Lidocaine', need: 'Kebutuhan: 20 Ampul', status: 'warning', label: 'Hampir Habis' },
    ],
  },
  {
    title: 'Buffer Darurat',
    emoji: '⚠️',
    icon: 'buffer-kit.svg',
    items: [
      { name: 'MgSO4', need: 'Kebutuhan: 10 Vial', status: 'safe', label: 'Cukup' },
      { name: 'Cairan Infus', need: 'Kebutuhan: 15 Botol', status: 'safe', label: 'Cukup' },
    ],
  },
];

export function MedicineNeedsContent() {
  return (
    <main className="medicine-page">
      <nav className="medicine-breadcrumb" aria-label="Breadcrumb">
        <span>Beranda</span>
        <img src={asset('breadcrumb-chevron.svg')} alt="" />
        <strong>Kebutuhan Obat</strong>
      </nav>

      <section className="medicine-heading">
        <Typography.Title level={1}>Prediksi Kebutuhan Obat — Januari 2026</Typography.Title>
        <div className="medicine-insight">
          <img src={asset('info.svg')} alt="" />
          <Typography.Text>Berdasarkan 5 persalinan, 12 kunjungan ANC, dan 3 pasien risiko tinggi yang diprediksi</Typography.Text>
        </div>
      </section>

      <section className="medicine-grid" aria-label="Daftar kebutuhan obat">
        {sections.map((section) => (
          <article className="medicine-section" key={section.title}>
            <div className="medicine-section-inner">
              <div className="medicine-section-title">
                <span className="medicine-section-icon">
                  <img src={asset(section.icon)} alt="" />
                </span>
                <Typography.Title level={2}>
                  <span aria-hidden="true">{section.emoji}</span> {section.title}
                </Typography.Title>
              </div>

              <div className="medicine-items">
                {section.items.map((item) => (
                  <div className={`medicine-item ${item.status}`} key={item.name}>
                    <span className="medicine-copy">
                      <Typography.Title level={3}>{item.name}</Typography.Title>
                      <Typography.Text>{item.need}</Typography.Text>
                    </span>
                    <span className={`medicine-status ${item.status}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="submission-card">
        <div className="submission-inner">
          <Typography.Title level={3}>Finalisasi Laporan Kebutuhan</Typography.Title>
          <label className="submission-label" htmlFor="medicine-note">
            Tambahkan catatan untuk dinas kesehatan
          </label>
          <TextArea
            id="medicine-note"
            className="submission-textarea"
            placeholder="Misal: Prioritaskan pengiriman Oksitosin karena stok saat ini kritis..."
            rows={3}
          />
          <Button type="primary" className="submit-medicine-button">
            <img src={asset('send.svg')} alt="" />
            Kirim ke Dinas
          </Button>
        </div>
      </section>
    </main>
  );
}
