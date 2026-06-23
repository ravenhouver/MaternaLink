'use client';

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { NotificationCenter } from '@/components/layout/notification-center';
import { RoleLogoutButton } from '@/components/layout/role-logout-button';
import { AppIcon } from '@/components/ui/app-icon';
import {
  approvePendingRecommendations,
  approveRecommendation,
  addTrackingEvent,
  deleteRecommendation,
  getCurrentUser,
  getRecommendationTracking,
  getRecommendations,
  rejectRecommendation,
  reorderRecommendations,
  updateRecommendationMeta,
  updateRecommendationItem,
  type CurrentUser,
  type DistributionRecommendation,
  type RecommendationStatus,
  type RecommendationUrgency,
  type TrackingEvent,
  type TrackingStatus,
} from '@/lib/api';
import { getMedicineName } from '@/lib/medicine-i18n';
import { routes } from '@/lib/routes';
import styles from './medicine-sender.module.css';

type ModalKind = 'edit' | 'track' | 'filter' | 'approve' | 'reject' | 'delete' | null;
const pageSize = 8;
type UrgencyFilter = RecommendationUrgency | 'ALL';
type FilterOption = { label: string; value: string };

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
        <span />
        <div><strong>{user?.displayName ?? user?.username ?? 'IFK Operations'}</strong><small>{user?.role ?? 'IFK_ADMIN'}</small></div>
        <b>{(user?.displayName ?? user?.username ?? 'IF').slice(0, 2).toUpperCase()}</b>
      </div>
    </header>
  );
}

export function MedicineSenderRecommendationsContent() {
  const locale = useLocale();
  const [rows, setRows] = useState<DistributionRecommendation[]>([]);
  const [modal, setModal] = useState<ModalKind>(null);
  const [selected, setSelected] = useState<DistributionRecommendation | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RecommendationStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [page, setPage] = useState(1);

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
    setPage(1);
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

  async function removeSelected() {
    if (!selected) return;
    setError(null);
    try {
      await deleteRecommendation(selected.id);
      setModal(null);
      await refreshRows();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Gagal menghapus rekomendasi');
    }
  }

  async function approveAllPending() {
    const pendingIds = rows.filter((row) => row.status === 'PENDING').map((row) => row.id);
    if (!pendingIds.length) return;
    setIsBulkApproving(true);
    setError(null);
    try {
      setRows(await approvePendingRecommendations(pendingIds));
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'Gagal menyetujui semua rekomendasi pending');
    } finally {
      setIsBulkApproving(false);
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
            <a href={routes.ifkDecisionHistory}><AppIcon name="fileText" width={16} height={16} />Decision History</a>
          </section>
          <section className={styles.recoStats}>{stats.map((stat) => <article className={styles[stat.tone]} key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></article>)}</section>
          <section className={styles.recoToolbar}>
            <button type="button" onClick={() => setModal('filter')}><AppIcon name="filter" width={16} height={16} />Filter <AppIcon name="chevronDown" width={14} height={14} /></button>
            <button type="button" onClick={() => void refreshRows()}><AppIcon name="rotateCcw" width={18} height={18} />Refresh</button>
          </section>
          {error ? <p className={styles.recoError}>{error}</p> : null}
          <RecommendationTable
            locale={locale}
            isLoading={isLoading}
            rows={rows}
            page={page}
            onPageChange={setPage}
            onDragStart={setDraggingId}
            onDrop={dropOn}
            onOpen={(kind, row) => { setSelected(row); setModal(kind); }}
          />
          {modal === 'edit' && selected ? <EditModal locale={locale} row={selected} onClose={() => setModal(null)} onSaved={refreshRows} /> : null}
          {modal === 'track' && selected ? <TrackModal locale={locale} row={selected} onClose={() => setModal(null)} onSaved={refreshRows} /> : null}
          {modal === 'filter' ? <FilterModal statusFilter={statusFilter} onApply={(next) => { setStatusFilter(next); setModal(null); }} onClose={() => setModal(null)} /> : null}
          {modal === 'approve' && selected ? <ConfirmModal locale={locale} kind="approve" row={selected} onClose={() => setModal(null)} onConfirm={() => void decide('approve')} /> : null}
          {modal === 'reject' && selected ? <ConfirmModal locale={locale} kind="reject" row={selected} onClose={() => setModal(null)} onConfirm={(note) => void decide('reject', note)} /> : null}
          {modal === 'delete' && selected ? <DeleteModal row={selected} onClose={() => setModal(null)} onConfirm={() => void removeSelected()} /> : null}
          <RecommendationInsights rows={rows} isApproving={isBulkApproving} onApproveAll={() => void approveAllPending()} />
        </main>
      </div>
    </div>
  );
}

