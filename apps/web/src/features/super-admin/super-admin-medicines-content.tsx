'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { AppIcon } from '@/components/ui/app-icon';
import { createObat, deleteObat, getAiMasterSyncStatus, getCurrentUser, getObat, updateObat, type AiMasterSyncStatus, type CurrentUser, type ObatRecord, type UpsertObatPayload } from '@/lib/api';
import { AdminShell } from './admin-shell';
import styles from './super-admin-dashboard.module.css';

type MedicineRow = { id: string; name: string; unit: string; category: string; dailyDosage: string; coldChain: boolean };
type FormState = UpsertObatPayload;

const emptyForm: FormState = { id: '', nama: '', kategori: 'OBAT', tipe: 'TABLET', perluColdChain: false, satuan: 'tablet', dosisStandarHarian: 0, durasiPengobatanHari: 0 };

function formatDailyDosage(row: ObatRecord) { return row.dosisStandarHarian ? `${row.dosisStandarHarian} ${row.satuan}/day` : '-'; }
function mapMedicineRows(rows: ObatRecord[]): MedicineRow[] { return rows.map((row) => ({ id: row.id, name: row.nama, unit: row.satuan, category: row.kategori, dailyDosage: formatDailyDosage(row), coldChain: row.perluColdChain })); }
function toForm(row: ObatRecord): FormState { return { id: row.id, nama: row.nama, kategori: row.kategori as FormState['kategori'], tipe: row.tipe as FormState['tipe'], perluColdChain: row.perluColdChain, satuan: row.satuan, dosisStandarHarian: row.dosisStandarHarian ?? 0, durasiPengobatanHari: row.durasiPengobatanHari ?? 0 }; }
function categoryTone(category: string) { return category === 'VAKSIN' ? 'essential' : category === 'ALAT_KESEHATAN' ? 'routine' : 'emergency'; }
function syncLabel(status: AiMasterSyncStatus | null) {
  if (!status || status.status === 'never') return 'Auto-sync: pending';
  if (status.status === 'running') return 'Auto-sync: running';
  if (status.status === 'failed') return 'Auto-sync: cached data';
  const value = status.finishedAt ?? status.latestAudit?.createdAt;
  return value ? `Auto-synced ${new Date(value).toLocaleDateString('id-ID')}` : 'Auto-sync active';
}

function downloadCsv(filename: string, rows: MedicineRow[]) {
  const header = ['id', 'name', 'category', 'unit', 'dailyDosage', 'coldChain'].join(',');
  const body = rows.map((row) => [row.id, row.name, row.category, row.unit, row.dailyDosage, row.coldChain ? 'yes' : 'no'].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function SuperAdminMedicinesContent() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const [rawRows, setRawRows] = useState<ObatRecord[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<AiMasterSyncStatus | null>(null);

  async function reload() {
    const [medicineRows, nextUser, nextSyncStatus] = await Promise.all([getObat(), getCurrentUser(), getAiMasterSyncStatus().catch(() => null)]);
    setRawRows(medicineRows);
    setUser(nextUser);
    setSyncStatus(nextSyncStatus);
  }

  useEffect(() => { void reload().catch((loadError) => setError(loadError instanceof Error ? loadError.message : t('unableLoadMedicineData'))); }, [t]);

  const rows = useMemo(() => mapMedicineRows(rawRows), [rawRows]);
  const categories = useMemo(() => ['All', ...Array.from(new Set(rows.map((row) => row.category)))], [rows]);
  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => (category === 'All' || row.category === category) && (!normalizedQuery || [row.id, row.name, row.unit, row.category].some((value) => value.toLowerCase().includes(normalizedQuery))));
  }, [category, query, rows]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / 8));
  const visibleRows = filteredRows.slice((page - 1) * 8, page * 8);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    const payload = { ...form, dosisStandarHarian: Number(form.dosisStandarHarian ?? 0), durasiPengobatanHari: Number(form.durasiPengobatanHari ?? 0) };
    if (rawRows.some((row) => row.id === form.id)) await updateObat(form.id, payload);
    else await createObat(payload);
    setForm(null); await reload();
  }

  async function removeRow(row: MedicineRow) {
    if (!window.confirm(t('confirmDeleteMedicine', { name: row.name }))) return;
    await deleteObat(row.id); await reload();
  }

  return (
    <AdminShell active="medicines" breadcrumb={t('medicinesTitle')} user={user}>
      <div className={[styles.content, styles.registryContent, styles.medicineContent].join(' ')}>
        <section className={[styles.pageHeader, styles.registryHeader].join(' ')}>
          <div><h1>{t('medicinesTitle')}</h1><p>{t('medicinesSubtitle', { count: rows.length })}</p></div>
          <div className={styles.registryActions}><span className={styles.syncStatus} data-state={syncStatus?.status ?? 'never'}>{syncLabel(syncStatus)}</span><button type="button" className={styles.primaryButton} onClick={() => setForm({ ...emptyForm })}><AppIcon name="plus" width={16} height={16} /> {t('addMedicine')}</button></div>
        </section>
        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.medicineToolbar} aria-label={t('medicineFilters')}>
          <div className={styles.medicineFilterGroup}>
            <label className={styles.searchBox}><AppIcon name="search" width={18} height={18} /><input aria-label={t('searchMedicineName')} placeholder={t('searchMedicineName')} value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} /></label>
            <label className={styles.categoryFilter}><span>{t('filterCategory')}</span><select aria-label={t('filterMedicineCategory')} value={category} onChange={(event) => { setPage(1); setCategory(event.target.value); }}>{categories.map((item) => <option key={item} value={item}>{item === 'All' ? t('all') : item}</option>)}</select><AppIcon name="chevronDown" width={18} height={18} /></label>
          </div>
          <div className={styles.toolbarIconActions}><button type="button" aria-label={t('downloadMedicineList')} onClick={() => downloadCsv('maternalink-medicines.csv', filteredRows)}><AppIcon name="download" width={18} height={18} /></button></div>
        </section>

        <section className={[styles.registryCard, styles.medicineCard].join(' ')} aria-label={t('medicineRegistryTable')}>
          <div className={styles.tableScroller}>
            <table className={[styles.registryTable, styles.medicineTable].join(' ')}>
              <thead><tr><th>ID</th><th>{tCommon('name')}</th><th>{t('unit')}</th><th>{t('category')}</th><th>{t('dailyDosage')}</th><th>{t('coldChain')}</th><th>{tCommon('actions')}</th></tr></thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}><td>{row.id}</td><td><strong>{row.name}</strong></td><td>{row.unit}</td><td><span className={styles.categoryBadge} data-tone={categoryTone(row.category)}>{row.category}</span></td><td>{row.dailyDosage}</td><td><span className={styles.coldChainStatus} data-active={row.coldChain}><AppIcon name={row.coldChain ? 'checkCircle' : 'circleStop'} width={15} height={15} />{row.coldChain ? t('yes') : t('no')}</span></td><td><div className={styles.textActions}><button type="button" onClick={() => setForm(toForm(rawRows.find((item) => item.id === row.id)!))}>{tCommon('edit')}</button><button type="button" onClick={() => void removeRow(row)}>{tCommon('delete')}</button></div></td></tr>
                ))}
                {filteredRows.length === 0 ? <tr><td colSpan={7}>{t('noMedicineForFilter')}</td></tr> : null}
              </tbody>
            </table>
          </div>
          <footer className={[styles.registryPagination, styles.compactPagination].join(' ')}><p>{t('registeredMedicinesCount', { shown: filteredRows.length, total: rows.length })}</p><div className={styles.pages}><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label={t('previousPage')}><AppIcon name="chevronLeft" width={14} height={14} /></button><span>{t('pageOf', { page, total: totalPages })}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} aria-label={t('nextPage')}><AppIcon name="chevronRight" width={14} height={14} /></button></div></footer>
        </section>
      </div>
      {form ? <MedicineModal form={form} setForm={setForm} submitForm={submitForm} close={() => setForm(null)} /> : null}
    </AdminShell>
  );
}

