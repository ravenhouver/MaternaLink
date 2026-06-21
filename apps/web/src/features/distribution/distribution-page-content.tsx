'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import { addTrackingEvent, getRecommendations, rerequestRecommendation, type DistributionRecommendation, type RecommendationStatus, type TrackingEvent, type TrackingStatus } from '@/lib/api';
import { getMedicineName } from '@/lib/medicine-i18n';
import styles from './distribution.module.css';

type ShipmentStatus = 'transit' | 'awaiting' | 'delivered' | 'rejected' | 'issue';

type Shipment = {
  id: string;
  medicine: string;
  quantity: string;
  code: string;
  status: ShipmentStatus;
  statusLabel: string;
  statusMeta: string;
  icon: 'package' | 'hourglass' | 'checkCircle' | 'x';
  expanded?: boolean;
  borderTone: string;
  source: DistributionRecommendation;
  trackingEvents: TrackingEvent[];
  locale: string;
};

type RouteSummary = {
  courier?: string;
  route?: string;
  estimateMinutes?: number;
};

const filterChips = ['All', 'In Transit', 'Issue', 'Awaiting Approval', 'Approved', 'Received', 'Rejected'];

function matchesFilter(shipment: Shipment, filter: string) {
  if (filter === 'All') return true;
  if (filter === 'In Transit') return shipment.status === 'transit' && shipment.statusLabel === 'In Transit';
  if (filter === 'Issue') return shipment.status === 'issue';
  if (filter === 'Awaiting Approval') return shipment.status === 'awaiting';
  if (filter === 'Approved') return shipment.status === 'transit' && shipment.statusLabel === 'Approved';
  if (filter === 'Received') return shipment.status === 'delivered';
  if (filter === 'Rejected') return shipment.status === 'rejected';
  return false;
}

function recommendationItemName(item: { obatId: string; obat?: { id: string; nama: string } }, locale: string) {
  return getMedicineName(item.obat ? { id: item.obat.id, nama: item.obat.nama } : { id: item.obatId }, locale);
}

