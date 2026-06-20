'use client';

import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createShipmentRequest, generateLplpo, getCurrentUser, getLplpoRows, getObat, getStokRows, runAiForecast, upsertStok, type LplpoRow, type ObatRecord } from '@/lib/api';
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
  aiRecommendedQuantity?: number;
  aiJustification?: string;
};

function getCurrentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function isMedicationRow(row: MedicationRow | null | undefined): row is MedicationRow {
  return Boolean(row?.slug && row.name && row.status);
}

function printMedicineReport(rows: MedicationRow[], puskesmasId: string | null, period: string, labels: Record<string, string>) {
  const popup = window.open('', '_blank', 'width=960,height=720');
  if (!popup) return;
  const generatedAt = new Date().toLocaleString('id-ID');
  const totalStock = rows.reduce((total, row) => total + row.stock, 0);
  const criticalCount = rows.filter((row) => row.status === 'critical').length;
  const tableRows = rows.map((row) => `<tr><td>${row.name}</td><td>${row.stock}</td><td>${row.unit}</td><td>${row.estimatedEmpty}</td><td>${labels[`status.${row.status}`]}</td><td>${row.lastUpdated}</td></tr>`).join('');
  popup.document.write(`<!doctype html><html><head><title>${labels.reportTitle}</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#111827}h1{margin:0 0 6px;font-size:24px}.meta{color:#6b7280;margin:0 0 24px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}.summary div{border:1px solid #e5e7eb;border-radius:8px;padding:12px}.summary b{display:block;font-size:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #e5e7eb;padding:10px;text-align:left;font-size:12px}th{background:#f9fafb}</style></head><body><h1>${labels.reportTitle}</h1><p class="meta">${labels.reportMeta}</p><section class="summary"><div><b>${rows.length}</b><span>${labels.medicineRows}</span></div><div><b>${totalStock}</b><span>${labels.totalStock}</span></div><div><b>${criticalCount}</b><span>${labels.criticalItems}</span></div></section><table><thead><tr><th>${labels.medication}</th><th>${labels.stock}</th><th>${labels.unit}</th><th>${labels.estimatedEmpty}</th><th>${labels.status}</th><th>${labels.lastUpdated}</th></tr></thead><tbody>${tableRows || `<tr><td colspan="6">${labels.noStockData}</td></tr>`}</tbody></table><script>window.print();</script></body></html>`);
  popup.document.close();
}