function MedicineModal({ form, setForm, submitForm, close }: { form: FormState; setForm: (form: FormState) => void; submitForm: (event: FormEvent<HTMLFormElement>) => void; close: () => void }) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={close}>
      <form className={styles.modalCard} onSubmit={submitForm} onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.drawerHeader}><h2>{form.id ? t('medicine') : t('addMedicine')}</h2><button type="button" aria-label={tCommon('closeMenu')} onClick={close}><AppIcon name="x" width={18} height={18} /></button></header>
        <label>ID<input required value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} /></label>
        <label>{tCommon('name')}<input required value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} /></label>
        <label>{t('category')}<select value={form.kategori} onChange={(event) => setForm({ ...form, kategori: event.target.value as FormState['kategori'] })}><option value="OBAT">{t('medicineCategoryMedicine')}</option><option value="VAKSIN">{t('medicineCategoryVaccine')}</option><option value="ALAT_KESEHATAN">{t('medicineCategoryDevice')}</option></select></label>
        <label>{t('type')}<select value={form.tipe} onChange={(event) => setForm({ ...form, tipe: event.target.value as FormState['tipe'] })}><option value="TABLET">Tablet</option><option value="SIRUP">{t('syrup')}</option><option value="INJEKSI">{t('injection')}</option><option value="KAPSUL">{t('capsule')}</option><option value="CAIRAN">{t('liquid')}</option><option value="LAINNYA">{t('other')}</option></select></label>
        <label>{t('unit')}<input required value={form.satuan} onChange={(event) => setForm({ ...form, satuan: event.target.value })} /></label>
        <label>{t('dailyDose')}<input type="number" min="0" step="0.1" value={form.dosisStandarHarian ?? 0} onChange={(event) => setForm({ ...form, dosisStandarHarian: Number(event.target.value) })} /></label>
        <label>{t('treatmentDuration')}<input type="number" min="0" value={form.durasiPengobatanHari ?? 0} onChange={(event) => setForm({ ...form, durasiPengobatanHari: Number(event.target.value) })} /></label>
        <label className={styles.checkboxRow}><input type="checkbox" checked={form.perluColdChain} onChange={(event) => setForm({ ...form, perluColdChain: event.target.checked })} /> {t('coldChain')}</label>
        <div className={styles.modalActions}><button type="button" onClick={close}>{tCommon('cancel')}</button><button className={styles.primaryButton} type="submit">{tCommon('save')}</button></div>
      </form>
    </div>
  );
}
