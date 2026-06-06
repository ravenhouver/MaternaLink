import Button from 'antd/es/button';
import Table from 'antd/es/table';
import type { ColumnsType } from 'antd/es/table';
import Typography from 'antd/es/typography';
import { StatusPill } from '@/components/ui/status-pill';
import type { Patient, PatientRisk } from '../patients-data';
import styles from '../patients.module.css';

type PatientsTableProps = {
  patients: Patient[];
};

const columns: ColumnsType<Patient> = [
  {
    title: 'NAMA',
    dataIndex: 'name',
    width: 210,
    render: (_, patient) => (
      <div className={styles.nameCell}>
        <span className={styles.avatar}>{patient.initials}</span>
        <span className={styles.identity}>
          <Typography.Text className={styles.patientName}>{patient.name}</Typography.Text>
          <Typography.Text className={styles.patientId}>ID: {patient.id}</Typography.Text>
        </span>
      </div>
    ),
  },
  {
    title: 'USIA\nKEHAMILAN',
    dataIndex: 'gestationalAge',
    width: 150,
    render: (age: number) => (
      <span className={styles.gestationCell}>
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
      <span className={styles.dueCell}>
        <strong>{patient.dueDate}</strong>
        <span className={patient.dueHint.includes('Trimester') ? styles.neutral : styles.urgent}>{patient.dueHint}</span>
      </span>
    ),
  },
  {
    title: 'KUNJUNGAN\nANC',
    dataIndex: 'ancDone',
    width: 160,
    render: (_, patient) => (
      <span className={styles.ancStack}>
        {Array.from({ length: patient.ancDone }, (_, index) => (
          <span className={styles.ancDot} key={index}>
            ANC
            <br />
            {index + 1}
          </span>
        ))}
        {patient.ancExtra ? <span className={[styles.ancDot, styles.ancDotMuted].join(' ')}>+{patient.ancExtra}</span> : null}
      </span>
    ),
  },
  {
    title: 'STATUS RISIKO',
    dataIndex: 'risk',
    width: 170,
    render: (risk: PatientRisk) => <StatusPill tone={risk === 'high' ? 'red' : 'blue'}>{risk === 'high' ? 'RISIKO TINGGI' : 'NORMAL'}</StatusPill>,
  },
  {
    title: 'AKSI',
    dataIndex: 'action',
    align: 'right',
    width: 140,
    render: () => <Button className={styles.detailButton}>Lihat Detail</Button>,
  },
];

export function PatientsTable({ patients }: PatientsTableProps) {
  return <Table<Patient> className={styles.table} columns={columns} dataSource={patients} pagination={false} rowKey="key" scroll={{ x: 900 }} />;
}
