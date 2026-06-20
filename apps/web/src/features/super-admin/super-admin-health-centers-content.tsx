'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { AppIcon } from '@/components/ui/app-icon';
import { createPuskesmas, deletePuskesmas, getAiMasterSyncStatus, getCurrentUser, getPuskesmas, getUsers, updatePuskesmas, type AiMasterSyncStatus, type CurrentUser, type PuskesmasRecord, type UpsertPuskesmasPayload } from '@/lib/api';
import { AdminShell } from './admin-shell';
import styles from './super-admin-dashboard.module.css';

type FormState = UpsertPuskesmasPayload;

const emptyForm: FormState = { id: '', nama: '', kecamatan: '', kabupatenKota: '', provinsi: 'DI Yogyakarta', tipe: 'NON_RAWAT_INAP', rainyAccess: 'AMAN', coldChainReady: false, statusEndemisMalaria: false, ketersediaanLab: false, kapasitasSimpanObat: 0, jarakKeIfkKm: 0, leadTimeHari: 0, latitude: null, longitude: null, skorAksesibilitas: 2 };

function toForm(row: PuskesmasRecord): FormState {
  return { id: row.id, nama: row.nama, kecamatan: row.kecamatan, kabupatenKota: row.kabupatenKota ?? '', provinsi: row.provinsi ?? '', tipe: row.tipe as FormState['tipe'], rainyAccess: row.rainyAccess as FormState['rainyAccess'], coldChainReady: row.coldChainReady, statusEndemisMalaria: row.statusEndemisMalaria, ketersediaanLab: row.ketersediaanLab, kapasitasSimpanObat: row.kapasitasSimpanObat ?? 0, jarakKeIfkKm: row.jarakKeIfkKm ?? 0, leadTimeHari: row.leadTimeHari ?? 0, latitude: row.latitude ?? null, longitude: row.longitude ?? null, skorAksesibilitas: row.skorAksesibilitas };
}

function syncLabel(status: AiMasterSyncStatus | null) {
  if (!status || status.status === 'never') return 'Auto-sync: pending';
  if (status.status === 'running') return 'Auto-sync: running';
  if (status.status === 'failed') return 'Auto-sync: cached data';
  const value = status.finishedAt ?? status.latestAudit?.createdAt;
  return value ? `Auto-synced ${new Date(value).toLocaleDateString('id-ID')}` : 'Auto-sync active';
}

export function SuperAdminHealthCentersContent() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const [rows, setRows] = useState<PuskesmasRecord[]>([]);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<AiMasterSyncStatus | null>(null);

  async function reload() {
    const [puskesmasRows, nextUser, users, nextSyncStatus] = await Promise.all([getPuskesmas(), getCurrentUser(), getUsers(), getAiMasterSyncStatus().catch(() => null)]);
    setRows(puskesmasRows);
    setUser(nextUser);
    setSyncStatus(nextSyncStatus);
    setUserCounts(users.reduce<Record<string, number>>((acc, item) => {
      if (item.puskesmasId) acc[item.puskesmasId] = (acc[item.puskesmasId] ?? 0) + 1;
      return acc;
    }, {}));
  }

  useEffect(() => { void reload().catch((loadError) => setError(loadError instanceof Error ? loadError.message : t('unableLoadHealthCenters'))); }, [t]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter((row) => [row.id, row.nama, row.kecamatan].some((value) => value.toLowerCase().includes(normalizedQuery)));
  }, [query, rows]);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    const payload = { ...form, kapasitasSimpanObat: Number(form.kapasitasSimpanObat ?? 0), jarakKeIfkKm: Number(form.jarakKeIfkKm ?? 0), leadTimeHari: Number(form.leadTimeHari ?? 0), skorAksesibilitas: Number(form.skorAksesibilitas ?? 2), latitude: form.latitude === null ? undefined : Number(form.latitude), longitude: form.longitude === null ? undefined : Number(form.longitude) };
    if (rows.some((row) => row.id === form.id)) await updatePuskesmas(form.id, payload);
    else await createPuskesmas(payload);
    setForm(null);
    await reload();
  }

  async function removeRow(row: PuskesmasRecord) {
    if (!window.confirm(t('confirmDeleteHealthCenter', { name: row.nama }))) return;
    await deletePuskesmas(row.id);
    await reload();
  }

  return (
    <AdminShell active="health-centers" breadcrumb={t('healthCentersTitle')} user={user}>
      <div className={[styles.content, styles.registryContent].join(' ')}>
        <section className={[styles.pageHeader, styles.registryHeader].join(' ')}>
          <div><h1>{t('healthCentersTitle')}</h1><p>{t('healthCentersSubtitle')}</p></div>
          <div className={styles.registryActions}>
            <label className={styles.searchBox}><AppIcon name="search" width={18} height={18} /><input aria-label={t('searchHealthCenter')} placeholder={t('searchHealthCenter')} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <span className={styles.syncStatus} data-state={syncStatus?.status ?? 'never'}>{syncLabel(syncStatus)}</span>
            <button type="button" className={styles.primaryButton} onClick={() => setForm({ ...emptyForm })}><AppIcon name="plus" width={16} height={16} /> {t('addHealthCenter')}</button>
          </div>
        </section>

        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.registryCard} aria-label={t('healthCenterTable')}>
          <div className={styles.tableScroller}>
            <table className={styles.registryTable}>
              <thead><tr><th>ID</th><th>{tCommon('name')}</th><th>{t('district')}</th><th>{tCommon('status')}</th><th>{t('usersColumn')}</th><th>{tCommon('actions')}</th></tr></thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td><strong className={styles.registryId}>{row.id}</strong></td><td><strong>{row.nama}</strong></td><td>{row.kecamatan}</td>
                    <td><span className={styles.activeBadge}>{tCommon('active')}</span></td><td>{t('userCount', { count: userCounts[row.id] ?? 0 })}</td>
                    <td><div className={styles.textActions}><button type="button" onClick={() => setForm(toForm(row))}>{tCommon('edit')}</button><button type="button" onClick={() => setForm(toForm(row))}>{tCommon('detail')}</button><button type="button" onClick={() => void removeRow(row)}>{tCommon('delete')}</button></div></td>
                  </tr>
                ))}
                {filteredRows.length === 0 ? <tr><td colSpan={6}>{t('noHealthCentersForFilter')}</td></tr> : null}
              </tbody>
            </table>
          </div>
          <footer className={styles.registryPagination}><p>{t('showingHealthCenters', { shown: filteredRows.length, total: rows.length })}</p></footer>
        </section>
      </div>

      {form ? <PuskesmasModal form={form} setForm={setForm} submitForm={submitForm} close={() => setForm(null)} /> : null}
    </AdminShell>
  );
}

