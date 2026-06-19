'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { createPuskesmas, deletePuskesmas, getCurrentUser, getPuskesmas, getUsers, syncAiMasterData, updatePuskesmas, type CurrentUser, type PuskesmasRecord, type UpsertPuskesmasPayload } from '@/lib/api';
import { AdminShell } from './admin-shell';
import styles from './super-admin-dashboard.module.css';

type FormState = UpsertPuskesmasPayload;

const emptyForm: FormState = { id: '', nama: '', kecamatan: '', kabupatenKota: '', provinsi: 'DI Yogyakarta', tipe: 'NON_RAWAT_INAP', rainyAccess: 'AMAN', coldChainReady: false, statusEndemisMalaria: false, ketersediaanLab: false, kapasitasSimpanObat: 0, jarakKeIfkKm: 0, leadTimeHari: 0, latitude: null, longitude: null, skorAksesibilitas: 2 };

function toForm(row: PuskesmasRecord): FormState {
  return { id: row.id, nama: row.nama, kecamatan: row.kecamatan, kabupatenKota: row.kabupatenKota ?? '', provinsi: row.provinsi ?? '', tipe: row.tipe as FormState['tipe'], rainyAccess: row.rainyAccess as FormState['rainyAccess'], coldChainReady: row.coldChainReady, statusEndemisMalaria: row.statusEndemisMalaria, ketersediaanLab: row.ketersediaanLab, kapasitasSimpanObat: row.kapasitasSimpanObat ?? 0, jarakKeIfkKm: row.jarakKeIfkKm ?? 0, leadTimeHari: row.leadTimeHari ?? 0, latitude: row.latitude ?? null, longitude: row.longitude ?? null, skorAksesibilitas: row.skorAksesibilitas };
}

export function SuperAdminHealthCentersContent() {
  const [rows, setRows] = useState<PuskesmasRecord[]>([]);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  async function reload() {
    const [puskesmasRows, nextUser, users] = await Promise.all([getPuskesmas(), getCurrentUser(), getUsers()]);
    setRows(puskesmasRows);
    setUser(nextUser);
    setUserCounts(users.reduce<Record<string, number>>((acc, item) => {
      if (item.puskesmasId) acc[item.puskesmasId] = (acc[item.puskesmasId] ?? 0) + 1;
      return acc;
    }, {}));
  }

  useEffect(() => { void reload().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load health centers')); }, []);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter((row) => [row.id, row.nama, row.kecamatan].some((value) => value.toLowerCase().includes(normalizedQuery)));
  }, [query, rows]);

  async function syncMasterData() {
    setIsSyncing(true);
    setError(null);
    setNotice('Sinkronisasi master data AI sedang berjalan.');
    try {
      const result = await syncAiMasterData();
      await reload();
      setNotice(`Master data AI tersinkron: ${result.puskesmas} puskesmas, ${result.obat} obat, ${result.kondisi} kondisi.`);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Gagal sinkronisasi master data AI');
    } finally { setIsSyncing(false); }
  }

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
    if (!window.confirm(`Hapus puskesmas ${row.nama}?`)) return;
    await deletePuskesmas(row.id);
    await reload();
  }

  return (
    <AdminShell active="health-centers" breadcrumb="Health Centers" user={user}>
      <div className={[styles.content, styles.registryContent].join(' ')}>
        <section className={[styles.pageHeader, styles.registryHeader].join(' ')}>
          <div><h1>Health Center Registry</h1><p>Manage healthcare facility data within the system</p></div>
          <div className={styles.registryActions}>
            <label className={styles.searchBox}><AppIcon name="search" width={18} height={18} /><input aria-label="Search health center name" placeholder="Search health center name..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <button type="button" className={styles.primaryButton} disabled={isSyncing} onClick={() => void syncMasterData()}><AppIcon name="download" width={16} height={16} /> {isSyncing ? 'Syncing AI Data' : 'Sync AI Master'}</button>
            <button type="button" className={styles.primaryButton} onClick={() => setForm({ ...emptyForm })}><AppIcon name="plus" width={16} height={16} /> Add Health Center</button>
          </div>
        </section>

        {notice ? <p role="status" className={styles.noticeText}>{notice}</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.registryCard} aria-label="Health center registry table">
          <div className={styles.tableScroller}>
            <table className={styles.registryTable}>
              <thead><tr><th>ID</th><th>Name</th><th>District</th><th>Status</th><th>Users</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td><strong className={styles.registryId}>{row.id}</strong></td><td><strong>{row.nama}</strong></td><td>{row.kecamatan}</td>
                    <td><span className={styles.activeBadge}>Active</span></td><td>{userCounts[row.id] ?? 0} users</td>
                    <td><div className={styles.textActions}><button type="button" onClick={() => setForm(toForm(row))}>Edit</button><button type="button" onClick={() => setForm(toForm(row))}>Detail</button><button type="button" onClick={() => void removeRow(row)}>Delete</button></div></td>
                  </tr>
                ))}
                {filteredRows.length === 0 ? <tr><td colSpan={6}>Belum ada puskesmas dari database untuk filter ini.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <footer className={styles.registryPagination}><p>Showing <strong>{filteredRows.length}</strong> of <strong>{rows.length}</strong> health centers</p></footer>
        </section>
      </div>

      {form ? <PuskesmasModal form={form} setForm={setForm} submitForm={submitForm} close={() => setForm(null)} /> : null}
    </AdminShell>
  );
}