export function MedicineNeedsContent() {
  const t = useTranslations('medicine');
  const [activeModal, setActiveModal] = useState<'edit' | 'shipment' | null>(null);
  const [rows, setRows] = useState<MedicationRow[]>([]);
  const [obatRows, setObatRows] = useState<ObatRecord[]>([]);
  const [puskesmasId, setPuskesmasId] = useState<string | null>(null);
  const [selectedMedication, setSelectedMedication] = useState<MedicationRow | null>(null);
  const [selectedObatId, setSelectedObatId] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isForecasting, setIsForecasting] = useState(false);
  const [page, setPage] = useState(1);

  async function refreshRows() {
    setError(null);
    setNotice(null);
    setIsForecasting(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser?.puskesmasId) throw new Error(t('notLinked'));
      const period = getCurrentPeriod();
      const [stockRows, medicines] = await Promise.all([getStokRows({ puskesmasId: currentUser.puskesmasId, periode: period }), getObat()]);
      let lplpoRows: LplpoRow[] = [];
      try {
        if (stockRows.length > 0) {
          await runAiForecast({ puskesmasId: currentUser.puskesmasId, periode: period });
          await generateLplpo({ puskesmasId: currentUser.puskesmasId, periode: period });
          lplpoRows = await getLplpoRows({ puskesmasId: currentUser.puskesmasId, periode: period });
        }
      } catch (aiError) {
        setNotice(aiError instanceof Error ? aiError.message : t('loadStockError'));
      }
      const lplpoByObat = new Map(lplpoRows.map((row) => [row.obatId, row]));
      setPuskesmasId(currentUser.puskesmasId);
      setObatRows(medicines);
      const mappedRows = stockRows.map((row) => {
        const stock = row.stokSaatIni;
        const dailyUse = row.konsumsiPeriode > 0 ? row.konsumsiPeriode / 30 : 0;
        const lplpo = lplpoByObat.get(row.obatId);
        const days = lplpo?.daysOfStock ?? (dailyUse > 0 ? stock / dailyUse : null);
        const status: MedicationStatus = days != null ? (days <= 7 ? 'critical' : days <= 30 ? 'warning' : 'safe') : stock <= 5 ? 'critical' : stock <= 20 ? 'warning' : 'safe';
        return {
          obatId: row.obatId,
          slug: row.obatId.toLowerCase(),
          name: row.obat?.nama ?? row.obatId,
          stock,
          unit: row.obat?.satuan ?? 'unit',
          estimatedEmpty: days == null ? t('noUsageData') : t('daysCount', { count: Math.max(1, Math.round(days)) }),
          status,
          lastUpdated: new Date(row.periode).toLocaleDateString('id-ID'),
          aiRecommendedQuantity: lplpo?.jumlahDiminta,
          aiJustification: lplpo ? `Rekomendasi AI: minta ${lplpo.jumlahDiminta} ${row.obat?.satuan ?? 'unit'}; estimasi cakupan ${days == null ? '-' : Math.round(days)} hari.` : undefined,
        };
      });
      setRows(mappedRows);
      setSelectedMedication((current) => current ?? mappedRows[0] ?? null);
      setSelectedObatId((current) => current || medicines[0]?.id || '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('loadStockError'));
    } finally {
      setIsForecasting(false);
    }
  }

  useEffect(() => {
    void refreshRows();
  }, []);

  const selectedObat = useMemo(() => obatRows.find((item) => item.id === selectedObatId), [obatRows, selectedObatId]);
  const closeModal = () => setActiveModal(null);
  const safeRows = rows.filter(isMedicationRow);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(safeRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = safeRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  async function saveStock() {
    if (!selectedObatId) {
      setError(t('selectMedicineFirst'));
      return;
    }
    const value = Number(quantity);
    if (!Number.isFinite(value) || value < 0) {
      setError(t('invalidStock'));
      return;
    }
    try {
      if (!puskesmasId) throw new Error(t('notLinked'));
      await upsertStok({ puskesmasId, obatId: selectedObatId, periode: getCurrentPeriod(), stokAwal: value, konsumsiPeriode: 0, stokSaatIni: value });
      setQuantity('0');
      await refreshRows();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('saveStockError'));
    }
  }

  async function saveMedicationStock(item: MedicationRow, nextQuantity: number) {
    if (!Number.isFinite(nextQuantity) || nextQuantity < 0) {
      setError(t('invalidStock'));
      return;
    }
    try {
      if (!puskesmasId) throw new Error(t('notLinked'));
      await upsertStok({ puskesmasId, obatId: item.obatId, periode: getCurrentPeriod(), stokAwal: nextQuantity, konsumsiPeriode: 0, stokSaatIni: nextQuantity });
      closeModal();
      await refreshRows();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('saveStockError'));
    }
  }

  async function submitShipmentRequest(item: MedicationRow, requestedQuantity: number, note: string) {
    if (!puskesmasId) {
      setError(t('notLinked'));
      return;
    }
    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      setError(t('invalidStock'));
      return;
    }
    try {
      setError(null);
      await createShipmentRequest({
        puskesmasId,
        periode: getCurrentPeriod(),
        items: [{ obatId: item.obatId, jumlah: Math.round(requestedQuantity), note: note || item.aiJustification }],
        justification: note || item.aiJustification || `Request ${item.name} dari kebutuhan stok bidan.`,
      });
      setNotice(t('shipmentFeature', { name: item.name }));
      closeModal();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('saveStockError'));
    }
  }

  const statusLabel: Record<MedicationStatus, string> = { safe: t('statusSafe'), warning: t('statusWarning'), critical: t('statusCritical') };

  return (
    <PageContainer size="wide" className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{t('title')}</h1>
          <p>{t('subtitle')}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryButton} onClick={() => void refreshRows()}>
            <AppIcon name="clock" width={18} height={18} />
            {isForecasting ? 'Running AI...' : t('refresh')}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => printMedicineReport(safeRows, puskesmasId, getCurrentPeriod(), { reportTitle: t('reportTitle'), reportMeta: t('reportMeta', { puskesmas: puskesmasId ?? '-', period: getCurrentPeriod(), generatedAt: new Date().toLocaleString('id-ID') }), medicineRows: t('medicineRows'), totalStock: t('totalStock'), criticalItems: t('criticalItems'), medication: t('medication'), stock: t('stock'), unit: t('unit'), estimatedEmpty: t('estimatedEmpty'), status: t('status'), lastUpdated: t('lastUpdated'), noStockData: t('noStockData'), 'status.safe': t('statusSafe'), 'status.warning': t('statusWarning'), 'status.critical': t('statusCritical') })}>
            <AppIcon name="upload" width={18} height={18} />
            {t('printReport')}
          </button>
        </div>
      </header>

      <section className={styles.inputCard} aria-label={t('updateStock')}>
        <div className={styles.formGrid}>
          <label className={styles.fieldGroup}>
            <span>{t('medicationName')}</span>
            <select value={selectedObatId} onChange={(event) => setSelectedObatId(event.target.value)}>
              <option value="" disabled>{t('selectMedication')}</option>
              {obatRows.map((item) => <option value={item.id} key={item.id}>{item.nama}</option>)}
            </select>
          </label>
          <label className={styles.fieldGroup}>
            <span>{t('quantity')}</span>
            <input value={quantity} inputMode="numeric" onChange={(event) => setQuantity(event.target.value)} />
          </label>
          <label className={styles.fieldGroup}>
            <span>{t('unit')}</span>
            <select value={selectedObat?.satuan ?? 'unit'} disabled>
              <option>{selectedObat?.satuan ?? 'unit'}</option>
            </select>
          </label>
          <button type="button" className={styles.addButton} onClick={() => void saveStock()}>
            <AppIcon name="plus" width={18} height={18} />
            {t('add')}
          </button>
        </div>
      </section>

      <section className={styles.tableCard} aria-label={t('stockTable')}>
        <div className={styles.tableScroll}>
          <table className={styles.medicationTable}>
            <thead>
              <tr>
                <th>{t('medicationName')}</th>
                <th>{t('stock')}</th>
                <th>{t('unit')}</th>
                <th>{t('estimatedEmpty')}</th>
                <th>{t('status')}</th>
                <th>{t('lastUpdated')}</th>
                <th>{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {safeRows.length === 0 ? <tr><td colSpan={7}>{t('emptyStock')}</td></tr> : null}
              {pageRows.map((item) => (
                <tr key={item.slug}>
                  <td data-label={t('medicationName')}><strong>{item.name}</strong></td>
                  <td data-label={t('stock')}>{item.stock}</td>
                  <td data-label={t('unit')}>{item.unit}</td>
                  <td data-label={t('estimatedEmpty')}><span className={styles[item.status]}>{item.estimatedEmpty}</span></td>
                  <td data-label={t('status')}><span className={`${styles.statusPill} ${styles[`${item.status}Pill`]}`}>{statusLabel[item.status]}</span></td>
                  <td data-label={t('lastUpdated')}>{item.lastUpdated}</td>
                  <td data-label={t('action')}>
                    <div className={styles.rowActions}>
                      <Link href={`${routes.medicineNeeds}/${item.slug}`} aria-label={t('viewNamed', { name: item.name })}><AppIcon name="eye" width={16} height={16} /></Link>
                      <button
                        type="button"
                        aria-label={t('editNamed', { name: item.name })}
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
                        {t('requestShipment')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className={styles.pagination}>
          <p>{t('showingEntries', { count: pageRows.length })}</p>
          <div className={styles.paginationControls}>
            <button type="button" aria-label={t('previousPage')} disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><AppIcon name="chevronLeft" width={16} height={16} /></button>
            <button type="button" aria-current="page">{safePage}</button>
            <button type="button" aria-label={t('nextPage')} disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><AppIcon name="chevronRight" width={16} height={16} /></button>
          </div>
        </footer>
      </section>

      <button type="button" className={styles.saveButton} onClick={() => void saveStock()}>
        <AppIcon name="fileText" width={18} height={18} />
        {t('saveStockUpdate')}
      </button>

      {error ? <p className={styles.medicineError}>{error}</p> : null}
      {notice ? <p role="status" className={styles.medicineNotice}>{notice}</p> : null}

      {activeModal === 'edit' && selectedMedication ? <EditStockModal item={selectedMedication} onClose={closeModal} onSave={saveMedicationStock} /> : null}
      {activeModal === 'shipment' && selectedMedication ? <RequestShipmentModal item={selectedMedication} onClose={closeModal} onSubmit={submitShipmentRequest} /> : null}
    </PageContainer>
  );
}

function ModalShell({ children }: { children: ReactNode }) {
  return <div className={styles.modalOverlay}>{children}</div>;
}

function ModalCloseButton({ onClose }: { onClose: () => void }) {
  const t = useTranslations('medicine');
  return (
    <button type="button" className={styles.modalClose} aria-label={t('closeModal')} onClick={onClose}>
      <AppIcon name="x" width={22} height={22} />
    </button>
  );
}

function EditStockModal({ item, onClose, onSave }: { item: MedicationRow; onClose: () => void; onSave: (item: MedicationRow, quantity: number) => void }) {
  const t = useTranslations('medicine');
  const [draft, setDraft] = useState(String(item.stock));

  return (
    <ModalShell>
      <section className={styles.editModal} role="dialog" aria-modal="true" aria-labelledby="edit-stock-title">
        <header className={styles.modalHeaderLarge}>
          <h2 id="edit-stock-title">{t('editStock')}</h2>
          <ModalCloseButton onClose={onClose} />
        </header>
        <div className={styles.editModalBody}>
          <div>
            <span className={styles.modalEyebrow}>{t('medicationName')}</span>
            <strong>{item.name}</strong>
          </div>
          <label className={styles.stockField}>
            <span>{t('amount')}</span>
            <span className={styles.stockInputRow}>
              <input value={draft} inputMode="numeric" onChange={(event) => setDraft(event.target.value)} />
              <span>{item.unit === 'ampul' ? 'ampoule' : item.unit}</span>
            </span>
          </label>
        </div>
        <footer className={styles.modalFooter}>
          <button type="button" className={styles.modalGhostButton} onClick={onClose}>{t('cancel')}</button>
          <button type="button" className={styles.modalPrimaryButton} onClick={() => onSave(item, Number(draft))}>{t('save')}</button>
        </footer>
      </section>
    </ModalShell>
  );
}

function RequestShipmentModal({ item, onClose, onSubmit }: { item: MedicationRow; onClose: () => void; onSubmit: (item: MedicationRow, quantity: number, note: string) => void }) {
  const t = useTranslations('medicine');
  const isCritical = item.status === 'critical';
  const [quantity, setQuantity] = useState(String(item.aiRecommendedQuantity ?? (isCritical ? 100 : Math.max(1, item.stock))));
  const [note, setNote] = useState(item.aiJustification ?? '');
  const [validation, setValidation] = useState<string | null>(null);

  function submit() {
    const value = Number(quantity);
    if (!Number.isFinite(value) || value <= 0) {
      setValidation(t('invalidStock'));
      return;
    }
    if (!isCritical && !note.trim()) {
      setValidation(t('reasonRequired'));
      return;
    }
    setValidation(null);
    onSubmit(item, value, note.trim());
  }

  return (
    <ModalShell>
      <section className={styles.shipmentModal} role="dialog" aria-modal="true" aria-labelledby="shipment-title">
        <header className={styles.shipmentHeader}>
          <div className={styles.shipmentTitleWrap}>
            <span className={styles.shipmentIcon}><AppIcon name="package" width={24} height={24} /></span>
            <div>
              <h2 id="shipment-title">{t('requestShipment')}</h2>
              <p>{item.name}</p>
            </div>
          </div>
          <ModalCloseButton onClose={onClose} />
        </header>
        <div className={styles.shipmentBody}>
          <div className={isCritical ? styles.criticalAlert : styles.safeAlert}>
            <AppIcon name={isCritical ? 'alert' : 'info'} width={18} height={18} />
            <p>{isCritical ? t('criticalAlert') : t('safeRequestAlert')}</p>
          </div>

          <label className={styles.quantityField}>
            <span className={styles.modalEyebrow}>{t('requestedQuantity')}</span>
            <span className={styles.quantityInputRow}>
              <input value={quantity} inputMode="numeric" onChange={(event) => setQuantity(event.target.value)} />
              <span>{item.unit}</span>
            </span>
            <em>{t('currentStockLine', { stock: item.stock, unit: item.unit, coverage: item.estimatedEmpty })}</em>
          </label>

          <label className={styles.notesField}>
            <span className={styles.labelRow}>
              <span className={styles.modalEyebrow}>{isCritical ? t('additionalNotes') : t('reasonForRequest')}</span>
              {!isCritical ? <b>{t('required')}</b> : null}
            </span>
            <textarea value={note} placeholder={isCritical ? t('criticalPlaceholder') : t('safePlaceholder')} onChange={(event) => setNote(event.target.value)} />
            {validation ? <span className={styles.validationText}><AppIcon name="alert" width={14} height={14} />{validation}</span> : !isCritical ? <span className={styles.validationText}><AppIcon name="alert" width={14} height={14} />{t('reasonRequired')}</span> : null}
          </label>
        </div>
        <footer className={styles.shipmentFooter}>
          <button type="button" className={styles.shipmentCancel} onClick={onClose}>{t('cancel')}</button>
          <button type="button" className={styles.shipmentSubmit} onClick={submit}>{t('submitRequest')}</button>
        </footer>
      </section>
    </ModalShell>
  );
}

