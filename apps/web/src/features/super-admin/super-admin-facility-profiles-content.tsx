'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { getCurrentUser, getPuskesmas, updatePuskesmas, type CurrentUser, type PuskesmasRecord } from '@/lib/api';
import { AdminShell } from './admin-shell';
import styles from './super-admin-dashboard.module.css';

type ProfileForm = { id: string; nama: string; leadTimeHari: number; jarakKeIfkKm: number; kapasitasSimpanObat: number; skorAksesibilitas: number; coldChainReady: boolean; statusEndemisMalaria: boolean; ketersediaanLab: boolean; rainyAccess: 'AMAN' | 'TERBATAS' | 'TERGANGGU' };

function mapAccess(score: number) {
  if (score >= 3) return { access: 'Easy', accessTone: 'easy' as const, score: String(score) };
  if (score >= 2) return { access: 'Medium', accessTone: 'medium' as const, score: String(score) };
  return { access: 'Difficult', accessTone: 'missing' as const, score: String(score) };
}

function isIncomplete(row: PuskesmasRecord) { return row.leadTimeHari == null || row.jarakKeIfkKm == null || row.kapasitasSimpanObat == null; }
function toForm(row: PuskesmasRecord): ProfileForm { return { id: row.id, nama: row.nama, leadTimeHari: row.leadTimeHari ?? 0, jarakKeIfkKm: row.jarakKeIfkKm ?? 0, kapasitasSimpanObat: row.kapasitasSimpanObat ?? 0, skorAksesibilitas: row.skorAksesibilitas, coldChainReady: row.coldChainReady, statusEndemisMalaria: row.statusEndemisMalaria, ketersediaanLab: row.ketersediaanLab, rainyAccess: row.rainyAccess as ProfileForm['rainyAccess'] }; }

