'use client';

import dynamic from 'next/dynamic';
import { AppIcon } from '@/components/ui/app-icon';
import { PageContainer } from '@/components/layout/page-container';
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

const shipments: Shipment[] = [
  {
    id: 'fe-tablets',
    medicine: 'Fe 60mg Tablets',
    quantity: '30 strips',
    code: 'PKM-TF-2024-001',
    status: 'transit',
    statusLabel: 'In Transit',
    statusMeta: 'Estimated arrival: Tomorrow, 10:00 WIB',
    icon: 'package',
    expanded: true,
    borderTone: 'blue',
  },
  {
    id: 'mgso4',
    medicine: 'MgSO4 40%',
    quantity: '50 vials',
    code: 'PKM-MG-2024-002',
    status: 'awaiting',
    statusLabel: 'Awaiting IFK Approval',
    statusMeta: 'Requested Oct 31, 2024',
    icon: 'hourglass',
    borderTone: 'brown',
  },
  {
    id: 'oxytocin',
    medicine: 'Oxytocin 10IU',
    quantity: '45 ampoules',
    code: 'PKM-OX-2024-003',
    status: 'delivered',
    statusLabel: 'Delivered',
    statusMeta: 'Delivered Oct 28, 2024, 14:30',
    icon: 'checkCircle',
    borderTone: 'green',
  },
  {
    id: 'nifedipine',
    medicine: 'Nifedipine 10mg',
    quantity: '100 tablets',
    code: 'PKM-NF-2024-004',
    status: 'rejected',
    statusLabel: 'Rejected by IFK',
    statusMeta: 'Rejected Oct 29, 2024',
    icon: 'x',
    borderTone: 'red',
  },
];

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
            <button className={chip === 'All' ? styles.activeChip : ''} key={chip} type="button">
              {chip}
            </button>
          ))}
        </div>
        <span>4 active shipments</span>
      </section>

      <section className={styles.shipmentList} aria-label="Medicine shipments">
        {shipments.map((shipment) => (
          <ShipmentCard shipment={shipment} key={shipment.id} />
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

function ShipmentCard({ shipment }: { shipment: Shipment }) {
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
            <span className={`${styles.statusPill} ${styles[shipment.status]}`}>{shipment.statusLabel}</span>
            <small className={shipment.status === 'transit' ? styles.eta : ''}>{shipment.statusMeta}</small>
            <button type="button" aria-label={`Toggle ${shipment.medicine} details`}><AppIcon name="chevronDown" width={18} height={18} /></button>
          </div>
        </div>

        {shipment.expanded ? <ExpandedTransitDetails /> : null}

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
