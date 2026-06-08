'use client';

import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { getLplpoRows } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './medicine.module.css';

type MedicationStatus = 'safe' | 'warning' | 'critical';

type MedicationRow = {
  slug: string;
  name: string;
  stock: number;
  unit: string;
  estimatedEmpty: string;
  status: MedicationStatus;
  lastUpdated: string;
};

const medications: MedicationRow[] = [
  { slug: 'oxytocin-10iu', name: 'Oxytocin 10IU', stock: 50, unit: 'ampul', estimatedEmpty: '28+ days', status: 'safe', lastUpdated: 'Today' },
  { slug: 'mgso4-40', name: 'MgSO4 40%', stock: 18, unit: 'vial', estimatedEmpty: '~6 days', status: 'warning', lastUpdated: '2 days ago' },
  { slug: 'tablet-fe-60mg', name: 'Tablet Fe 60mg', stock: 5, unit: 'strip', estimatedEmpty: '~2 days', status: 'critical', lastUpdated: '3 days ago' },
  { slug: 'nifedipine', name: 'Nifedipine', stock: 120, unit: 'tab', estimatedEmpty: '30+ days', status: 'safe', lastUpdated: 'Yesterday' },
  { slug: 'misoprostol', name: 'Misoprostol', stock: 45, unit: 'tab', estimatedEmpty: '20+ days', status: 'safe', lastUpdated: '4 days ago' },
];

const statusLabel: Record<MedicationStatus, string> = {
  safe: 'SAFE',
  warning: 'WARNING',
  critical: 'CRITICAL',
};

export function MedicineNeedsContent() {
  const [activeModal, setActiveModal] = useState<'edit' | 'shipment' | 'upload' | null>(null);
  const [rows, setRows] = useState<MedicationRow[]>(medications);
  const [selectedMedication, setSelectedMedication] = useState<MedicationRow>(medications[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLplpoRows({ puskesmasId: 'PKM-001', periode: '2026-06-01' })
      .then((lplpoRows) => {
        if (!lplpoRows.length) return;
        const mappedRows = lplpoRows.map((row) => ({
          slug: row.obatId.toLowerCase(),
          name: row.obatId,
          stock: row.jumlahDiminta,
          unit: 'unit',
          estimatedEmpty: row.daysOfStock ? `${Math.round(row.daysOfStock)} days` : 'Needs review',
          status: row.jumlahDiminta > 20 ? 'critical' as const : row.jumlahDiminta > 0 ? 'warning' as const : 'safe' as const,
          lastUpdated: new Date(row.periode).toLocaleDateString('id-ID'),
        }));
        setRows(mappedRows);
        setSelectedMedication(mappedRows[0]);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Gagal memuat LPLPO'));
  }, []);

  const closeModal = () => setActiveModal(null);

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
        <button type="button" className={styles.uploadBox} onClick={() => setActiveModal('upload')}>
          <AppIcon name="fileText" width={18} height={18} />
          Upload Medication List Document
        </button>

        <div className={styles.divider}><span>Or</span></div>

        <div className={styles.formGrid}>
          <label className={styles.fieldGroup}>
            <span>Medication Name</span>
            <select defaultValue="">
              <option value="" disabled>Select Medication...</option>
              {rows.map((item) => <option key={item.name}>{item.name}</option>)}
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
              {rows.map((item) => (
                <tr key={item.name}>
                  <td data-label="Medication Name"><strong>{item.name}</strong></td>
                  <td data-label="Stock">{item.stock}</td>
                  <td data-label="Unit">{item.unit}</td>
                  <td data-label="Estimated Empty"><span className={styles[item.status]}>{item.estimatedEmpty}</span></td>
                  <td data-label="Status"><span className={`${styles.statusPill} ${styles[`${item.status}Pill`]}`}>{statusLabel[item.status]}</span></td>
                  <td data-label="Last Updated">{item.lastUpdated}</td>
                  <td data-label="Action">
                    <div className={styles.rowActions}>
                      <Link href={`${routes.medicineNeeds}/${item.slug}`} aria-label={`View ${item.name}`}><AppIcon name="eye" width={16} height={16} /></Link>
                      <button
                        type="button"
                        aria-label={`Edit ${item.name}`}
                        onClick={() => {
                          setSelectedMedication(item);
                          setActiveModal('edit');
                        }}
                      >
                        <AppIcon name="edit" width={16} height={16} />
                      </button>
                      <button
                        type="button"
                        className={item.status === 'critical' ? styles.requestCritical : styles.requestButton}
                        onClick={() => {
                          setSelectedMedication(item);
                          setActiveModal('shipment');
                        }}
                      >
                        Request Shipment
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className={styles.pagination}>
          <p>Showing {rows.length} entries</p>
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

      {error ? <p className={styles.medicineError}>{error}</p> : null}

      {activeModal === 'edit' ? <EditStockModal item={selectedMedication} onClose={closeModal} /> : null}
      {activeModal === 'shipment' ? <RequestShipmentModal item={selectedMedication} onClose={closeModal} /> : null}
      {activeModal === 'upload' ? <UploadMedicationModal onClose={closeModal} /> : null}
    </PageContainer>
  );
}

function ModalShell({ children }: { children: ReactNode }) {
  return <div className={styles.modalOverlay}>{children}</div>;
}

function ModalCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" className={styles.modalClose} aria-label="Close modal" onClick={onClose}>
      <AppIcon name="x" width={22} height={22} />
    </button>
  );
}

function EditStockModal({ item, onClose }: { item: MedicationRow; onClose: () => void }) {
  return (
    <ModalShell>
      <section className={styles.editModal} role="dialog" aria-modal="true" aria-labelledby="edit-stock-title">
        <header className={styles.modalHeaderLarge}>
          <h2 id="edit-stock-title">Edit Stock</h2>
          <ModalCloseButton onClose={onClose} />
        </header>
        <div className={styles.editModalBody}>
          <div>
            <span className={styles.modalEyebrow}>Medicine Name</span>
            <strong>{item.name}</strong>
          </div>
          <label className={styles.stockField}>
            <span>Amount</span>
            <span className={styles.stockInputRow}>
              <input defaultValue={item.stock} inputMode="numeric" />
              <span>{item.unit === 'ampul' ? 'ampoule' : item.unit}</span>
            </span>
          </label>
        </div>
        <footer className={styles.modalFooter}>
          <button type="button" className={styles.modalGhostButton} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.modalPrimaryButton} onClick={onClose}>Save</button>
        </footer>
      </section>
    </ModalShell>
  );
}

function RequestShipmentModal({ item, onClose }: { item: MedicationRow; onClose: () => void }) {
  const isCritical = item.status === 'critical';

  return (
    <ModalShell>
      <section className={styles.shipmentModal} role="dialog" aria-modal="true" aria-labelledby="shipment-title">
        <header className={styles.shipmentHeader}>
          <div className={styles.shipmentTitleWrap}>
            <span className={styles.shipmentIcon}><AppIcon name="package" width={24} height={24} /></span>
            <div>
              <h2 id="shipment-title">Request Shipment</h2>
              <p>{item.name}</p>
            </div>
          </div>
          <ModalCloseButton onClose={onClose} />
        </header>
        <div className={styles.shipmentBody}>
          <div className={isCritical ? styles.criticalAlert : styles.safeAlert}>
            <AppIcon name={isCritical ? 'alert' : 'info'} width={18} height={18} />
            <p>{isCritical ? 'Critical stock - estimated to run out in ~2 days' : 'Current stock is still safe. Requests can still be submitted but require a reason.'}</p>
          </div>

          <label className={styles.quantityField}>
            <span className={styles.modalEyebrow}>Requested Quantity</span>
            <span className={styles.quantityInputRow}>
              <input defaultValue={isCritical ? 100 : item.stock} inputMode="numeric" />
              <span>{item.unit}</span>
            </span>
            <em>Current stock: {item.stock} {item.unit} · Enough for {item.estimatedEmpty} · Average use: 2.5 {item.unit}/day</em>
          </label>

          <label className={styles.notesField}>
            <span className={styles.labelRow}>
              <span className={styles.modalEyebrow}>{isCritical ? 'Additional Notes (Optional)' : 'Reason For Request'}</span>
              {!isCritical ? <b>Required</b> : null}
            </span>
            <textarea placeholder={isCritical ? 'e.g., please include new usage brochures' : 'e.g., anticipating 8 pregnant women with EDD next month'} />
            {!isCritical ? <span className={styles.validationText}><AppIcon name="alert" width={14} height={14} />Reason must be filled for safe stock requests</span> : null}
          </label>
        </div>
        <footer className={styles.shipmentFooter}>
          <button type="button" className={styles.shipmentCancel} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.shipmentSubmit} onClick={onClose}>Submit Request</button>
        </footer>
      </section>
    </ModalShell>
  );
}

function UploadMedicationModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell>
      <section className={styles.uploadModal} role="dialog" aria-modal="true" aria-labelledby="upload-title">
        <header className={styles.uploadModalHeader}>
          <h2 id="upload-title">Upload &amp; Extract Document</h2>
          <ModalCloseButton onClose={onClose} />
        </header>
        <div className={styles.uploadModalBody}>
          <section className={styles.uploadStep}>
            <h3>Step 1: Upload Successful</h3>
            <div className={styles.uploadSuccessCard}>
              <span><AppIcon name="fileText" width={24} height={24} /></span>
              <div><strong>Laporan_Stok_Mei_2024.pdf</strong><small>1.2 MB</small></div>
              <AppIcon name="checkCircle" width={24} height={24} />
            </div>
          </section>
          <section className={styles.uploadStep}>
            <div className={styles.stepHeader}><h3>Step 2: AI Analysis</h3><strong>75%</strong></div>
            <div className={styles.progressTrack}><span /></div>
            <em>Extracting Data...</em>
          </section>
          <section className={styles.uploadStep}>
            <div className={styles.stepHeader}><h3>Step 3: Extraction Result</h3><b>AI Assisted</b></div>
            <div className={styles.extractTableWrap}>
              <table className={styles.extractTable}>
                <thead><tr><th>Medication Name</th><th>Total</th></tr></thead>
                <tbody>
                  <tr><td>Oxytocin</td><td>50 units</td></tr>
                  <tr><td>MgSO4</td><td>18 units</td></tr>
                  <tr><td>Tablet Fe</td><td>5 units</td></tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <footer className={styles.uploadFooter}>
          <button type="button" className={styles.modalGhostButton} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.modalPrimaryButton} onClick={onClose}>Confirm &amp; Enter into Form</button>
        </footer>
      </section>
    </ModalShell>
  );
}
