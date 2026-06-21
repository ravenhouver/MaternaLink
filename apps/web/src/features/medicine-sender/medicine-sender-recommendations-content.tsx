'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { NotificationCenter } from '@/components/layout/notification-center';
import { RoleLogoutButton } from '@/components/layout/role-logout-button';
import { AppIcon } from '@/components/ui/app-icon';
import {
  approveRecommendation,
  addTrackingEvent,
  getCurrentUser,
  getRecommendationTracking,
  getRecommendations,
  rejectRecommendation,
  reorderRecommendations,
  runIfkAiAllocation,
  updateRecommendationItem,
  type CurrentUser,
  type DistributionRecommendation,
  type RecommendationStatus,
  type RecommendationUrgency,
  type TrackingEvent,
  type TrackingStatus,
} from '@/lib/api';
import { routes } from '@/lib/routes';
import styles from './medicine-sender.module.css';

type ModalKind = 'edit' | 'track' | 'filter' | 'approve' | 'reject' | null;

const urgencyLabel: Record<RecommendationUrgency, string> = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  ROUTINE: 'routine',
};

function StatusBadge({ urgency }: { urgency: RecommendationUrgency }) {
  return <span className={[styles.recoBadge, styles[urgencyLabel[urgency]]].join(' ')}>{urgency}</span>;
}

