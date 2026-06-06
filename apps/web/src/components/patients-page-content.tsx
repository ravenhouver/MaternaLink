'use client';

import Button from 'antd/es/button';
import Input from 'antd/es/input';
import Table from 'antd/es/table';
import type { ColumnsType } from 'antd/es/table';
import Typography from 'antd/es/typography';

type PatientRisk = 'high' | 'normal';

type Patient = {
  key: string;
  initials: string;
  name: string;
  id: string;
  gestationalAge: number;
  dueDate: string;
  dueHint: string;
  ancDone: number;
  ancExtra?: number;
  risk: PatientRisk;
};

const patients: Patient[] = [
  {
    key: 'maria',
    initials: 'MB',
    name: 'Ibu Maria',
    id: 'ML-2024-001',
    gestationalAge: 32,
    dueDate: '12 Feb 2024',
    dueHint: '7 hari lagi',
    ancDone: 3,
    ancExtra: 2,
    risk: 'high',
  },
  {
    key: 'siti',
    initials: 'IS',
    name: 'Ibu Siti',
    id: 'ML-2024-042',
    gestationalAge: 14,
    dueDate: '20 Jun 2024',
    dueHint: 'Trimester 2',
    ancDone: 1,
    risk: 'normal',
  },
  {
    key: 'ani',
    initials: 'AW',
    name: 'Ibu Ani Wijaya',
    id: 'ML-2024-105',
    gestationalAge: 38,
    dueDate: '05 Feb 2024',
    dueHint: 'Besok!',
    ancDone: 4,
    risk: 'normal',
  },
];

const columns: ColumnsType<Patient> = [
  {
    title: 'NAMA',
    dataIndex: 'name',
    width: 210,
    render: (_, patient) => (
      <div className="patient-name-cell">
        <span className="patient-avatar">{patient.initials}</span>
        <span className="patient-identity">
          <Typography.Text className="patient-name">{patient.name}</Typography.Text>
          <Typography.Text className="patient-id">ID: {patient.id}</Typography.Text>
        </span>
      </div>
    ),
  },
  {
    title: 'USIA\nKEHAMILAN',
    dataIndex: 'gestationalAge',
    width: 150,
    render: (age: number) => (
      <span className="gestation-cell">
        <strong>{age}</strong>
        <span>minggu</span>
      </span>
    ),
  },
  {
    title: 'HPL',
    dataIndex: 'dueDate',
    width: 130,
    render: (_, patient) => (
      <span className="due-cell">
        <strong>{patient.dueDate}</strong>
        <span className={patient.dueHint.includes('Trimester') ? 'neutral' : 'urgent'}>{patient.dueHint}</span>
      </span>
    ),
  },
  {
    title: 'KUNJUNGAN\nANC',
    dataIndex: 'ancDone',
    width: 160,
    render: (_, patient) => (
      <span className="anc-stack">
        {Array.from({ length: patient.ancDone }, (_, index) => (
          <span className="anc-dot" key={index}>
            ANC
            <br />
            {index + 1}
          </span>
        ))}
        {patient.ancExtra ? <span className="anc-dot muted">+{patient.ancExtra}</span> : null}
      </span>
    ),
  },
  {
    title: 'STATUS RISIKO',
    dataIndex: 'risk',
    width: 170,
    render: (risk: PatientRisk) => <span className={`risk-pill ${risk}`}>{risk === 'high' ? 'RISIKO TINGGI' : 'NORMAL'}</span>,
  },
  {
    title: 'AKSI',
    dataIndex: 'action',
    align: 'right',
    width: 140,
    render: () => <Button className="detail-button">Lihat Detail</Button>,
  },
];

export function PatientsPageContent() {
  return (
    <main className="patients-page">
      <section className="patients-hero">
        <div>
          <Typography.Title level={1} className="patients-title">
            Daftar Pasien
          </Typography.Title>
          <Typography.Paragraph className="patients-subtitle">
            Kelola data ibu hamil, pantau status risiko, dan jadwal persalinan dalam satu pandangan terpadu.
          </Typography.Paragraph>
        </div>
        <Button type="primary" className="add-patient-button" href="/master/add-patient">
          <img src="/figma-patients/add-patient-white.svg" alt="" />
          Tambah Pasien Baru
        </Button>
      </section>

      <section className="patients-filters" aria-label="Cari dan filter pasien">
        <div className="patient-search-wrap">
          <Input className="patient-search" prefix={<img src="/figma-patients/search.svg" alt="" />} placeholder="Cari nama pasien..." />
        </div>
        <div className="filter-tabs" role="tablist" aria-label="Filter pasien">
          {['Semua', 'HPL Bulan Depan', 'Risiko Tinggi', 'HPL Bulan Ini'].map((item) => (
            <button type="button" role="tab" aria-selected={item === 'Semua'} className={item === 'Semua' ? 'active' : ''} key={item}>
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="patients-table-card">
        <Table<Patient>
          className="patients-table"
          columns={columns}
          dataSource={patients}
          pagination={false}
          rowKey="key"
          scroll={{ x: 900 }}
        />
        <div className="patients-pagination">
          <Typography.Text>Menampilkan 1-3 dari 124 pasien</Typography.Text>
          <div className="pagination-controls">
            <Button className="page-button" aria-label="Sebelumnya">
              <img src="/figma-patients/page-prev.svg" alt="" />
            </Button>
            <Button className="page-button active">1</Button>
            <Button className="page-button">2</Button>
            <Button className="page-button">3</Button>
            <Button className="page-button" aria-label="Berikutnya">
              <img src="/figma-patients/page-next.svg" alt="" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