function PuskesmasModal({ form, setForm, submitForm, close }: { form: FormState; setForm: (form: FormState) => void; submitForm: (event: FormEvent<HTMLFormElement>) => void; close: () => void }) {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={close}>
      <form className={styles.modalCard} onSubmit={submitForm} onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.drawerHeader}><h2>{form.id ? t('healthCenter') : t('addHealthCenter')}</h2><button type="button" onClick={close}><AppIcon name="circleStop" width={18} height={18} /></button></header>
        <label>ID<input required value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} /></label>
        <label>{tCommon('name')}<input required value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} /></label>
        <label>{t('district')}<input required value={form.kecamatan} onChange={(event) => setForm({ ...form, kecamatan: event.target.value })} /></label>
        <label>{t('city')}<input value={form.kabupatenKota ?? ''} onChange={(event) => setForm({ ...form, kabupatenKota: event.target.value })} /></label>
        <label>{t('province')}<input value={form.provinsi ?? ''} onChange={(event) => setForm({ ...form, provinsi: event.target.value })} /></label>
        <label>{t('type')}<select value={form.tipe} onChange={(event) => setForm({ ...form, tipe: event.target.value as FormState['tipe'] })}><option value="NON_RAWAT_INAP">{t('nonInpatient')}</option><option value="RAWAT_INAP">{t('inpatient')}</option></select></label>
        <label>{t('rainAccess')}<select value={form.rainyAccess} onChange={(event) => setForm({ ...form, rainyAccess: event.target.value as FormState['rainyAccess'] })}><option value="AMAN">{t('safeAccess')}</option><option value="TERBATAS">{t('limitedAccess')}</option><option value="TERGANGGU">{t('disruptedAccess')}</option></select></label>
        <label>{t('leadTime')}<input type="number" min="0" value={form.leadTimeHari ?? 0} onChange={(event) => setForm({ ...form, leadTimeHari: Number(event.target.value) })} /></label>
        <label>{t('distanceIfk')}<input type="number" min="0" step="0.1" value={form.jarakKeIfkKm ?? 0} onChange={(event) => setForm({ ...form, jarakKeIfkKm: Number(event.target.value) })} /></label>
        <label>{t('capacity')}<input type="number" min="0" value={form.kapasitasSimpanObat ?? 0} onChange={(event) => setForm({ ...form, kapasitasSimpanObat: Number(event.target.value) })} /></label>
        <label>{t('accessibilityScore')}<input type="number" min="1" max="3" value={form.skorAksesibilitas ?? 2} onChange={(event) => setForm({ ...form, skorAksesibilitas: Number(event.target.value) })} /></label>
        <label className={styles.checkboxRow}><input type="checkbox" checked={form.coldChainReady} onChange={(event) => setForm({ ...form, coldChainReady: event.target.checked })} /> {t('coldChainReady')}</label>
        <label className={styles.checkboxRow}><input type="checkbox" checked={form.ketersediaanLab} onChange={(event) => setForm({ ...form, ketersediaanLab: event.target.checked })} /> {t('labAvailable')}</label>
        <label className={styles.checkboxRow}><input type="checkbox" checked={form.statusEndemisMalaria} onChange={(event) => setForm({ ...form, statusEndemisMalaria: event.target.checked })} /> {t('malariaEndemic')}</label>
        <div className={styles.modalActions}><button type="button" onClick={close}>{tCommon('cancel')}</button><button className={styles.primaryButton} type="submit">{tCommon('save')}</button></div>
      </form>
    </div>
  );
}