function dateInputValue(value: string) {
  return value.slice(0, 10);
}

function recommendationDispatchTime(row: DistributionRecommendation) {
  const routeSummary = row.routeSummary;
  if (routeSummary && typeof routeSummary === 'object' && !Array.isArray(routeSummary)) {
    const value = (routeSummary as Record<string, unknown>).dispatchTime;
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '09:00 WIB';
}

function medicineUnit(unit?: string) {
  return unit ? `(${unit})` : '(unit)';
}

function recommendationItemName(item: { obatId: string; obat?: { id: string; nama: string } }, locale: string) {
  return getMedicineName(item.obat ? { id: item.obat.id, nama: item.obat.nama } : { id: item.obatId }, locale);
}

function routeEstimate(row: DistributionRecommendation) {
  const routeSummary = row.routeSummary;
  if (routeSummary && typeof routeSummary === 'object' && !Array.isArray(routeSummary)) {
    const minutes = (routeSummary as Record<string, unknown>).estimateMinutes;
    if (typeof minutes === 'number') return `${minutes} Min`;
    if (typeof minutes === 'string' && minutes.trim()) return minutes;
  }
  const leadDays = row.puskesmas?.leadTimeHari;
  if (leadDays) return `${leadDays} day${leadDays > 1 ? 's' : ''}`;
  return 'Pending ETA';
}

function routeCourier(row: DistributionRecommendation) {
  const routeSummary = row.routeSummary;
  if (routeSummary && typeof routeSummary === 'object' && !Array.isArray(routeSummary)) {
    const courier = (routeSummary as Record<string, unknown>).courier;
    if (typeof courier === 'string' && courier.trim()) return courier;
  }
  return 'IFK Courier';
}

function itemTotal(row: DistributionRecommendation) {
  return row.items.reduce((total, item) => total + item.finalQuantity, 0);
}

function recommendationConfidence(row: DistributionRecommendation) {
  const source = row.source.toUpperCase();
  const sourceScore = source.includes('HF_AI') || source.includes('AI') ? 92 : source.includes('FALLBACK') ? 70 : 82;
  const changedItems = row.items.filter((item) => item.overrideQuantity != null && item.overrideQuantity !== item.aiQuantity).length;
  const overridePenalty = row.items.length ? Math.round((changedItems / row.items.length) * 18) : 0;
  const statusPenalty = row.status === 'REJECTED' || row.status === 'CANCELLED' ? 28 : row.status === 'PENDING' ? 6 : 0;
  return Math.max(0, Math.min(100, sourceScore - overridePenalty - statusPenalty));
}

function RecommendationInsights({ isApproving, onApproveAll, rows }: { isApproving: boolean; onApproveAll: () => void; rows: DistributionRecommendation[] }) {
  const activeRows = rows.filter((row) => row.status !== 'RECEIVED' && row.status !== 'CANCELLED').slice(0, 2);
  const pendingCount = rows.filter((row) => row.status === 'PENDING').length;
  const completed = rows.filter((row) => row.status !== 'PENDING' && row.status !== 'CANCELLED').length;
  const approved = rows.filter((row) => ['APPROVED', 'DISPATCHED', 'RECEIVED'].includes(row.status)).length;
  const criticalHandled = rows.filter((row) => row.urgency === 'CRITICAL' && row.status !== 'PENDING' && row.status !== 'REJECTED').length;
  const efficiency = rows.length ? Math.round((completed / rows.length) * 100) : 0;
  const confidence = rows.length ? Math.round(rows.reduce((total, row) => total + recommendationConfidence(row), 0) / rows.length) : 0;
  const equity = rows.filter((row) => row.urgency === 'CRITICAL').length ? Math.round((criticalHandled / rows.filter((row) => row.urgency === 'CRITICAL').length) * 100) : 100;
  const metrics = [
    { label: 'Efficiency Index', value: efficiency, tone: 'green' },
    { label: 'AI Confidence', value: confidence, tone: 'blue' },
    { label: 'Equity Score', value: equity, tone: 'green' },
  ];

  return (
    <section className={styles.recoFooterGrid}>
      <article className={styles.routeSummaryCard}>
        <h2><span><AppIcon name="route" width={20} height={20} /></span>Shipping Route Summary</h2>
        <div className={styles.routeList}>
          {activeRows.length ? activeRows.map((row) => (
            <div key={row.id}>
              <span><AppIcon name="truck" width={24} height={24} /></span>
              <div><strong>{row.puskesmas?.nama ?? row.puskesmasId}</strong><small>Total: {itemTotal(row)} Medical Items - Courier: {routeCourier(row)}</small></div>
              <em>Est. {routeEstimate(row)}</em>
            </div>
          )) : <div><span><AppIcon name="truck" width={24} height={24} /></span><div><strong>No active routes</strong><small>Approve pending recommendations to generate shipment routes.</small></div><em>-</em></div>}
        </div>
        <p><AppIcon name="info" width={16} height={16} />Route updated automatically based on clinic priority order.</p>
      </article>
      <div className={styles.approvalMetricColumn}>
        <article className={styles.approvalMetricCard}>
          <h2>Approval Metrics</h2>
          {metrics.map((metric) => <div className={styles.approvalMetricRow} key={metric.label}><div><span>{metric.label}</span><strong className={styles[metric.tone]}>{metric.value}%</strong></div><p><i className={styles[metric.tone]} style={{ width: `${metric.value}%` }} /></p></div>)}
          <small>{approved} approved decisions - {pendingCount} pending review</small>
        </article>
        <button className={styles.approveAllButton} type="button" disabled={!pendingCount || isApproving} onClick={onApproveAll}><span><AppIcon name="checkCircle" width={24} height={24} /></span>{isApproving ? 'Approving...' : 'Approve All Pending'}</button>
      </div>
    </section>
  );
}

function RecommendationTable({ isLoading, locale, onDragStart, onDrop, onOpen, onPageChange, page, rows }: { isLoading: boolean; locale: string; onDragStart: (id: string) => void; onDrop: (id: string) => void; onOpen: (modal: Exclude<ModalKind, 'filter' | null>, row: DistributionRecommendation) => void; onPageChange: (page: number) => void; page: number; rows: DistributionRecommendation[] }) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const dragHint = locale === 'id' ? 'Seret baris untuk mengubah urutan prioritas pengiriman' : 'Drag rows to reorder delivery priority';

  useEffect(() => { if (page > totalPages) onPageChange(totalPages); }, [onPageChange, page, totalPages]);

  return (
    <section className={styles.recoTablePanel}>
      <div className={styles.recoDragHint}><AppIcon name="gripVertical" width={14} height={14} />{dragHint}</div>
      <div className={styles.recoTableWrap}>
        <table className={styles.recoTable}>
          <thead><tr><th /><th>#</th><th>Nama Klinik</th><th>Obat Dikirim</th><th>Dispatch</th><th>Urgency</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={8}>Loading recommendations...</td></tr> : null}
            {!isLoading && rows.length === 0 ? <tr><td colSpan={8}>No recommendations found.</td></tr> : null}
            {pageRows.map((row, index) => (
              <tr draggable className={row.urgency === 'CRITICAL' ? styles.recoHighlightedRow : undefined} key={row.id} onDragStart={() => onDragStart(row.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => onDrop(row.id)}>
                <td><AppIcon name="gripVertical" width={16} height={16} /></td>
                <td>{(safePage - 1) * pageSize + index + 1}</td>
                <td><strong>{row.puskesmas?.nama ?? row.puskesmasId}</strong><span className={[styles.recoSourceTag, styles.blue].join(' ')}>{row.source}</span><p>{row.justification ?? '-'}</p></td>
                <td>{row.items.map((item) => `${recommendationItemName(item, locale)} (${item.finalQuantity} ${item.obat?.satuan ?? ''})`).join(', ')}</td>
                <td><strong>{new Date(row.periode).toLocaleDateString('id-ID')}</strong><small>Priority #{row.priorityRank}</small></td>
                <td><StatusBadge urgency={row.urgency} /></td>
                <td>{row.status === 'PENDING' ? <em>Pending Approval</em> : <span className={recommendationStatusLabel(row) === 'ISSUE_REPORTED' ? styles.issuePill : styles.approvedPill}>{recommendationStatusLabel(row)}</span>}</td>
                <td><div className={styles.recoActions}>
                  {row.status === 'PENDING' ? <button type="button" className={styles.approveButton} onClick={() => onOpen('approve', row)}>Approve</button> : <button type="button" className={styles.trackButton} onClick={() => onOpen('track', row)}>Track</button>}
                  {row.status === 'PENDING' ? <button type="button" className={styles.rejectButton} onClick={() => onOpen('reject', row)}>Reject</button> : null}
                  <button type="button" aria-label={`Edit ${row.id}`} onClick={() => onOpen('edit', row)}><AppIcon name="edit" width={16} height={16} /></button>
                  <button type="button" aria-label={`Delete ${row.id}`} onClick={() => onOpen('delete', row)}><AppIcon name="trash" width={16} height={16} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.recoPagination}><span>Showing {pageRows.length} of {rows.length} entries</span><div><button type="button" disabled={safePage <= 1} onClick={() => onPageChange(Math.max(1, safePage - 1))}><AppIcon name="chevronLeft" width={14} height={14} /></button><button type="button" className={styles.currentPage}>{safePage}</button><button type="button" disabled={safePage >= totalPages} onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}><AppIcon name="chevronRight" width={14} height={14} /></button></div></div>
    </section>
  );
}

function EditModal({ locale, onClose, onSaved, row }: { locale: string; onClose: () => void; onSaved: () => Promise<void>; row: DistributionRecommendation }) {
  const [date, setDate] = useState(dateInputValue(row.periode));
  const [priority, setPriority] = useState(String(row.priorityRank));
  const [dispatchTime, setDispatchTime] = useState(recommendationDispatchTime(row));
  const [quantities, setQuantities] = useState<Record<string, string>>(() => Object.fromEntries(row.items.map((item) => [item.id, String(item.finalQuantity)])));
  const [reason, setReason] = useState(row.items.find((item) => item.overrideReason)?.overrideReason ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const parsedPriority = Number(priority);
  const parsedItems = row.items.map((item) => ({ item, quantity: Number(quantities[item.id] ?? item.finalQuantity) }));
  const requiresReason = parsedItems.some(({ item, quantity }) => quantity !== item.aiQuantity);
  const metaChanged = date !== dateInputValue(row.periode) || parsedPriority !== row.priorityRank || dispatchTime !== recommendationDispatchTime(row);
  const firstChanged = parsedItems.find(({ item, quantity }) => quantity !== item.aiQuantity);
  const aiFocus = firstChanged ?? parsedItems[0];
  const firstChangedDiff = aiFocus ? aiFocus.quantity - aiFocus.item.aiQuantity : 0;

  function updateQuantity(itemId: string, value: string) {
    setQuantities((current) => ({ ...current, [itemId]: value }));
  }

  function resetItem(itemId: string, aiQuantity: number) {
    setQuantities((current) => ({ ...current, [itemId]: String(aiQuantity) }));
  }

  async function save() {
    setError(null);
    if (!date || !Number.isInteger(parsedPriority) || parsedPriority < 1) {
      setError('Dispatch date and priority must be valid.');
      return;
    }
    if (parsedItems.some(({ quantity }) => !Number.isInteger(quantity) || quantity < 0)) {
      setError('Override quantity must be a non-negative whole number.');
      return;
    }
    if (requiresReason && !reason.trim()) {
      setError('Reason must be filled before saving');
      return;
    }

    setIsSaving(true);
    try {
      if (metaChanged) await updateRecommendationMeta(row.id, { periode: date, priorityRank: parsedPriority, dispatchTime });
      await Promise.all(parsedItems.map(({ item, quantity }) => {
        const reasonChanged = item.overrideReason !== reason.trim() && quantity !== item.aiQuantity;
        if (quantity === item.finalQuantity && !reasonChanged) return Promise.resolve();
        if (quantity === item.aiQuantity) return updateRecommendationItem(row.id, item.id, {});
        return updateRecommendationItem(row.id, item.id, { overrideQuantity: quantity, overrideReason: reason.trim() });
      }));
      await onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan override');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell onClose={onClose} size="edit">
      <div className={styles.editModalHeader}>
        <div><h2>Edit Distribution</h2><p>{row.puskesmas?.nama ?? row.puskesmasId} - ID: {row.id}</p></div>
        <span>{row.urgency}</span>
      </div>
      <div className={styles.editModalBody}>
        <section>
          <h3>Schedule & Priority</h3>
          <div className={styles.editScheduleGrid}>
            <label>Dispatch Date<span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></span></label>
            <label>Delivery Priority<span><input min="1" inputMode="numeric" value={priority} onChange={(event) => setPriority(event.target.value)} /></span><small>Rank #{priority || '-'} = first delivery</small></label>
            <label>Dispatch Time<span><input value={dispatchTime} onChange={(event) => setDispatchTime(event.target.value)} /></span><small className={styles.dangerText}>Time is very tight</small></label>
          </div>
          <div className={styles.infoBox}><AppIcon name="info" width={16} height={16} />Changing priorities will automatically update the route and courier schedule for this distribution cluster.</div>
        </section>
        <section>
          <div className={styles.sectionTitleRow}><h3>Amount of Medicine Sent</h3><button type="button"><AppIcon name="plus" width={14} height={14} />Add Medication</button></div>
          <div className={styles.editMedicineScroll}>
            <table className={styles.editMedicineTable}>
              <thead><tr><th>Medication Name</th><th>AI Qty</th><th>Override Qty</th><th>Difference</th><th>Action</th></tr></thead>
              <tbody>{row.items.map((item) => {
                const quantity = Number(quantities[item.id] ?? item.finalQuantity);
                const diff = quantity - item.aiQuantity;
                const changed = diff !== 0;
                const itemName = recommendationItemName(item, locale);
                return <tr key={item.id}><td><strong>{itemName}</strong><small>{medicineUnit(item.obat?.satuan)}</small></td><td>{item.aiQuantity}</td><td><input className={changed ? styles.changedQty : undefined} inputMode="numeric" value={quantities[item.id] ?? ''} onChange={(event) => updateQuantity(item.id, event.target.value)} /></td><td className={changed ? styles.differenceDanger : styles.differenceNeutral}>{changed ? diff : '-'}</td><td><button aria-label={`Reset ${itemName}`} type="button" onClick={() => resetItem(item.id, item.aiQuantity)}><AppIcon name="trash" width={16} height={16} /></button></td></tr>;
              })}</tbody>
            </table>
          </div>
        </section>
        {aiFocus ? <section className={styles.aiBox}><h3><AppIcon name="archive" width={16} height={16} />AI Analysis</h3><p>{firstChanged ? (firstChangedDiff < 0 ? 'Reducing' : 'Increasing') : 'Maintaining'} {recommendationItemName(aiFocus.item, locale)}: {aiFocus.item.aiQuantity} to {aiFocus.quantity} {aiFocus.item.obat?.satuan ?? 'unit'}</p><div><strong>Coverage <b>{Math.max(1, Math.round(aiFocus.item.aiQuantity / 5))} days to {Math.max(1, Math.round(aiFocus.quantity / 5))} days</b></strong><span><i />{firstChanged ? (firstChangedDiff < 0 ? 'Stockout risk increased sharply' : 'Coverage buffer increased') : 'AI recommendation is unchanged'}</span></div></section> : null}
        <section>
          <h3>Reason for Change <b>Required</b></h3>
          <textarea value={reason} placeholder="e.g., reserve stock already sent directly to the clinic" onChange={(event) => setReason(event.target.value)} />
          {(error || (requiresReason && !reason.trim())) ? <small className={styles.errorText}>{error ?? 'Reason must be filled before saving'}</small> : null}
        </section>
      </div>
      <div className={styles.editModalFooter}><button type="button" onClick={onClose}><AppIcon name="arrowLeft" width={16} height={16} />Back to AI Recommendations</button><span><button type="button" onClick={onClose}>Cancel</button><button type="button" disabled={isSaving} onClick={() => void save()}><AppIcon name="save" width={16} height={16} />{isSaving ? 'Saving...' : 'Save Changes'}</button></span></div>
    </ModalShell>
  );
}

function trackingOptions(row: DistributionRecommendation): TrackingStatus[] {
  if (row.status === 'APPROVED') return ['DISPATCHED'];
  if (row.status === 'DISPATCHED') return ['ISSUE_REPORTED'];
  return [];
}

const shipmentSteps: Array<{ status: TrackingStatus; label: string; pendingLabel: string; icon: 'checkCircle' | 'truck' | 'package' }> = [
  { status: 'REQUESTED', label: 'Requested', pendingLabel: 'Requested', icon: 'checkCircle' },
  { status: 'APPROVED', label: 'Approved', pendingLabel: 'Approved', icon: 'checkCircle' },
  { status: 'DISPATCHED', label: 'Dispatched', pendingLabel: 'Dispatched', icon: 'truck' },
  { status: 'RECEIVED', label: 'Received', pendingLabel: 'Received', icon: 'package' },
];

function routeSummaryValue(row: DistributionRecommendation, keys: string[]) {
  const routeSummary = row.routeSummary;
  if (!routeSummary || typeof routeSummary !== 'object' || Array.isArray(routeSummary)) return null;
  for (const key of keys) {
    const value = routeSummary[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return null;
}

function formatTrackDate(value?: string, variant: 'short' | 'time' | 'full' = 'short') {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (variant === 'time') return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  if (variant === 'full') return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function trackEventMap(events: TrackingEvent[]) {
  return events.reduce<Partial<Record<TrackingStatus, TrackingEvent>>>((acc, event) => {
    acc[event.status] ??= event;
    return acc;
  }, {});
}

function activeShipmentIndex(row: DistributionRecommendation, events: TrackingEvent[]) {
  const statuses = new Set<TrackingStatus>(events.map((event) => event.status));
  if (row.status === 'RECEIVED') statuses.add('RECEIVED');
  if (row.status === 'DISPATCHED') statuses.add('DISPATCHED');
  if (row.status === 'APPROVED') statuses.add('APPROVED');
  if (row.status === 'PENDING') statuses.add('REQUESTED');
  return Math.max(0, shipmentSteps.findLastIndex((step) => statuses.has(step.status)));
}

function shipmentStatusLabel(row: DistributionRecommendation) {
  if (row.status === 'DISPATCHED') return 'In Transit';
  if (row.status === 'APPROVED') return 'Approved';
  if (row.status === 'RECEIVED') return 'Received';
  if (row.status === 'REJECTED') return 'Rejected';
  return 'Pending';
}

function shipmentEta(row: DistributionRecommendation) {
  const routeEta = routeSummaryValue(row, ['eta', 'estimatedArrival', 'arrivalTime']);
  if (routeEta) return routeEta;
  const base = new Date(row.periode);
  if (!Number.isNaN(base.getTime())) {
    base.setDate(base.getDate() + (row.puskesmas?.leadTimeHari ?? 1));
    return formatTrackDate(base.toISOString(), 'full');
  }
  return 'Pending ETA';
}

function shipmentDistance(row: DistributionRecommendation) {
  const distance = row.puskesmas?.jarakKeIfkKm ?? routeSummaryValue(row, ['distanceKm', 'distance']);
  if (typeof distance === 'number') return `${distance} km`;
  if (typeof distance === 'string' && distance.trim()) return distance.includes('km') ? distance : `${distance} km`;
  return '24 km';
}

function shipmentHistoryText(event: TrackingEvent, row: DistributionRecommendation) {
  const clinic = row.puskesmas?.nama ?? row.puskesmasId;
  const labels: Record<TrackingStatus, string> = {
    REQUESTED: 'Request Created (Clinic)',
    APPROVED: 'Request Approved (IFK Admin)',
    REJECTED: 'Request Rejected (IFK Admin)',
    DISPATCHED: `Courier departed from ${routeSummaryValue(row, ['origin']) ?? 'Sleman District Pharmacy'} (${routeSummaryValue(row, ['originShort']) ?? 'IFK Kabupaten Sleman'})`,
    RECEIVED: `Shipment received by ${clinic}`,
    ISSUE_REPORTED: 'Issue reported on shipment route',
  };
  return event.note?.trim() || labels[event.status];
}

function TrackModal({ locale, onClose, onSaved, row }: { locale: string; onClose: () => void; onSaved: () => Promise<void>; row: DistributionRecommendation }) {
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

  const eventMap = trackEventMap(events);
  const activeIndex = activeShipmentIndex(row, events);
  const history = [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const clinicName = row.puskesmas?.nama ?? row.puskesmasId;
  const origin = routeSummaryValue(row, ['origin', 'from']) ?? 'IFK Kab. Sleman';
  const actionLabel = status === 'ISSUE_REPORTED' ? 'Report Issue' : status === 'DISPATCHED' ? 'Mark Dispatched' : 'Save Status';

  return (
    <ModalShell onClose={onClose} size="track">
      <div className={styles.trackHeader}>
        <div><h2>Track Shipment</h2><p>{clinicName} - ID: {row.id}</p></div>
        <span><AppIcon name="truck" width={14} height={14} />{shipmentStatusLabel(row)}</span>
      </div>
      <div className={styles.trackStepper} style={{ '--track-progress': `${activeIndex / (shipmentSteps.length - 1) * 100}%` } as CSSProperties}>
        {shipmentSteps.map((step, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          const event = eventMap[step.status];
          return (
            <div className={[styles.trackStep, done ? styles.done : '', active ? styles.active : ''].filter(Boolean).join(' ')} key={step.status}>
              <span><AppIcon name={done ? 'checkCircle' : step.icon} width={active ? 16 : 20} height={active ? 16 : 20} /></span>
              <strong>{step.label}</strong>
              <small>{event ? formatTrackDate(event.createdAt, 'time') : index > activeIndex ? `Est. ${formatTrackDate(row.periode)}` : '-'}</small>
            </div>
          );
        })}
      </div>
      <div className={styles.trackBody}>
        <section className={styles.shippingInfoPanel}>
          <h3><AppIcon name="clock" width={16} height={16} />Shipping Info</h3>
          <dl className={styles.trackInfoList}>
            <div><dt>Courier</dt><dd>{routeCourier(row)}</dd></div>
            <div><dt>Phone</dt><dd className={styles.trackLink}>+62 812-4455-xxxx</dd></div>
          </dl>
          <h4>Origin & Destination</h4>
          <div className={styles.routePair}><i /><div><strong>{origin}</strong><strong>{clinicName}</strong></div></div>
          <dl className={styles.trackInfoList}>
            <div><dt>Distance</dt><dd>{shipmentDistance(row)}</dd></div>
          </dl>
          <div className={styles.etaBox}><span>Est. Arrival</span><strong>{shipmentEta(row)}</strong></div>
          <h4>Shipment Contents</h4>
          <ul className={styles.shipmentContentList}>{row.items.slice(0, 4).map((item) => <li key={item.id}>{recommendationItemName(item, locale)} ({item.finalQuantity} {item.obat?.satuan ?? 'unit'})</li>)}</ul>
        </section>
        <section className={styles.travelHistoryPanel}>
          <h3><AppIcon name="clock" width={16} height={16} />Travel History</h3>
          <div className={styles.historyTimeline}>{history.length === 0 ? <article><b>No tracking events</b><small>-</small><span>Tambahkan status pengiriman pertama.</span></article> : null}{history.map((event, index) => <article className={index === 0 ? styles.current : undefined} key={event.id}><b>{shipmentHistoryText(event, row)}</b><small>{formatTrackDate(event.createdAt, 'full')}</small></article>)}</div>
          <div className={styles.routeMapPreview}><span>Travel Route Map</span><AppIcon name="truck" width={24} height={24} /></div>
          {options.length ? <div className={styles.statusUpdateControls}><select aria-label="Next shipment status" value={status} onChange={(event) => setStatus(event.target.value as TrackingStatus)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><textarea value={note} placeholder="Catatan tracking" onChange={(event) => setNote(event.target.value)} /></div> : null}
          {error ? <small className={styles.errorText}>{error}</small> : null}
        </section>
      </div>
      <div className={styles.trackFooter}><button type="button"><AppIcon name="fileText" width={16} height={16} />View Full History</button><span><button type="button" onClick={onClose}>Close</button><button className={status === 'ISSUE_REPORTED' ? styles.modalDangerAction : styles.modalPrimaryAction} type="button" disabled={!options.length} onClick={() => void saveEvent()}>{status === 'ISSUE_REPORTED' ? <AppIcon name="alert" width={16} height={16} /> : null}{actionLabel}</button></span></div>
    </ModalShell>
  );
}

const urgencyFilterOptions: FilterOption[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'Warning', value: 'WARNING' },
  { label: 'Routine', value: 'ROUTINE' },
];

const approvalFilterOptions: FilterOption[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending Approval', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const medicineFilterOptions = ['Oxytocin', 'MgSO4', 'Tablet Fe', 'Vitamin K', 'Nifedipine'];
const districtFilterOptions = ['Cangkringan', 'Depok', 'Mlati', 'Sleman'];
const qtyFilterOptions = ['< 50', '51-100', '101-200', '> 200'];

function FilterChip({ active, children, onClick, tone = 'blue' }: { active: boolean; children: ReactNode; onClick: () => void; tone?: 'blue' | 'red' }) {
  return <button className={[styles.filterChip, active ? styles.selected : '', active && tone === 'red' ? styles.redSelected : ''].filter(Boolean).join(' ')} type="button" onClick={onClick}>{children}</button>;
}

function FilterModal({ onApply, onClose, statusFilter }: { onApply: (status: RecommendationStatus | 'ALL') => void; onClose: () => void; statusFilter: RecommendationStatus | 'ALL' }) {
  const [draft, setDraft] = useState(statusFilter);
  const [urgency, setUrgency] = useState<UrgencyFilter>('CRITICAL');
  const [medicine, setMedicine] = useState('Oxytocin');
  const [district, setDistrict] = useState('Cangkringan');
  const [qty, setQty] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('2023-10-27');
  const [endDate, setEndDate] = useState('2023-10-30');
  const activeCount = [draft !== 'ALL', Boolean(medicine), Boolean(district)].filter(Boolean).length;

  function resetAll() {
    setUrgency('ALL');
    setDraft('ALL');
    setMedicine('');
    setDistrict('');
    setQty(null);
    setStartDate('');
    setEndDate('');
  }

  return (
    <ModalShell onClose={onClose} size="filter">
      <div className={styles.filterHeader}><h2>Filter Distribution Recommendations</h2></div>
      <div className={styles.filterBody}>
        <section><h3>Urgency Status</h3><div>{urgencyFilterOptions.map((option) => <FilterChip key={option.value} active={urgency === option.value} tone={option.value === 'CRITICAL' ? 'red' : 'blue'} onClick={() => setUrgency(option.value as UrgencyFilter)}>{option.label}</FilterChip>)}</div></section>
        <section><h3>Approval Status</h3><div>{approvalFilterOptions.map((option) => <FilterChip key={option.value} active={draft === option.value} onClick={() => setDraft(option.value as RecommendationStatus | 'ALL')}>{option.label}</FilterChip>)}</div></section>
        <section><h3>Medicine Dispatched</h3><div>{medicineFilterOptions.map((option) => <FilterChip key={option} active={medicine === option} onClick={() => setMedicine(option)}>{option}</FilterChip>)}</div></section>
        <section><h3>District</h3><div>{districtFilterOptions.map((option) => <FilterChip key={option} active={district === option} onClick={() => setDistrict(option)}>{option}</FilterChip>)}</div></section>
        <section><h3>Dispatch Date</h3><div className={styles.dateInputs}><input aria-label="Dispatch start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /><input aria-label="Dispatch end date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div></section>
        <section><h3>Qty Total</h3><div>{qtyFilterOptions.map((option) => <FilterChip key={option} active={qty === option} onClick={() => setQty(option)}>{option}</FilterChip>)}</div></section>
      </div>
      <div className={styles.filterFooter}><span>{activeCount} active filter</span><div><button type="button" onClick={resetAll}>Reset All</button><button type="button" onClick={() => onApply(draft)}>Apply Filter (8 results)</button></div></div>
    </ModalShell>
  );
}

function ConfirmModal({ kind, locale, onClose, onConfirm, row }: { kind: 'approve' | 'reject'; locale: string; onClose: () => void; onConfirm: (note?: string) => void; row: DistributionRecommendation }) {
  const approve = kind === 'approve';
  const clinicName = row.puskesmas?.nama ?? row.puskesmasId;
  return (
    <ModalShell onClose={onClose} size="confirm">
      <div className={styles.confirmBox}>
        <div className={styles.confirmTitleRow}>
          <span className={approve ? styles.confirmIcon : styles.rejectIcon}>{approve ? <AppIcon name="checkCircle" width={22} height={22} /> : <AppIcon name="x" width={22} height={22} />}</span>
          <h2>{approve ? 'Shipment Confirmation' : 'Reject Shipment'}</h2>
        </div>
        <p>You are about to {approve ? 'approve' : 'reject'} shipment recommendation <b>#{row.id}</b> for <b>{clinicName}</b>. {approve ? 'The shipment will be immediately sent to the logistics operator for processing.' : 'Rejection will immediately notify the clinic and the request will be moved to the archive.'}</p>
        <div className={styles.shipmentSummaryBox}>
          <div><small>Main Content</small><strong>{row.items.slice(0, 2).map((item) => `${recommendationItemName(item, locale)} (${item.finalQuantity} ${item.obat?.satuan ?? 'unit'})`).join(', ') || '-'}</strong></div>
          <div><small>Dispatch</small><strong>{new Date(row.periode).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</strong></div>
        </div>
        <footer><button type="button" onClick={onClose}>Cancel</button><button className={styles.modalPrimaryAction} type="button" onClick={() => onConfirm(approve ? undefined : 'Rejected by IFK review.')}>{approve ? 'Approve & Dispatch' : 'Reject'}</button></footer>
      </div>
    </ModalShell>
  );
}

function DeleteModal({ onClose, onConfirm, row }: { onClose: () => void; onConfirm: () => void; row: DistributionRecommendation }) {
  return <ModalShell onClose={onClose} size="confirm"><div className={styles.confirmBox}><span className={styles.rejectIcon}><AppIcon name="trash" width={24} height={24} /></span><h2>Delete Recommendation</h2><p>This will permanently delete recommendation <b>{row.id} for {row.puskesmas?.nama ?? row.puskesmasId}.</b></p><footer><button type="button" onClick={onClose}>Cancel</button><button className={styles.modalDangerAction} type="button" onClick={onConfirm}>Delete</button></footer></div></ModalShell>;
}

function ModalShell({ children, onClose, size }: { children: ReactNode; onClose: () => void; size: 'edit' | 'track' | 'filter' | 'confirm' }) {
  return <div className={styles.recoOverlay} role="presentation" onMouseDown={onClose}><div className={[styles.recoModal, styles[size]].join(' ')} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>{children}<button className={styles.modalClose} type="button" aria-label="Close modal" onClick={onClose}><AppIcon name="x" width={18} height={18} /></button></div></div>;
}