function latestTrackingStatus(row: DistributionRecommendation) {
  return [...(row.trackingEvents ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.status;
}

function recommendationStatusLabel(row: DistributionRecommendation) {
  return row.status === 'DISPATCHED' && latestTrackingStatus(row) === 'ISSUE_REPORTED' ? 'ISSUE_REPORTED' : row.status;
}

function RecommendationsSidebar() {
  return (
    <aside className={styles.recoSidebar} aria-label="Medicine sender navigation">
      <div className={styles.recoBrand}>
        <span><AppIcon name="briefcase" width={20} height={20} /></span>
        <div><strong>IFK</strong><small>District Monitoring</small></div>
      </div>
      <nav className={styles.recoNav} aria-label="Navigasi IFK">
        <a href={routes.ifk}><AppIcon name="home" width={20} height={20} />Dashboard</a>
        <a className={styles.recoNavActive} href={routes.ifkRecommendations}><AppIcon name="userPlus" width={20} height={20} />Distribution</a>
        <a href={routes.ifkClinics}><AppIcon name="users" width={20} height={20} />Clinic List</a>
        <a href={routes.ifkEnvironment}><AppIcon name="calendar" width={20} height={20} />Environment Monitoring</a>
      </nav>
      <div className={styles.recoSidebarFooter}>
        <RoleLogoutButton className={styles.recoLogoutButton} />
      </div>
    </aside>
  );
}

function RecommendationsTopbar({ user }: { user: CurrentUser | null }) {
  return (
    <header className={styles.recoTopbar}>
      <div className={styles.recoCrumbs}>
        <span>Home</span>
        <AppIcon name="chevronRight" width={14} height={14} />
        <span>IFK</span>
        <AppIcon name="chevronRight" width={14} height={14} />
        <strong>Distribution Recommendations</strong>
      </div>
      <div className={styles.recoTopActions}>
        {user ? <NotificationCenter user={user} /> : null}
        <button type="button" aria-label="Pengaturan" onClick={() => window.location.assign(routes.ifkEnvironment)}><AppIcon name="settings" width={18} height={18} /></button>
        <span />
        <div><strong>{user?.displayName ?? user?.username ?? 'IFK Operations'}</strong><small>{user?.role ?? 'IFK_ADMIN'}</small></div>
        <b>{(user?.displayName ?? user?.username ?? 'IF').slice(0, 2).toUpperCase()}</b>
      </div>
    </header>
  );
}

export function MedicineSenderRecommendationsContent() {
  const [rows, setRows] = useState<DistributionRecommendation[]>([]);
  const [modal, setModal] = useState<ModalKind>(null);
  const [selected, setSelected] = useState<DistributionRecommendation | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RecommendationStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isAllocating, setIsAllocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);

  async function refreshRows() {
    setIsLoading(true);
    setError(null);
    try {
      setRows(await getRecommendations(statusFilter === 'ALL' ? undefined : { status: statusFilter }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat rekomendasi');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refreshRows();
  }, [statusFilter]);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  const stats = useMemo(() => {
    const critical = rows.filter((row) => row.urgency === 'CRITICAL').length;
    const warning = rows.filter((row) => row.urgency === 'WARNING').length;
    const routine = rows.filter((row) => row.urgency === 'ROUTINE').length;
    const pending = rows.filter((row) => row.status === 'PENDING').length;
    return [
      { label: 'Critical', value: String(critical).padStart(2, '0'), tone: 'critical' },
      { label: 'Warning', value: String(warning).padStart(2, '0'), tone: 'warning' },
      { label: 'Routine', value: String(routine).padStart(2, '0'), tone: 'routine' },
      { label: 'Total Pending', value: String(pending).padStart(2, '0'), tone: 'total' },
    ];
  }, [rows]);

  async function persistReorder(nextRows: DistributionRecommendation[]) {
    const previousRows = rows;
    setRows(nextRows);
    try {
      setRows(await reorderRecommendations(nextRows.map((row) => row.id)));
    } catch (reorderError) {
      setRows(previousRows);
      setError(reorderError instanceof Error ? reorderError.message : 'Gagal mengubah urutan rekomendasi');
    }
  }

  function moveRow(id: string, direction: -1 | 1) {
    const index = rows.findIndex((row) => row.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= rows.length) return;
    const nextRows = [...rows];
    [nextRows[index], nextRows[nextIndex]] = [nextRows[nextIndex], nextRows[index]];
    void persistReorder(nextRows);
  }

  function dropOn(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const from = rows.findIndex((row) => row.id === draggingId);
    const to = rows.findIndex((row) => row.id === targetId);
    if (from < 0 || to < 0) return;
    const nextRows = [...rows];
    const [moved] = nextRows.splice(from, 1);
    nextRows.splice(to, 0, moved);
    setDraggingId(null);
    void persistReorder(nextRows);
  }

  async function decide(kind: 'approve' | 'reject', note?: string) {
    if (!selected) return;
    setError(null);
    try {
      if (kind === 'approve') await approveRecommendation(selected.id);
      if (kind === 'reject') await rejectRecommendation(selected.id, note || 'Rejected by IFK review.');
      setModal(null);
      await refreshRows();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : 'Gagal menyimpan keputusan');
    }
  }

  async function runAllocation() {
    setIsAllocating(true);
    setError(null);
    try {
      await runIfkAiAllocation({ periode: currentPeriod() });
      await refreshRows();
    } catch (allocationError) {
      setError(allocationError instanceof Error ? allocationError.message : 'Gagal menjalankan alokasi AI');
    } finally {
      setIsAllocating(false);
    }
  }

  return (
    <div className={styles.recoShell}>
      <RecommendationsSidebar />
      <div className={styles.recoWorkspace}>
        <RecommendationsTopbar user={user} />
        <main className={styles.recoPage}>
          <section className={styles.recoTitleRow}>
            <div><p>Logistics Intelligence</p><h1>Distribution Recommendations</h1></div>
            <a href={routes.ifkDecisionHistory}>Decision History</a>
          </section>
          <section className={styles.recoStats}>{stats.map((stat) => <article className={styles[stat.tone]} key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></article>)}</section>
          <section className={styles.recoToolbar}>
            <button type="button" onClick={() => setModal('filter')}><AppIcon name="filter" width={16} height={16} />Filter <AppIcon name="chevronDown" width={14} height={14} /></button>
            <button type="button" disabled={isAllocating} onClick={() => void runAllocation()}><AppIcon name="zap" width={18} height={18} />{isAllocating ? 'Running AI...' : 'Run AI Allocation'}</button>
            <button type="button" onClick={() => void refreshRows()}><AppIcon name="rotateCcw" width={18} height={18} />Refresh</button>
          </section>
          {error ? <p className={styles.recoError}>{error}</p> : null}
          <RecommendationTable
            isLoading={isLoading}
            rows={rows}
            onDragStart={setDraggingId}
            onDrop={dropOn}
            onMove={moveRow}
            onOpen={(kind, row) => { setSelected(row); setModal(kind); }}
          />
          {modal === 'edit' && selected ? <EditModal row={selected} onClose={() => setModal(null)} onSaved={refreshRows} /> : null}
          {modal === 'track' && selected ? <TrackModal row={selected} onClose={() => setModal(null)} onSaved={refreshRows} /> : null}
          {modal === 'filter' ? <FilterModal statusFilter={statusFilter} onApply={(next) => { setStatusFilter(next); setModal(null); }} onClose={() => setModal(null)} /> : null}
          {modal === 'approve' && selected ? <ConfirmModal kind="approve" row={selected} onClose={() => setModal(null)} onConfirm={() => void decide('approve')} /> : null}
          {modal === 'reject' && selected ? <ConfirmModal kind="reject" row={selected} onClose={() => setModal(null)} onConfirm={(note) => void decide('reject', note)} /> : null}
        </main>
      </div>
    </div>
  );
}

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function RecommendationTable({ isLoading, onDragStart, onDrop, onMove, onOpen, rows }: { isLoading: boolean; onDragStart: (id: string) => void; onDrop: (id: string) => void; onMove: (id: string, direction: -1 | 1) => void; onOpen: (modal: Exclude<ModalKind, 'filter' | null>, row: DistributionRecommendation) => void; rows: DistributionRecommendation[] }) {
  return (
    <section className={styles.recoTablePanel}>
      <div className={styles.recoDragHint}><AppIcon name="gripVertical" width={14} height={14} />Seret baris untuk mengubah urutan prioritas pengiriman</div>
      <div className={styles.recoTableWrap}>
        <table className={styles.recoTable}>
          <thead><tr><th /><th>#</th><th>Nama Klinik</th><th>Obat Dikirim</th><th>Dispatch</th><th>Urgency</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={8}>Loading recommendations...</td></tr> : null}
            {!isLoading && rows.length === 0 ? <tr><td colSpan={8}>No recommendations found.</td></tr> : null}
            {rows.map((row, index) => (
              <tr draggable className={row.urgency === 'CRITICAL' ? styles.recoHighlightedRow : undefined} key={row.id} onDragStart={() => onDragStart(row.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => onDrop(row.id)}>
                <td><AppIcon name="gripVertical" width={16} height={16} /></td>
                <td>{index + 1}</td>
                <td><strong>{row.puskesmas?.nama ?? row.puskesmasId}</strong><span className={[styles.recoSourceTag, styles.blue].join(' ')}>{row.source}</span><p>{row.justification ?? '-'}</p></td>
                <td>{row.items.map((item) => `${item.obat?.nama ?? item.obatId} (${item.finalQuantity} ${item.obat?.satuan ?? ''})`).join(', ')}</td>
                <td><strong>{new Date(row.periode).toLocaleDateString('id-ID')}</strong><small>Priority #{row.priorityRank}</small></td>
                <td><StatusBadge urgency={row.urgency} /></td>
                <td>{row.status === 'PENDING' ? <em>Pending Approval</em> : <span className={recommendationStatusLabel(row) === 'ISSUE_REPORTED' ? styles.issuePill : styles.approvedPill}>{recommendationStatusLabel(row)}</span>}</td>
                <td><div className={styles.recoActions}>
                  {row.status === 'PENDING' ? <button type="button" className={styles.approveButton} onClick={() => onOpen('approve', row)}>Approve</button> : <button type="button" className={styles.trackButton} onClick={() => onOpen('track', row)}>Track</button>}
                  {row.status === 'PENDING' ? <button type="button" className={styles.rejectButton} onClick={() => onOpen('reject', row)}>Reject</button> : null}
                  <button type="button" aria-label={`Edit ${row.id}`} onClick={() => onOpen('edit', row)}><AppIcon name="edit" width={16} height={16} /></button>
                  <button type="button" aria-label="Move up" onClick={() => onMove(row.id, -1)}><AppIcon name="chevronLeft" width={16} height={16} /></button>
                  <button type="button" aria-label="Move down" onClick={() => onMove(row.id, 1)}><AppIcon name="chevronRight" width={16} height={16} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.recoPagination}><span>Showing {rows.length} entries</span></div>
    </section>
  );
}

function EditModal({ onClose, onSaved, row }: { onClose: () => void; onSaved: () => Promise<void>; row: DistributionRecommendation }) {
  const item = row.items[0];
  const [quantity, setQuantity] = useState(String(item?.overrideQuantity ?? item?.finalQuantity ?? 0));
  const [reason, setReason] = useState(item?.overrideReason ?? '');
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!item) return;
    setError(null);
    try {
      await updateRecommendationItem(row.id, item.id, { overrideQuantity: Number(quantity), overrideReason: reason });
      await onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan override');
    }
  }

  return <ModalShell onClose={onClose} size="edit"><div className={styles.editModalHeader}><div><h2>Edit Distribution</h2><p>{row.puskesmas?.nama ?? row.puskesmasId} • {row.id}</p></div><span>{row.urgency}</span></div><div className={styles.editModalBody}><section><h3>Amount of Medicine Sent</h3><label>Override Qty<span><input value={quantity} inputMode="numeric" onChange={(event) => setQuantity(event.target.value)} /></span></label></section><section><h3>Reason for Change <b>Required</b></h3><textarea value={reason} placeholder="Reserve stock retained at IFK" onChange={(event) => setReason(event.target.value)} />{error ? <small className={styles.errorText}>{error}</small> : null}</section></div><div className={styles.editModalFooter}><button type="button" onClick={onClose}>Cancel</button><span><button type="button" onClick={() => void save()}>Save Changes</button></span></div></ModalShell>;
}

function trackingOptions(row: DistributionRecommendation): TrackingStatus[] {
  if (row.status === 'APPROVED') return ['DISPATCHED'];
  if (row.status === 'DISPATCHED') return ['ISSUE_REPORTED'];
  return [];
}

function TrackModal({ onClose, onSaved, row }: { onClose: () => void; onSaved: () => Promise<void>; row: DistributionRecommendation }) {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const options = trackingOptions(row);
  const [status, setStatus] = useState<TrackingStatus>(options[0] ?? 'DISPATCHED');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function refreshEvents() {
    setEvents(await getRecommendationTracking(row.id));
  }

  useEffect(() => { void refreshEvents(); }, [row.id]);

  async function saveEvent() {
    setError(null);
    try {
      await addTrackingEvent(row.id, { status, note: note.trim() || undefined });
      setNote('');
      await refreshEvents();
      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal memperbarui tracking');
    }
  }

  return <ModalShell onClose={onClose} size="track"><div className={styles.trackHeader}><div><h2>Track Shipment</h2><p>{row.puskesmas?.nama ?? row.puskesmasId} • {row.id}</p></div><span><AppIcon name="truck" width={14} height={14} />{row.status}</span></div><div className={styles.trackBody}><section><h3><AppIcon name="clock" width={15} height={15} />Travel History</h3><div className={styles.historyTimeline}>{events.length === 0 ? <article><b>No tracking events</b><small>-</small><span>Tambahkan status pengiriman pertama.</span></article> : null}{events.map((event) => <article key={event.id}><b>{event.status}</b><small>{new Date(event.createdAt).toLocaleString('id-ID')}</small><span>{event.note ?? '-'}</span></article>)}</div></section><section><h3>Update Status</h3>{options.length ? <><select value={status} onChange={(event) => setStatus(event.target.value as TrackingStatus)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><textarea value={note} placeholder="Catatan tracking" onChange={(event) => setNote(event.target.value)} /></> : <p>Status pengiriman tidak bisa diperbarui dari tahap ini.</p>}{error ? <small className={styles.errorText}>{error}</small> : null}</section></div><div className={styles.trackFooter}><a href={routes.ifkDecisionHistory}><AppIcon name="fileText" width={14} height={14} />View Full History</a><span><button type="button" onClick={onClose}>Close</button><button type="button" disabled={!options.length} onClick={() => void saveEvent()}>Save Status</button></span></div></ModalShell>;
}

function FilterModal({ onApply, onClose, statusFilter }: { onApply: (status: RecommendationStatus | 'ALL') => void; onClose: () => void; statusFilter: RecommendationStatus | 'ALL' }) {
  const [draft, setDraft] = useState(statusFilter);
  return <ModalShell onClose={onClose} size="filter"><div className={styles.filterHeader}><h2>Filter Distribution Recommendations</h2></div><div className={styles.filterBody}><section><h3>Approval Status</h3><div>{(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'DISPATCHED', 'RECEIVED'] as const).map((status) => <button className={draft === status ? styles.selected : undefined} type="button" key={status} onClick={() => setDraft(status)}>{status}</button>)}</div></section></div><div className={styles.filterFooter}><button type="button" onClick={onClose}>Cancel</button><button type="button" onClick={() => onApply(draft)}>Apply Filter</button></div></ModalShell>;
}

function ConfirmModal({ kind, onClose, onConfirm, row }: { kind: 'approve' | 'reject'; onClose: () => void; onConfirm: (note?: string) => void; row: DistributionRecommendation }) {
  const [note, setNote] = useState('Rejected by IFK review.');
  const approve = kind === 'approve';
  return <ModalShell onClose={onClose} size="confirm"><div className={styles.confirmBox}><span className={approve ? styles.confirmIcon : styles.rejectIcon}>{approve ? <AppIcon name="checkCircle" width={24} height={24} /> : <AppIcon name="x" width={24} height={24} />}</span><h2>{approve ? 'Approve Recommendation' : 'Reject Shipment'}</h2><p>You are about to {approve ? 'approve' : 'reject'} recommendation <b>{row.id} for {row.puskesmas?.nama ?? row.puskesmasId}.</b></p>{approve ? null : <textarea value={note} onChange={(event) => setNote(event.target.value)} />}<footer><button type="button" onClick={onClose}>Cancel</button><button type="button" onClick={() => onConfirm(approve ? undefined : note)}>{approve ? 'Approve' : 'Reject'}</button></footer></div></ModalShell>;
}

function ModalShell({ children, onClose, size }: { children: ReactNode; onClose: () => void; size: 'edit' | 'track' | 'filter' | 'confirm' }) {
  return <div className={styles.recoOverlay} role="dialog" aria-modal="true"><div className={[styles.recoModal, styles[size]].join(' ')}>{children}<button className={styles.modalClose} type="button" aria-label="Close modal" onClick={onClose}><AppIcon name="x" width={22} height={22} /></button></div></div>;
}