export function SuperAdminFacilityProfilesContent() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [rows, setRows] = useState<PuskesmasRecord[]>([]);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const [nextUser, puskesmasRows] = await Promise.all([getCurrentUser(), getPuskesmas()]);
    setUser(nextUser); setRows(puskesmasRows);
  }

  useEffect(() => { void reload().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load facility profiles')); }, []);
  const incompleteCount = useMemo(() => rows.filter(isIncomplete).length, [rows]);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    await updatePuskesmas(form.id, { leadTimeHari: Number(form.leadTimeHari), jarakKeIfkKm: Number(form.jarakKeIfkKm), kapasitasSimpanObat: Number(form.kapasitasSimpanObat), skorAksesibilitas: Number(form.skorAksesibilitas), coldChainReady: form.coldChainReady, statusEndemisMalaria: form.statusEndemisMalaria, ketersediaanLab: form.ketersediaanLab, rainyAccess: form.rainyAccess });
    setForm(null); await reload();
  }

  return (
    <AdminShell active="facility-profiles" breadcrumb="Facility Profiles" user={user}>
      <div className={[styles.content, styles.profileContent].join(' ')}>
        <section className={[styles.pageHeader, styles.registryHeader].join(' ')}>
          <div><h1>Facility Profiles</h1><p>Logistics and accessibility configuration for each health center</p></div>
          <span className={styles.incompletePill}><AppIcon name="alert" width={14} height={14} />{incompleteCount} profiles incomplete</span>
        </section>

        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.registryCard} aria-label="Facility profile configuration table">
          <div className={styles.tableScroller}>
            <table className={[styles.registryTable, styles.profileTable].join(' ')}>
              <thead><tr><th>Health Center</th><th>Lead Time</th><th>Accessibility</th><th>Cold Chain</th><th>Distance to IFK</th><th>MMR Area</th><th>Capacity</th><th>Actions</th></tr></thead>
              <tbody>
                {rows.map((row) => {
                  const incomplete = isIncomplete(row);
                  const access = mapAccess(row.skorAksesibilitas);
                  return (
                    <tr className={incomplete ? styles.highlightedProfileRow : undefined} key={row.id}>
                      <td><span className={styles.facilityNameCell}><span className={styles.statusDot} data-tone={incomplete ? 'neutral' : 'green'} /><strong>{row.nama}</strong></span></td>
                      <td>{row.leadTimeHari == null ? '-' : `${row.leadTimeHari} days`}</td>
                      <td><span className={styles.accessibilityCell}><span className={styles.accessibilityBadge} data-tone={incomplete ? 'missing' : access.accessTone}>{incomplete ? 'Not filled' : access.access}</span>{!incomplete ? <small>({access.score})</small> : null}</span></td>
                      <td>{row.coldChainReady ? <span className={styles.coldChainIcon}><AppIcon name="checkCircle" width={18} height={18} /></span> : '-'}</td>
                      <td>{row.jarakKeIfkKm == null ? '-' : `${row.jarakKeIfkKm} km`}</td>
                      <td>{row.statusEndemisMalaria ? 'Endemic area' : 'Non-endemic'}</td>
                      <td>{row.kapasitasSimpanObat == null ? '-' : `${row.kapasitasSimpanObat} units`}</td>
                      <td>{incomplete ? <button type="button" className={styles.completeButton} onClick={() => setForm(toForm(row))}>Complete now</button> : <button type="button" className={styles.linkButton} onClick={() => setForm(toForm(row))}>Edit</button>}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 ? <tr><td colSpan={8}>Belum ada profil fasilitas dari database.</td></tr> : null}
              </tbody>
            </table>
          </div>
          <footer className={styles.registryPagination}><p>Showing {rows.length} health centers</p></footer>
        </section>
      </div>

      {form ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setForm(null)}>
          <form className={styles.modalCard} onSubmit={(event) => void submitForm(event)} onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.drawerHeader}><h2>{form.nama}</h2><button type="button" onClick={() => setForm(null)}><AppIcon name="circleStop" width={18} height={18} /></button></header>
            <label>Lead time<input type="number" min="0" value={form.leadTimeHari} onChange={(event) => setForm({ ...form, leadTimeHari: Number(event.target.value) })} /></label>
            <label>Distance IFK<input type="number" min="0" step="0.1" value={form.jarakKeIfkKm} onChange={(event) => setForm({ ...form, jarakKeIfkKm: Number(event.target.value) })} /></label>
            <label>Capacity<input type="number" min="0" value={form.kapasitasSimpanObat} onChange={(event) => setForm({ ...form, kapasitasSimpanObat: Number(event.target.value) })} /></label>
            <label>Accessibility score<input type="number" min="1" max="3" value={form.skorAksesibilitas} onChange={(event) => setForm({ ...form, skorAksesibilitas: Number(event.target.value) })} /></label>
            <label>Rain access<select value={form.rainyAccess} onChange={(event) => setForm({ ...form, rainyAccess: event.target.value as ProfileForm['rainyAccess'] })}><option value="AMAN">Aman</option><option value="TERBATAS">Terbatas</option><option value="TERGANGGU">Terganggu</option></select></label>
            <label className={styles.checkboxRow}><input type="checkbox" checked={form.coldChainReady} onChange={(event) => setForm({ ...form, coldChainReady: event.target.checked })} /> Cold chain ready</label>
            <label className={styles.checkboxRow}><input type="checkbox" checked={form.ketersediaanLab} onChange={(event) => setForm({ ...form, ketersediaanLab: event.target.checked })} /> Lab available</label>
            <label className={styles.checkboxRow}><input type="checkbox" checked={form.statusEndemisMalaria} onChange={(event) => setForm({ ...form, statusEndemisMalaria: event.target.checked })} /> Malaria endemic</label>
            <div className={styles.modalActions}><button type="button" onClick={() => setForm(null)}>Cancel</button><button className={styles.primaryButton} type="submit">Save</button></div>
          </form>
        </div>
      ) : null}
    </AdminShell>
  );
}
