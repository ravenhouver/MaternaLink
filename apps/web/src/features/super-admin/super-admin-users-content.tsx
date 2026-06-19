'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { createUser, deleteUser, getCurrentUser, getPuskesmas, getUsers, updateUser, type AdminUserRecord, type CurrentUser, type PuskesmasRecord, type UserRole } from '@/lib/api';
import { AdminShell } from './admin-shell';
import styles from './super-admin-dashboard.module.css';

type UserRoleFilter = 'All' | 'Super Admin' | 'Midwife' | 'IFK Officer';
type UserForm = { id?: string; username: string; displayName: string; role: UserRole; puskesmasId: string; password: string; active: boolean };

const roleFilters: UserRoleFilter[] = ['All', 'Super Admin', 'Midwife', 'IFK Officer'];
const emptyForm: UserForm = { username: '', displayName: '', role: 'BIDAN_PUSKESMAS', puskesmasId: '', password: '', active: true };

function roleLabel(role: UserRole): Exclude<UserRoleFilter, 'All'> {
  if (role === 'SUPER_ADMIN') return 'Super Admin';
  if (role === 'IFK_ADMIN') return 'IFK Officer';
  return 'Midwife';
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
}

function userTone(role: UserRole) {
  if (role === 'SUPER_ADMIN') return 'blue';
  if (role === 'IFK_ADMIN') return 'green';
  return 'indigo';
}

export function SuperAdminUsersContent() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [rows, setRows] = useState<AdminUserRecord[]>([]);
  const [puskesmas, setPuskesmas] = useState<PuskesmasRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<UserRoleFilter>('All');
  const [form, setForm] = useState<UserForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    const [nextUser, userRows, puskesmasRows] = await Promise.all([getCurrentUser(), getUsers(), getPuskesmas()]);
    setUser(nextUser);
    setRows(userRows);
    setPuskesmas(puskesmasRows);
  }

  useEffect(() => { void reload().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load users')); }, []);

  const filteredRows = useMemo(() => {
    if (activeFilter === 'All') return rows;
    return rows.filter((row) => roleLabel(row.role) === activeFilter);
  }, [activeFilter, rows]);

  function editRow(row: AdminUserRecord) {
    setForm({ id: row.id, username: row.username, displayName: row.displayName ?? row.username, role: row.role, puskesmasId: row.puskesmasId ?? '', password: '', active: row.active });
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { username: form.username, displayName: form.displayName, role: form.role, puskesmasId: form.role === 'BIDAN_PUSKESMAS' ? form.puskesmasId : null, active: form.active, ...(form.password ? { password: form.password } : {}) };
      if (form.id) await updateUser(form.id, payload);
      else await createUser({ ...payload, password: form.password || 'maternalink123' });
      setForm(null);
      await reload();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan user');
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(row: AdminUserRecord) {
    if (!window.confirm(`Hapus/nonaktifkan user ${row.displayName || row.username}?`)) return;
    await deleteUser(row.id);
    await reload();
  }

  return (
    <AdminShell active="users" breadcrumb="User Accounts" user={user}>
      <div className={[styles.content, styles.usersContent].join(' ')}>
        <section className={[styles.pageHeader, styles.registryHeader].join(' ')}>
          <div><h1>User Accounts</h1><p>Manage healthcare personnel and IFK officer accounts</p></div>
          <button type="button" className={styles.primaryButton} onClick={() => setForm({ ...emptyForm, puskesmasId: puskesmas[0]?.id ?? '' })}><AppIcon name="plus" width={16} height={16} /> Add User</button>
        </section>

        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.userCard} aria-label="User account table">
          <div className={styles.roleTabs} role="tablist" aria-label="User role filters">
            {roleFilters.map((filter) => <button type="button" role="tab" aria-selected={activeFilter === filter} className={activeFilter === filter ? styles.activeTab : undefined} onClick={() => setActiveFilter(filter)} key={filter}>{filter}</button>)}
          </div>

          <div className={styles.tableScroller}>
            <table className={[styles.registryTable, styles.userTable].join(' ')}>
              <thead><tr><th>Name</th><th>Role</th><th>Facility</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredRows.map((row) => {
                  const name = row.displayName || row.username;
                  return (
                    <tr key={row.id}>
                      <td><span className={styles.userNameCell}><span className={styles.userInitials} data-tone={userTone(row.role)}>{initials(name)}</span><strong>{name}</strong></span></td>
                      <td>{roleLabel(row.role)}</td>
                      <td>{row.puskesmas?.nama ?? (row.role === 'IFK_ADMIN' ? 'IFK' : 'System')}</td>
                      <td><em>{row.username}</em></td>
                      <td><button type="button" className={row.active ? styles.activeBadge : styles.inactiveBadge} onClick={() => void updateUser(row.id, { active: !row.active }).then(reload)}>{row.active ? 'Active' : 'Inactive'}</button></td>
                      <td><div className={styles.iconActions}><button type="button" aria-label={`Edit ${name}`} onClick={() => editRow(row)}><AppIcon name="edit" width={16} height={16} /></button><button type="button" aria-label={`Delete ${name}`} onClick={() => void removeRow(row)}><AppIcon name="trash" width={16} height={16} /></button></div></td>
                    </tr>
                  );
                })}
                {filteredRows.length === 0 ? <tr><td colSpan={6}>Belum ada user dari database untuk filter ini.</td></tr> : null}
              </tbody>
            </table>
          </div>

          <footer className={styles.registryPagination}><p>Showing {filteredRows.length} of {rows.length} users</p></footer>
        </section>
      </div>

      {form ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setForm(null)}>
          <form className={styles.modalCard} onSubmit={(event) => void submitForm(event)} onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.drawerHeader}><h2>{form.id ? 'Edit User' : 'Add User'}</h2><button type="button" onClick={() => setForm(null)}><AppIcon name="circleStop" width={18} height={18} /></button></header>
            <label>Display name<input required value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></label>
            <label>Username<input required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
            <label>Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}><option value="BIDAN_PUSKESMAS">Midwife</option><option value="IFK_ADMIN">IFK Officer</option><option value="SUPER_ADMIN">Super Admin</option></select></label>
            {form.role === 'BIDAN_PUSKESMAS' ? <label>Puskesmas<select required value={form.puskesmasId} onChange={(event) => setForm({ ...form, puskesmasId: event.target.value })}>{puskesmas.map((item) => <option value={item.id} key={item.id}>{item.nama}</option>)}</select></label> : null}
            <label>Password<input type="password" minLength={6} required={!form.id} placeholder={form.id ? 'Kosongkan jika tidak diganti' : 'Minimal 6 karakter'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
            <label className={styles.checkboxRow}><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Active</label>
            <div className={styles.modalActions}><button type="button" onClick={() => setForm(null)}>Cancel</button><button className={styles.primaryButton} disabled={saving} type="submit">{saving ? 'Saving' : 'Save'}</button></div>
          </form>
        </div>
      ) : null}
    </AdminShell>
  );
}