function PuskesmasModal({ form, setForm, submitForm, close }: { form: FormState; setForm: (form: FormState) => void; submitForm: (event: FormEvent<HTMLFormElement>) => void; close: () => void }) {
  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={close}>
      <form className={styles.modalCard} onSubmit={submitForm} onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.drawerHeader}><h2>{form.id ? 'Health Center' : 'Add Health Center'}</h2><button type="button" onClick={close}><AppIcon name="circleStop" width={18} height={18} /></button></header>
        <label>ID<input required value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} /></label>
        <label>Name<input required value={form.nama} onChange={(event) => setForm({ ...form, nama: event.target.value })} /></label>
        <label>District<input required value={form.kecamatan} onChange={(event) => setForm({ ...form, kecamatan: event.target.value })} /></label>
        <label>City<input value={form.kabupatenKota ?? ''} onChange={(event) => setForm({ ...form, kabupatenKota: event.target.value })} /></label>
        <label>Province<input value={form.provinsi ?? ''} onChange={(event) => setForm({ ...form, provinsi: event.target.value })} /></label>
        <label>Type<select value={form.tipe} onChange={(event) => setForm({ ...form, tipe: event.target.value as FormState['tipe'] })}><option value="NON_RAWAT_INAP">Non Rawat Inap</option><option value="RAWAT_INAP">Rawat Inap</option></select></label>
        <label>Rain access<select value={form.rainyAccess} onChange={(event) => setForm({ ...form, rainyAccess: event.target.value as FormState['rainyAccess'] })}><option value="AMAN">Aman</option><option value="TERBATAS">Terbatas</option><option value="TERGANGGU">Terganggu</option></select></label>
        <label>Lead time<input type="number" min="0" value={form.leadTimeHari ?? 0} onChange={(event) => setForm({ ...form, leadTimeHari: Number(event.target.value) })} /></label>
        <label>Distance IFK<input type="number" min="0" step="0.1" value={form.jarakKeIfkKm ?? 0} onChange={(event) => setForm({ ...form, jarakKeIfkKm: Number(event.target.value) })} /></label>
        <label>Capacity<input type="number" min="0" value={form.kapasitasSimpanObat ?? 0} onChange={(event) => setForm({ ...form, kapasitasSimpanObat: Number(event.target.value) })} /></label>
        <label>Accessibility score<input type="number" min="1" max="3" value={form.skorAksesibilitas ?? 2} onChange={(event) => setForm({ ...form, skorAksesibilitas: Number(event.target.value) })} /></label>
        <label className={styles.checkboxRow}><input type="checkbox" checked={form.coldChainReady} onChange={(event) => setForm({ ...form, coldChainReady: event.target.checked })} /> Cold chain ready</label>
        <label className={styles.checkboxRow}><input type="checkbox" checked={form.ketersediaanLab} onChange={(event) => setForm({ ...form, ketersediaanLab: event.target.checked })} /> Lab available</label>
        <label className={styles.checkboxRow}><input type="checkbox" checked={form.statusEndemisMalaria} onChange={(event) => setForm({ ...form, statusEndemisMalaria: event.target.checked })} /> Malaria endemic</label>
        <div className={styles.modalActions}><button type="button" onClick={close}>Cancel</button><button className={styles.primaryButton} type="submit">Save</button></div>
      </form>
    </div>
  );
}
