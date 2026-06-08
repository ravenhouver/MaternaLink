'use client';

import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import styles from './medicine.module.css';

type MedicationStatus = 'safe' | 'warning' | 'critical';

type MedicationRow = {
  name: string;
  stock: number;
  unit: string;
  estimatedEmpty: string;
  status: MedicationStatus;
  lastUpdated: string;
};

const medications: MedicationRow[] = [
  { name: 'Oxytocin 10IU', stock: 50, unit: 'ampul', estimatedEmpty: '28+ days', status: 'safe', lastUpdated: 'Today' },
  { name: 'MgSO4 40%', stock: 18, unit: 'vial', estimatedEmpty: '~6 days', status: 'warning', lastUpdated: '2 days ago' },
  { name: 'Tablet Fe 60mg', stock: 5, unit: 'strip', estimatedEmpty: '~2 days', status: 'critical', lastUpdated: '3 days ago' },
  { name: 'Nifedipine', stock: 120, unit: 'tab', estimatedEmpty: '30+ days', status: 'safe', lastUpdated: 'Yesterday' },
  { name: 'Misoprostol', stock: 45, unit: 'tab', estimatedEmpty: '20+ days', status: 'safe', lastUpdated: '4 days ago' },
];

const statusLabel: Record<MedicationStatus, string> = {
  safe: 'SAFE',
  warning: 'WARNING',
  critical: 'CRITICAL',
};

export function MedicineNeedsContent() {
  return (
    <PageContainer size="wide" className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Medication Needs</h1>
          <p>Monitor and update maternal medication availability in real-time</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryButton}>
            <AppIcon name="clock" width={18} height={18} />
            History Log
          </button>
          <button type="button" className={styles.secondaryButton}>
            <AppIcon name="upload" width={18} height={18} />
            Download Report
          </button>
        </div>
      </header>

      <section className={styles.inputCard} aria-label="Update medication stock">
        <button type="button" className={styles.uploadBox}>
          <AppIcon name="fileText" width={18} height={18} />
          Upload Medication List Document
        </button>

        <div className={styles.divider}><span>Or</span></div>

        <div className={styles.formGrid}>
          <label className={styles.fieldGroup}>
            <span>Medication Name</span>
            <select defaultValue="">
              <option value="" disabled>Select Medication...</option>
              {medications.map((item) => <option key={item.name}>{item.name}</option>)}
            </select>
          </label>
          <label className={styles.fieldGroup}>
            <span>Quantity</span>
            <input defaultValue="0" inputMode="numeric" />
          </label>
          <label className={styles.fieldGroup}>
            <span>Unit</span>
            <select defaultValue="Ampul">
              <option>Ampul</option>
              <option>Vial</option>
              <option>Strip</option>
              <option>Tab</option>
            </select>
          </label>
          <button type="button" className={styles.addButton}>
            <AppIcon name="plus" width={18} height={18} />
            Add
          </button>
        </div>
      </section>

      <section className={styles.tableCard} aria-label="Medication stock table">
        <div className={styles.tableScroll}>
          <table className={styles.medicationTable}>
            <thead>
              <tr>
                <th>Medication Name</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Estimated Empty</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {medications.map((item) => (
                <tr key={item.name}>
                  <td data-label="Medication Name"><strong>{item.name}</strong></td>
                  <td data-label="Stock">{item.stock}</td>
                  <td data-label="Unit">{item.unit}</td>
                  <td data-label="Estimated Empty"><span className={styles[item.status]}>{item.estimatedEmpty}</span></td>
                  <td data-label="Status"><span className={`${styles.statusPill} ${styles[`${item.status}Pill`]}`}>{statusLabel[item.status]}</span></td>
                  <td data-label="Last Updated">{item.lastUpdated}</td>
                  <td data-label="Action">
                    <div className={styles.rowActions}>
                      <button type="button" aria-label={`View ${item.name}`}><AppIcon name="eye" width={16} height={16} /></button>
                      <button type="button" aria-label={`Edit ${item.name}`}><AppIcon name="edit" width={16} height={16} /></button>
                      <button type="button" className={item.status === 'critical' ? styles.requestCritical : styles.requestButton}>Request Shipment</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className={styles.pagination}>
          <p>Showing 5 from 42 entries</p>
          <div className={styles.paginationControls}>
            <button type="button" aria-label="Previous page"><AppIcon name="chevronLeft" width={16} height={16} /></button>
            <button type="button" aria-current="page">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button" aria-label="Next page"><AppIcon name="chevronRight" width={16} height={16} /></button>
          </div>
        </footer>
      </section>

      <button type="button" className={styles.saveButton}>
        <AppIcon name="fileText" width={18} height={18} />
        Save Stock Update
      </button>
    </PageContainer>
  );
}