function mapRecommendation(row: DistributionRecommendation, locale: string): Shipment {
  const statusMap: Record<RecommendationStatus, Pick<Shipment, 'status' | 'statusLabel' | 'icon' | 'borderTone'>> = {
    PENDING: { status: 'awaiting', statusLabel: 'Awaiting IFK Approval', icon: 'hourglass', borderTone: 'brown' },
    APPROVED: { status: 'transit', statusLabel: 'Approved', icon: 'package', borderTone: 'blue' },
    DISPATCHED: { status: 'transit', statusLabel: 'In Transit', icon: 'package', borderTone: 'blue' },
    RECEIVED: { status: 'delivered', statusLabel: 'Received', icon: 'checkCircle', borderTone: 'green' },
    REJECTED: { status: 'rejected', statusLabel: 'Rejected by IFK', icon: 'x', borderTone: 'red' },
    CANCELLED: { status: 'rejected', statusLabel: 'Cancelled', icon: 'x', borderTone: 'red' },
  };
  const mapped = statusMap[row.status];
  const trackingEvents = [...(row.trackingEvents ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latestEvent = trackingEvents[0];
  const hasOpenIssue = row.status === 'DISPATCHED' && latestEvent?.status === 'ISSUE_REPORTED';
  return {
    id: row.id,
    medicine: row.items.map((item) => recommendationItemName(item, locale)).join(', ') || row.id,
    quantity: row.items.map((item) => `${item.finalQuantity} ${item.obat?.satuan ?? 'unit'}`).join(', '),
    code: row.id,
    status: hasOpenIssue ? 'issue' : mapped.status,
    statusLabel: hasOpenIssue ? 'Issue Reported' : mapped.statusLabel,
    statusMeta: latestEvent ? `${trackingStatusLabel(latestEvent.status)} ${formatDateTime(latestEvent.createdAt)}` : `Requested ${formatDate(row.periode)}`,
    icon: hasOpenIssue ? 'x' : mapped.icon,
    expanded: false,
    borderTone: hasOpenIssue ? 'red' : mapped.borderTone,
    source: row,
    trackingEvents,
    locale,
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID');
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function routeSummary(value: DistributionRecommendation['routeSummary']): RouteSummary {
  if (!value || Array.isArray(value) || typeof value !== 'object') return {};
  return value as RouteSummary;
}

function trackingStatusLabel(status: TrackingStatus) {
  const labels: Record<TrackingStatus, string> = {
    REQUESTED: 'Requested',
    APPROVED: 'Approved by IFK',
    REJECTED: 'Rejected by IFK',
    DISPATCHED: 'In Transit',
    RECEIVED: 'Received',
    ISSUE_REPORTED: 'Issue Reported',
  };
  return labels[status];
}

function statusImplies(status: RecommendationStatus, trackingStatus: TrackingStatus) {
  const order: TrackingStatus[] = ['REQUESTED', 'APPROVED', 'DISPATCHED', 'RECEIVED'];
  const statusIndex: Record<RecommendationStatus, number> = {
    PENDING: 0,
    APPROVED: 1,
    DISPATCHED: 2,
    RECEIVED: 3,
    REJECTED: 0,
    CANCELLED: 0,
  };
  return order.indexOf(trackingStatus) <= statusIndex[status];
}

function shipmentSteps(shipment: Shipment) {
  const eventStatuses = new Set(shipment.trackingEvents.map((event) => event.status));
  const currentStatus = shipment.status === 'awaiting' ? 'REQUESTED' : shipment.status === 'rejected' ? 'REJECTED' : shipment.status === 'delivered' ? 'RECEIVED' : shipment.source.status === 'APPROVED' ? 'APPROVED' : 'DISPATCHED';
  const baseSteps: Array<{ status: TrackingStatus; label: string; icon: 'checkCircle' | 'package' | 'truck' | 'x' }> = [
    { status: 'REQUESTED', label: 'Requested', icon: 'checkCircle' },
    { status: 'APPROVED', label: 'Approved by IFK', icon: 'checkCircle' },
    { status: 'DISPATCHED', label: 'In Transit', icon: 'truck' },
    { status: 'RECEIVED', label: 'Received', icon: 'package' },
  ];
  const steps = shipment.status === 'rejected' ? [...baseSteps.slice(0, 1), { status: 'REJECTED' as TrackingStatus, label: 'Rejected', icon: 'x' as const }] : baseSteps;
  return steps.map((step) => ({
    ...step,
    done: eventStatuses.has(step.status) || statusImplies(shipment.source.status, step.status),
    current: step.status === currentStatus,
  }));
}

function rejectionReason(shipment: Shipment) {
  return shipment.trackingEvents.find((event) => event.status === 'REJECTED')?.note ?? shipment.source.justification ?? 'No reason provided.';
}

function durationText(minutes?: number) {
  if (!minutes || minutes <= 0) return '-';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hours`;
}

function averageDeliveryDuration(shipments: Shipment[]) {
  const durations = shipments.flatMap((shipment) => {
    const requested = [...shipment.trackingEvents].reverse().find((event) => event.status === 'REQUESTED');
    const received = shipment.trackingEvents.find((event) => event.status === 'RECEIVED');
    if (!requested || !received) return [];
    return [(new Date(received.createdAt).getTime() - new Date(requested.createdAt).getTime()) / 60000];
  });
  if (!durations.length) return undefined;
  return durations.reduce((total, value) => total + value, 0) / durations.length;
}

function printShipmentsReport(shipments: Shipment[], analytics: { activeShipments: number; averageDuration: string; completionRate: string; totalItems: number }) {
  const rows = shipments.map((shipment) => `<tr><td>${shipment.id}</td><td>${shipment.medicine}</td><td>${shipment.quantity}</td><td>${shipment.statusLabel}</td><td>${shipment.source.puskesmas?.nama ?? '-'}</td><td>${shipment.statusMeta}</td></tr>`).join('');
  const popup = window.open('', '_blank', 'width=960,height=720');
  if (!popup) return;
  popup.document.write(`<!doctype html><html><head><title>Delivery Report</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#111827}h1{margin:0 0 6px;font-size:24px}.meta{color:#6b7280;margin:0 0 24px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}.summary div{border:1px solid #e5e7eb;border-radius:8px;padding:12px}.summary b{display:block;font-size:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #e5e7eb;padding:10px;text-align:left;font-size:12px}th{background:#f9fafb}</style></head><body><h1>Medicine Delivery Report</h1><p class="meta">Generated ${new Date().toLocaleString('id-ID')}</p><section class="summary"><div><b>${analytics.activeShipments}</b><span>Active Shipments</span></div><div><b>${analytics.completionRate}</b><span>Completion Rate</span></div><div><b>${analytics.averageDuration}</b><span>Average Duration</span></div><div><b>${analytics.totalItems}</b><span>Total Items</span></div></section><table><thead><tr><th>ID</th><th>Medicine</th><th>Quantity</th><th>Status</th><th>Puskesmas</th><th>Latest Tracking</th></tr></thead><tbody>${rows || '<tr><td colspan="6">No delivery data.</td></tr>'}</tbody></table><script>window.print();</script></body></html>`);
  popup.document.close();
}

export function DistributionPageContent() {
  const locale = useLocale();
  const [recommendations, setRecommendations] = useState<DistributionRecommendation[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [error, setError] = useState<string | null>(null);
  const [manuallyToggled, setManuallyToggled] = useState<Set<string>>(() => new Set());
  const [receivingId, setReceivingId] = useState<string | null>(null);

  useEffect(() => {
    getRecommendations()
      .then(setRecommendations)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Gagal memuat pengiriman'));
  }, []);

  const shipments = useMemo(() => {
    const rows = recommendations.map((row) => mapRecommendation(row, locale));
    if (activeFilter === 'All') return rows;
    return rows.filter((row) => matchesFilter(row, activeFilter));
  }, [activeFilter, locale, recommendations]);

  const analytics = useMemo(() => {
    const allShipments = recommendations.map((row) => mapRecommendation(row, locale));
    const totalShipments = allShipments.length;
    const receivedShipments = allShipments.filter((shipment) => shipment.status === 'delivered').length;
    const activeShipments = allShipments.filter((shipment) => shipment.status === 'transit' || shipment.status === 'awaiting').length;
    const totalItems = allShipments.reduce((total, shipment) => total + shipment.source.items.reduce((itemTotal, item) => itemTotal + item.finalQuantity, 0), 0);
    const completionRate = totalShipments ? `${Math.round((receivedShipments / totalShipments) * 100)}%` : '0%';
    return {
      activeShipments,
      completionRate,
      totalItems,
      averageDuration: durationText(averageDeliveryDuration(allShipments)),
    };
  }, [locale, recommendations]);

  const openShipmentIds = useMemo(() => {
    const ids = new Set(shipments.filter((shipment) => shipment.expanded).map((shipment) => shipment.id));
    manuallyToggled.forEach((id) => {
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
    });
    return ids;
  }, [manuallyToggled, shipments]);

  function toggleShipment(id: string) {
    setManuallyToggled((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleRerequest(id: string) {
    setError(null);
    try {
      await rerequestRecommendation(id);
      setRecommendations(await getRecommendations());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Gagal mengirim ulang permintaan');
    }
  }

  async function handleReceive(id: string) {
    setError(null);
    setReceivingId(id);
    try {
      await addTrackingEvent(id, { status: 'RECEIVED', note: 'Shipment received by puskesmas.' });
      setRecommendations(await getRecommendations());
    } catch (receiveError) {
      setError(receiveError instanceof Error ? receiveError.message : 'Gagal mengonfirmasi penerimaan');
    } finally {
      setReceivingId(null);
    }
  }

  return (
    <PageContainer size="wide" className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Medicine Shipping</h1>
          <p>Monitor the status of medicine requests and shipments to your health center</p>
        </div>
        <button type="button" className={styles.exportButton} onClick={() => printShipmentsReport(recommendations.map((row) => mapRecommendation(row, locale)), analytics)}>
          <AppIcon name="fileText" width={16} height={16} />
          Print Report
        </button>
      </header>

      <section className={styles.filterRow} aria-label="Shipment filters">
        <div className={styles.filterChips}>
          {filterChips.map((chip) => (
            <button className={chip === activeFilter ? styles.activeChip : ''} key={chip} type="button" onClick={() => setActiveFilter(chip)}>
              {chip}
            </button>
          ))}
        </div>
        <span>{analytics.activeShipments} active shipments</span>
      </section>

      {error ? <p className={styles.distributionError}>{error}</p> : null}

      <section className={styles.shipmentList} aria-label="Medicine shipments">
        {shipments.length === 0 ? <article className={styles.shipmentCard}><div className={styles.cardContent}>Belum ada data pengiriman.</div></article> : null}
        {shipments.map((shipment) => (
          <ShipmentCard expanded={openShipmentIds.has(shipment.id)} isReceiving={receivingId === shipment.id} onReceive={() => void handleReceive(shipment.id)} onRerequest={() => void handleRerequest(shipment.id)} onToggle={() => toggleShipment(shipment.id)} shipment={shipment} key={shipment.id} />
        ))}
      </section>

      <section className={styles.visualGrid} aria-label="Shipping analytics">
        <article className={styles.mapCard}>
          <h2>Active Shipping Locations</h2>
          <div className={styles.emptyMapState}>
            <span><AppIcon name="truck" width={24} height={24} /></span>
            <strong>Tidak ada pengiriman aktif saat ini.</strong>
            <p>Lokasi pengiriman akan tampil ketika IFK sudah mengirim paket obat ke puskesmas.</p>
          </div>
        </article>

        <article className={styles.performanceCard}>
          <div>
            <strong>{analytics.completionRate}</strong>
            <p>Shipment Completion Rate</p>
          </div>
          <div className={styles.performanceStats}>
            <span><small>Average Duration</small><b>{analytics.averageDuration}</b></span>
            <span><small>Total Items</small><b>{analytics.totalItems} Units</b></span>
          </div>
        </article>
      </section>
    </PageContainer>
  );
}

function ShipmentCard({ expanded, isReceiving, onReceive, onRerequest, onToggle, shipment }: { expanded: boolean; isReceiving: boolean; onReceive: () => void; onRerequest: () => void; onToggle: () => void; shipment: Shipment }) {
  return (
    <article className={`${styles.shipmentCard} ${styles[shipment.borderTone]}`}>
      <div className={styles.cardContent}>
        <div className={styles.cardTop}>
          <div className={styles.shipmentIdentity}>
            <span className={styles.shipmentIcon}><AppIcon name={shipment.icon} width={28} height={28} /></span>
            <div>
              <h2>{shipment.medicine}</h2>
              <p>{shipment.quantity} <span>- ID:</span> <code>{shipment.code}</code></p>
            </div>
          </div>
          <div className={styles.statusCluster}>
            <div className={styles.statusText}>
              <span className={`${styles.statusPill} ${styles[shipment.status]}`}>
                <StatusIcon status={shipment.status} />
                {shipment.statusLabel}
              </span>
              <small className={shipment.status === 'transit' ? styles.eta : ''}>{shipment.statusMeta}</small>
            </div>
            <button className={expanded ? styles.toggleOpen : ''} type="button" aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${shipment.medicine} details`} onClick={onToggle}>
              <AppIcon name="chevronDown" width={18} height={18} />
            </button>
          </div>
        </div>

        {expanded ? <ExpandedTransitDetails shipment={shipment} /> : null}

        {shipment.source.status === 'DISPATCHED' ? (
          <div className={styles.receiveNote}>
            <p><strong>Shipment in transit.</strong> Confirm only after the medicines are physically received.</p>
            <button type="button" disabled={isReceiving} onClick={onReceive}>{isReceiving ? 'Saving...' : 'Confirm Received'}</button>
          </div>
        ) : null}

        {shipment.status === 'rejected' ? (
          <div className={styles.rejectionNote}>
            <p><strong>Reason:</strong> {rejectionReason(shipment)}</p>
            <button type="button" onClick={onRerequest}>Re-request</button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function StatusIcon({ status }: { status: ShipmentStatus }) {
  if (status === 'transit') return <AppIcon name="truck" width={12} height={12} />;
  if (status === 'awaiting') return <AppIcon name="hourglass" width={12} height={12} />;
  if (status === 'delivered') return <AppIcon name="checkCircle" width={12} height={12} />;
  if (status === 'issue') return <AppIcon name="alert" width={12} height={12} />;
  return <AppIcon name="x" width={12} height={12} />;
}

function ExpandedTransitDetails({ shipment }: { shipment: Shipment }) {
  const summary = routeSummary(shipment.source.routeSummary);
  const routeParts = summary.route?.split(/\s+-\s+/) ?? [];
  const origin = routeParts[0] ?? 'IFK';
  const destination = shipment.source.puskesmas?.nama ?? routeParts[routeParts.length - 1] ?? '-';
  const distance = shipment.source.puskesmas?.jarakKeIfkKm == null ? '-' : `${shipment.source.puskesmas.jarakKeIfkKm} km`;
  const steps = shipmentSteps(shipment);
  const history = shipment.trackingEvents.length
    ? shipment.trackingEvents
    : [{ id: `${shipment.id}-requested`, status: 'REQUESTED' as TrackingStatus, note: null, createdAt: shipment.source.periode }];

  return (
    <div className={styles.expandedDetails}>
      <ol className={styles.stepper} aria-label="Shipping progress">
        {steps.map((step) => (
          <li className={`${step.done ? styles.stepDone : ''} ${step.current ? styles.stepCurrent : ''}`} key={step.status}>
            <span><AppIcon name={step.current ? step.icon : step.done ? 'checkCircle' : 'package'} width={18} height={18} /></span>
            <b>{step.label}</b>
          </li>
        ))}
      </ol>

      <div className={styles.detailGrid}>
        <section className={styles.shippingInfo}>
          <h3>Shipping Information</h3>
          <dl>
            <div><dt>Courier</dt><dd>{summary.courier ?? '-'}</dd></div>
            <div><dt>Origin</dt><dd>{origin}</dd></div>
            <div><dt>Destination</dt><dd>{destination}</dd></div>
            <div><dt>Distance</dt><dd>{distance}</dd></div>
            <div><dt>ETA</dt><dd>{durationText(summary.estimateMinutes)}</dd></div>
          </dl>
          <h3>Shipping Contents</h3>
          {shipment.source.items.map((item) => (
            <p className={styles.contentChip} key={item.id}>
              <AppIcon name="package" width={15} height={15} />
              {recommendationItemName(item, shipment.locale)} - {item.finalQuantity} {item.obat?.satuan ?? 'unit'}
            </p>
          ))}
        </section>

        <section className={styles.trackingHistory}>
          <h3>Tracking History</h3>
          <ol>
            {history.map((item, index) => (
              <li className={index === 0 ? styles.activeHistory : ''} key={item.id}>
                <span />
                <div>
                  <strong>{item.note || trackingStatusLabel(item.status)}</strong>
                  <small>{formatDateTime(item.createdAt)}{item.actor?.username ? ` · ${item.actor.username}` : ''}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
