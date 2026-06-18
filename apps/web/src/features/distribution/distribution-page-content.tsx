'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
import { getRecommendations, type DistributionRecommendation, type RecommendationStatus } from '@/lib/api';
import styles from './distribution.module.css';

const DistributionMap = dynamic(() => import('./distribution-map').then((module) => module.DistributionMap), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Loading shipping map...</div>,
});

type ShipmentStatus = 'transit' | 'awaiting' | 'delivered' | 'rejected';

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
};

const filterChips = ['All', 'In Transit', 'Awaiting Approval', 'Approved', 'Received', 'Rejected'];

function matchesFilter(shipment: Shipment, filter: string) {
  if (filter === 'All') return true;
  if (filter === 'In Transit') return shipment.status === 'transit' && shipment.statusLabel === 'In Transit';
  if (filter === 'Awaiting Approval') return shipment.status === 'awaiting';
  if (filter === 'Approved') return shipment.status === 'transit' && shipment.statusLabel === 'Approved';
  if (filter === 'Received') return shipment.status === 'delivered';
  if (filter === 'Rejected') return shipment.status === 'rejected';
  return false;
}

function mapRecommendation(row: DistributionRecommendation): Shipment {
  const statusMap: Record<RecommendationStatus, Pick<Shipment, 'status' | 'statusLabel' | 'icon' | 'borderTone'>> = {
    PENDING: { status: 'awaiting', statusLabel: 'Awaiting IFK Approval', icon: 'hourglass', borderTone: 'brown' },
    APPROVED: { status: 'transit', statusLabel: 'Approved', icon: 'package', borderTone: 'blue' },
    DISPATCHED: { status: 'transit', statusLabel: 'In Transit', icon: 'package', borderTone: 'blue' },
    RECEIVED: { status: 'delivered', statusLabel: 'Received', icon: 'checkCircle', borderTone: 'green' },
    REJECTED: { status: 'rejected', statusLabel: 'Rejected by IFK', icon: 'x', borderTone: 'red' },
    CANCELLED: { status: 'rejected', statusLabel: 'Cancelled', icon: 'x', borderTone: 'red' },
  };
  const mapped = statusMap[row.status];
  return {
    id: row.id,
    medicine: row.items.map((item) => item.obat?.nama ?? item.obatId).join(', ') || row.id,
    quantity: row.items.map((item) => `${item.finalQuantity} ${item.obat?.satuan ?? 'unit'}`).join(', '),
    code: row.id,
    status: mapped.status,
    statusLabel: mapped.statusLabel,
    statusMeta: row.trackingEvents?.[0] ? `${row.trackingEvents[0].status} ${new Date(row.trackingEvents[0].createdAt).toLocaleString('id-ID')}` : `Requested ${new Date(row.periode).toLocaleDateString('id-ID')}`,
    icon: mapped.icon,
    expanded: row.status === 'APPROVED' || row.status === 'DISPATCHED',
    borderTone: mapped.borderTone,
  };
}

const steps = [
  { label: 'Requested', done: true },
  { label: 'Approved by IFK', done: true },
  { label: 'In Transit', done: true, current: true },
  { label: 'Delivered', done: false },
];

const trackingHistory = [
  { title: 'Courier departed from Sleman District IFK', time: 'Nov 1, 2024, 08:00 WIB', active: true },
  { title: 'Request processed by Pharmacy Warehouse', time: 'Oct 31, 2024, 15:30 WIB' },
  { title: 'Request approved by IFK Admin', time: 'Oct 31, 2024, 14:00 WIB' },
];

export function DistributionPageContent() {
  const [recommendations, setRecommendations] = useState<DistributionRecommendation[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [error, setError] = useState<string | null>(null);
  const [manuallyToggled, setManuallyToggled] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    getRecommendations()
      .then(setRecommendations)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Gagal memuat pengiriman'));
  }, []);

  const shipments = useMemo(() => {
    const rows = recommendations.map(mapRecommendation);
    if (activeFilter === 'All') return rows;
    return rows.filter((row) => matchesFilter(row, activeFilter));
  }, [activeFilter, recommendations]);

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

  return (
    <PageContainer size="wide" className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Medicine Shipping</h1>
          <p>Monitor the status of medicine requests and shipments to your health center</p>
        </div>
        <button type="button" className={styles.exportButton}>
          <AppIcon name="upload" width={16} height={16} />
          Export
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
        <span>{shipments.length} active shipments</span>
      </section>

      {error ? <p className={styles.distributionError}>{error}</p> : null}

      <section className={styles.shipmentList} aria-label="Medicine shipments">
        {shipments.length === 0 ? <article className={styles.shipmentCard}><div className={styles.cardContent}>Belum ada data pengiriman.</div></article> : null}
        {shipments.map((shipment) => (
          <ShipmentCard expanded={openShipmentIds.has(shipment.id)} onToggle={() => toggleShipment(shipment.id)} shipment={shipment} key={shipment.id} />
        ))}
      </section>

      <section className={styles.visualGrid} aria-label="Shipping analytics">
        <article className={styles.mapCard}>
          <h2>Active Shipping Locations</h2>
          <div className={styles.mapShell}>
            <DistributionMap />
          </div>
        </article>

        <article className={styles.performanceCard}>
          <div>
            <strong>98.5%</strong>
            <p>Delivery On-Time Rate This Month</p>
          </div>
          <div className={styles.performanceStats}>
            <span><small>Average Duration</small><b>4.2 Hours</b></span>
            <span><small>Total Items</small><b>1.2k Units</b></span>
          </div>
        </article>
      </section>
    </PageContainer>
  );
}

function ShipmentCard({ expanded, onToggle, shipment }: { expanded: boolean; onToggle: () => void; shipment: Shipment }) {
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

        {expanded ? <ExpandedTransitDetails /> : null}

        {shipment.status === 'rejected' ? (
          <div className={styles.rejectionNote}>
            <p><strong>Reason:</strong> IFK stock is currently limited</p>
            <a href="#rerequest">Re-request</a>
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
  return <AppIcon name="x" width={12} height={12} />;
}

function ExpandedTransitDetails() {
  return (
    <div className={styles.expandedDetails}>
      <ol className={styles.stepper} aria-label="Shipping progress">
        {steps.map((step) => (
          <li className={`${step.done ? styles.stepDone : ''} ${step.current ? styles.stepCurrent : ''}`} key={step.label}>
            <span>{step.current ? <AppIcon name="truck" width={18} height={18} /> : step.done ? <AppIcon name="checkCircle" width={18} height={18} /> : <AppIcon name="package" width={18} height={18} />}</span>
            <b>{step.label}</b>
          </li>
        ))}
      </ol>

      <div className={styles.detailGrid}>
        <section className={styles.shippingInfo}>
          <h3>Shipping Information</h3>
          <dl>
            <div><dt>Courier</dt><dd>Sdr. Bambang</dd></div>
            <div><dt>Origin</dt><dd>Sleman District IFK</dd></div>
            <div><dt>Destination</dt><dd>Sleman Health Center</dd></div>
            <div><dt>Distance</dt><dd>12.4 km</dd></div>
          </dl>
          <h3>Shipping Contents</h3>
          <p className={styles.contentChip}><AppIcon name="package" width={15} height={15} />Fe 60mg Tablets - 30 Strips</p>
        </section>

        <section className={styles.trackingHistory}>
          <h3>Tracking History</h3>
          <ol>
            {trackingHistory.map((item) => (
              <li className={item.active ? styles.activeHistory : ''} key={item.title}>
                <span />
                <div><strong>{item.title}</strong><small>{item.time}</small></div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
