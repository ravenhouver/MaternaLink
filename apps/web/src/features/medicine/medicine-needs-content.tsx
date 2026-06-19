'use client';

import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getObat, getStokRows, upsertStok, type ObatRecord } from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './medicine.module.css';

type MedicationStatus = 'safe' | 'warning' | 'critical';

type MedicationRow = {
  obatId: string;
  slug: string;
  name: string;
  stock: number;
  unit: string;
  estimatedEmpty: string;
  status: MedicationStatus;
  lastUpdated: string;
};

const DEFAULT_PUSKESMAS_ID = 'PKM-001';
const DEFAULT_PERIOD = '2026-06-01';

const statusLabel: Record<MedicationStatus, string> = {
  safe: 'SAFE',
  warning: 'WARNING',
  critical: 'CRITICAL',
};

function isMedicationRow(row: MedicationRow | null | undefined): row is MedicationRow {
  return Boolean(row?.slug && row.name && row.status);
}

export function MedicineNeedsContent() {
  const [activeModal, setActiveModal] = useState<'edit' | 'shipment' | null>(null);
  const [rows, setRows] = useState<MedicationRow[]>([]);
  const [obatRows, setObatRows] = useState<ObatRecord[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<MedicationRow | null>(null);
  const [selectedObatId, setSelectedObatId] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refreshRows() {
    setError(null);
    try {
      const [stockRows, medicines] = await Promise.all([getStokRows({ puskesmasId: DEFAULT_PUSKESMAS_ID, periode: DEFAULT_PERIOD }), getObat()]);
      setObatRows(medicines);
      const mappedRows = stockRows.map((row) => {
        const stock = row.stokSaatIni;
        const dailyUse = row.konsumsiPeriode > 0 ? row.konsumsiPeriode / 30 : 0;
        const days = dailyUse > 0 ? stock / dailyUse : null;
        const status: MedicationStatus = stock <= 5 ? 'critical' : stock <= 20 ? 'warning' : 'safe';
        return {
          obatId: row.obatId,
          slug: row.obatId.toLowerCase(),
          name: row.obat?.nama ?? row.obatId,
          stock,
          unit: row.obat?.satuan ?? 'unit',
          estimatedEmpty: days == null ? 'No usage data' : `${Math.max(1, Math.round(days))} days`,
          status,
          lastUpdated: new Date(row.periode).toLocaleDateString('id-ID'),
        };
      });
      setRows(mappedRows);
      setSelectedMedication((current) => current ?? mappedRows[0] ?? null);
      setSelectedObatId((current) => current || medicines[0]?.id || '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat stok obat');
    }
  }

  useEffect(() => {
    void refreshRows();
  }, []);

  const selectedObat = useMemo(() => obatRows.find((item) => item.id === selectedObatId), [obatRows, selectedObatId]);
  const closeModal = () => setActiveModal(null);
  const safeRows = rows.filter(isMedicationRow);

  async function saveStock() {
    if (!selectedObatId) {
      setError('Pilih obat terlebih dahulu.');
      return;
    }
    const value = Number(quantity);
    if (!Number.isFinite(value) || value < 0) {
      setError('Jumlah stok harus angka valid.');
      return;
    }
    try {
      await upsertStok({ puskesmasId: DEFAULT_PUSKESMAS_ID, obatId: selectedObatId, periode: DEFAULT_PERIOD, stokAwal: value, konsumsiPeriode: 0, stokSaatIni: value });
      setQuantity('0');
      await refreshRows();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan stok');
    }
  }

  async function saveMedicationStock(item: MedicationRow, nextQuantity: number) {
    if (!Number.isFinite(nextQuantity) || nextQuantity < 0) {
      setError('Jumlah stok harus angka valid.');
      return;
    }
    try {
      await upsertStok({ puskesmasId: DEFAULT_PUSKESMAS_ID, obatId: item.obatId, periode: DEFAULT_PERIOD, stokAwal: nextQuantity, konsumsiPeriode: 0, stokSaatIni: nextQuantity });
      closeModal();
      await refreshRows();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan stok');
    }
  }

  function explainUnavailable(feature: string) {
    setNotice(`${feature} akan diaktifkan pada batch integrasi data berikutnya.`);
  }

  return (
    <PageContainer size="wide" className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Medication Needs</h1>
          <p>Monitor and update maternal medication availability in real-time</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryButton} onClick={() => void refreshRows()}>
            <AppIcon name="clock" width={18} height={18} />
            Refresh
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => window.print()}>
            <AppIcon name="upload" width={18} height={18} />
            Print Report
          </button>
        </div>
      </header>

      <section className={styles.inputCard} aria-label="Update medication stock">
        <div className={styles.formGrid}>
          <label className={styles.fieldGroup}>
            <span>Medication Name</span>
            <select value={selectedObatId} onChange={(event) => setSelectedObatId(event.target.value)}>
              <option value="" disabled>Select Medication...</option>
              {obatRows.map((item) => <option value={item.id} key={item.id}>{item.nama}</option>)}
            </select>
          </label>
          <label className={styles.fieldGroup}>
            <span>Quantity</span>
            <input value={quantity} inputMode="numeric" onChange={(event) => setQuantity(event.target.value)} />
          </label>
          <label className={styles.fieldGroup}>
            <span>Unit</span>
            <select value={selectedObat?.satuan ?? 'unit'} disabled>
              <option>{selectedObat?.satuan ?? 'unit'}</option>
            </select>
          </label>
          <button type="button" className={styles.addButton} onClick={() => void saveStock()}>
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
              {safeRows.length === 0 ? <tr><td colSpan={7}>Belum ada stok tersimpan.</td></tr> : null}
              {safeRows.map((item) => (
                <tr key={item.slug}>
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
            <button type="button" aria-label="Previous page" disabled><AppIcon name="chevronLeft" width={16} height={16} /></button>
            <button type="button" aria-current="page">1</button>
            <button type="button" aria-label="Next page" disabled><AppIcon name="chevronRight" width={16} height={16} /></button>
          </div>
        </footer>
      </section>

      <button type="button" className={styles.saveButton} onClick={() => void saveStock()}>
        <AppIcon name="fileText" width={18} height={18} />
        Save Stock Update
      </button>

      {error ? <p className={styles.medicineError}>{error}</p> : null}
      {notice ? <p role="status" className={styles.medicineNotice}>{notice}</p> : null}

      {activeModal === 'edit' && selectedMedication ? <EditStockModal item={selectedMedication} onClose={closeModal} onSave={saveMedicationStock} /> : null}
      {activeModal === 'shipment' && selectedMedication ? <RequestShipmentModal item={selectedMedication} onClose={closeModal} onUnavailable={explainUnavailable} /> : null}
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

function EditStockModal({ item, onClose, onSave }: { item: MedicationRow; onClose: () => void; onSave: (item: MedicationRow, quantity: number) => void }) {
  const [draft, setDraft] = useState(String(item.stock));

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
              <input value={draft} inputMode="numeric" onChange={(event) => setDraft(event.target.value)} />
              <span>{item.unit === 'ampul' ? 'ampoule' : item.unit}</span>
            </span>
          </label>
        </div>
        <footer className={styles.modalFooter}>
          <button type="button" className={styles.modalGhostButton} onClick={onClose}>Cancel</button>
          <button type="button" className={styles.modalPrimaryButton} onClick={() => onSave(item, Number(draft))}>Save</button>
        </footer>
      </section>
    </ModalShell>
  );
}

function RequestShipmentModal({ item, onClose, onUnavailable }: { item: MedicationRow; onClose: () => void; onUnavailable: (feature: string) => void }) {
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
          <button type="button" className={styles.shipmentSubmit} onClick={() => { onClose(); onUnavailable(`Shipment request for ${item.name}`); }}>Submit Request</button>
        </footer>
      </section>
    </ModalShell>
  );
}

