'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { AppIcon, type AppIconName } from '@/components/ui/app-icon';
import styles from './medicine-sender.module.css';

type ModalKind = 'edit' | 'track' | 'filter' | 'approve' | 'reject' | null;
type RowStatus = 'pending' | 'approved';
type Urgency = 'critical' | 'warning' | 'routine';

type RecommendationRow = {
  id: string;
  clinic: string;
  note: string;
  tag: string;
  tagTone: 'blue' | 'green' | 'amber';
  medicine: string;
  dispatchDate: string;
  dispatchTime: string;
  urgency: Urgency;
  status: RowStatus;
  highlighted?: boolean;
};

const stats = [
  { label: 'Critical', value: '03', tone: 'critical' },
  { label: 'Warning', value: '08', tone: 'warning' },
  { label: 'Routine', value: '14', tone: 'routine' },
  { label: 'Total Pending', value: '25', tone: 'total' },
];

const recommendations: RecommendationRow[] = [
  {
    id: 'DX-1822',
    clinic: 'Puskesmas Cangkringan',
    note: 'Oxytocin stock critical. Predicted to run out in 2 days.',
    tag: 'Requested Clinic',
    tagTone: 'blue',
    medicine: 'Oxytocin 10IU (45 amp), MgSO4 40% (20 vial)',
    dispatchDate: '27 OCT 2023',
    dispatchTime: '14:00 WIB',
    urgency: 'critical',
    status: 'pending',
  },
  {
    id: 'DX-1823',
    clinic: 'Puskesmas Berbah',
    note: 'MgSO4 stock thinning. Estimated to last 6 days.',
    tag: 'Requested Clinic',
    tagTone: 'blue',
    medicine: 'MgSO4 40% (50 vial), Disposable Syringe (100 pcs)',
    dispatchDate: '28 OCT 2023',
    dispatchTime: '09:00 WIB',
    urgency: 'warning',
    status: 'pending',
  },
  {
    id: 'DX-1824',
    clinic: 'Puskesmas Mlati',
    note: 'Manual IFK allocation for routine stock balancing.',
    tag: 'Manual IFK',
    tagTone: 'green',
    medicine: 'Vitamin K (200 amp), Antibiotic Type-B (15 unit)',
    dispatchDate: '30 OCT 2023',
    dispatchTime: '17:00 WIB',
    urgency: 'routine',
    status: 'approved',
  },
  {
    id: 'DX-1823',
    clinic: 'Puskesmas Merbau',
    note: 'Flood zone - access threatened, MgSO4 stock critical, urgent delivery needed before 29 Oct.',
    tag: 'Natural Disaster (AI Predicted)',
    tagTone: 'amber',
    medicine: 'MgSO4 40% (50 vial), Disposable Syringe (100 pcs)',
    dispatchDate: '28 OCT 2023',
    dispatchTime: '09:00 WIB',
    urgency: 'critical',
    status: 'approved',
    highlighted: true,
  },
];

const routes = [
  { title: 'North Route (Cangkringan - Berbah)', meta: 'Total: 115 Medical Items • Courier: Sdr. Bambang', estimate: 'Est. 45 Min' },
  { title: 'City Route (Mlati - Sleman)', meta: 'Total: 215 Medical Items • Courier: Sdr. Agus', estimate: 'Est. 20 Min' },
];

const metrics = [
  { label: 'Efficiency Index', value: 92, tone: 'green' },
  { label: 'AI Confidence', value: 88, tone: 'blue' },
  { label: 'Equity Score', value: 84, tone: 'green' },
];

function Sidebar() {
  return (
    <aside className={styles.recoSidebar} aria-label="Medicine sender navigation">
      <div className={styles.recoBrand}><span><AppIcon name="briefcase" width={20} height={20} /></span><div><strong>IFK</strong><small>District Monitoring</small></div></div>
      <nav className={styles.recoNav}>
        <a href="/medicine-sender"><AppIcon name="home" width={20} height={20} />Dashboard</a>
        <a className={styles.recoNavActive} href="/medicine-sender/recommendations"><AppIcon name="userPlus" width={20} height={20} />Distribution</a>
        <a href="/medicine-sender/clinics"><AppIcon name="users" width={20} height={20} />Clinic List</a>
        <a href="/medicine-sender/environment"><AppIcon name="calendar" width={20} height={20} />Environment Monitoring</a>
      </nav>
    </aside>
  );
}

function Topbar() {
  return (
    <header className={styles.recoTopbar}>
      <div className={styles.recoCrumbs}><span>Home</span><AppIcon name="chevronRight" width={14} height={14} /><span>Patient List</span><AppIcon name="chevronRight" width={14} height={14} /><strong>Add New Patient</strong></div>
      <div className={styles.recoTopActions}>
        <button type="button" aria-label="Notifikasi"><AppIcon name="bell" width={18} height={18} /><i /></button>
        <button type="button" aria-label="Settings"><AppIcon name="settings" width={18} height={18} /></button>
        <span />
        <div><strong>Pharmacy Management</strong><small>Administrator</small></div>
        <b>PM</b>
      </div>
    </header>
  );
}

function StatusBadge({ urgency }: { urgency: Urgency }) {
  return <span className={[styles.recoBadge, styles[urgency]].join(' ')}>{urgency}</span>;
}

function RecommendationTable({ onOpen }: { onOpen: (modal: ModalKind) => void }) {
  return (
    <section className={styles.recoTablePanel}>
      <div className={styles.recoDragHint}><AppIcon name="gripVertical" width={14} height={14} />Seret baris untuk mengubah urutan prioritas pengiriman</div>
      <div className={styles.recoTableWrap}>
        <table className={styles.recoTable}>
          <thead>
            <tr>
              <th />
              <th>#</th>
              <th>Nama Klinik</th>
              <th>Obat Dikirim</th>
              <th>Dispatch</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((row) => (
              <tr className={row.highlighted ? styles.recoHighlightedRow : undefined} key={`${row.id}-${row.clinic}`}>
                <td><AppIcon name="gripVertical" width={16} height={16} /></td>
                <td>{row.id.split('-').map((part, partIndex) => <span key={`${row.id}-${partIndex}`}>{partIndex === 0 ? `${part}-` : part}</span>)}</td>
                <td>
                  <strong>{row.clinic}</strong>
                  <span className={[styles.recoSourceTag, styles[row.tagTone]].join(' ')}><AppIcon name={row.tagTone === 'amber' ? 'alert' : row.tagTone === 'green' ? 'checkCircle' : 'lock'} width={11} height={11} />{row.tag}</span>
                  <p>{row.note}</p>
                </td>
                <td>{row.medicine}</td>
                <td><strong>{row.dispatchDate}</strong><small>{row.dispatchTime}</small></td>
                <td><StatusBadge urgency={row.urgency} /></td>
                <td>{row.status === 'pending' ? <em>Pending Approval</em> : <span className={styles.approvedPill}>Approved</span>}</td>
                <td>
                  <div className={styles.recoActions}>
                    {row.status === 'pending' ? <button type="button" className={styles.approveButton} onClick={() => onOpen('approve')}>Approve</button> : <button type="button" className={styles.trackButton} onClick={() => onOpen('track')}>Track</button>}
                    {row.status === 'pending' ? <button type="button" className={styles.rejectButton} onClick={() => onOpen('reject')}>Reject</button> : null}
                    <button type="button" aria-label={`Edit ${row.clinic}`} onClick={() => onOpen('edit')}><AppIcon name="edit" width={16} height={16} /></button>
                    <button type="button" aria-label={`Delete ${row.clinic}`}><AppIcon name="trash" width={16} height={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.recoPagination}><span>Showing 3 from 42 entries</span><div><button><AppIcon name="chevronLeft" width={14} height={14} /></button><button className={styles.currentPage}>1</button><button>2</button><button>3</button><button><AppIcon name="chevronRight" width={14} height={14} /></button></div></div>
    </section>
  );
}

function FooterPanels({ onApproveAll }: { onApproveAll: () => void }) {
  return (
    <section className={styles.recoFooterGrid}>
      <article className={styles.routeSummaryCard}>
        <h2><span><AppIcon name="route" width={20} height={20} /></span>Shipping Route Summary</h2>
        <div className={styles.routeList}>{routes.map((route) => <div key={route.title}><span><AppIcon name="truck" width={22} height={22} /></span><div><strong>{route.title}</strong><small>{route.meta}</small></div><em>{route.estimate}</em></div>)}</div>
        <p><AppIcon name="info" width={14} height={14} />Route updated automatically based on clinic priority order.</p>
      </article>
      <aside className={styles.approvalMetricColumn}>
        <article className={styles.approvalMetricCard}><h2>Approval Metrics</h2>{metrics.map((metric) => <div className={styles.approvalMetricRow} key={metric.label}><div><span>{metric.label}</span><strong>{metric.value}%</strong></div><p><i className={styles[metric.tone]} style={{ width: `${metric.value}%` }} /></p></div>)}</article>
        <button type="button" className={styles.approveAllButton} onClick={onApproveAll}><span><AppIcon name="checkCircle" width={22} height={22} /></span>Approve All Pending</button>
      </aside>
    </section>
  );
}

function EditModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} size="edit">
      <div className={styles.editModalHeader}><div><h2>Edit Distribution</h2><p>Puskesmas Cangkringan • ID: DX-1822</p></div><span>Critical</span></div>
      <div className={styles.editModalBody}>
        <section><h3>Schedule & Priority</h3><div className={styles.editFormGrid}><label>Dispatch Date<span>27 October 2023<AppIcon name="calendar" width={16} height={16} /></span></label><label>Delivery Priority<span>1<AppIcon name="chevronDown" width={16} height={16} /></span><small>Rank #1 = first delivery</small></label><label>Dispatch Time<span className={styles.invalidInput}>14:00 WIB</span><small className={styles.errorText}>Time is very tight</small></label></div><p className={styles.infoBox}><AppIcon name="info" width={16} height={16} />Changing priorities will automatically update the route & courier schedule for this distribution cluster.</p></section>
        <section><div className={styles.sectionTitleRow}><h3>Amount of Medicine Sent</h3><button><AppIcon name="plus" width={14} height={14} />Add Medication</button></div><table className={styles.editMedicineTable}><thead><tr><th>Medication Name</th><th>AI Qty</th><th>Override Qty</th><th>Difference</th><th>Action</th></tr></thead><tbody><tr><td><strong>Oxytocin 10IU</strong><small>(ampoule)</small></td><td>45</td><td><b>30</b></td><td className={styles.dangerText}>-15</td><td><AppIcon name="trash" width={16} height={16} /></td></tr><tr><td><strong>MgSO4 40%</strong><small>(vial)</small></td><td>20</td><td><span>20</span></td><td>-</td><td><AppIcon name="trash" width={16} height={16} /></td></tr></tbody></table></section>
        <section className={styles.aiBox}><h3><AppIcon name="package" width={18} height={18} />AI Analysis</h3><p>Reducing Oxytocin: 45 to 30 ampoules</p><div><strong>Coverage<br /><b>9 days to 6 days</b></strong><span><i />Stockout risk increased sharply</span></div></section>
        <section><h3>Reason for Change <b>Required</b></h3><textarea placeholder="e.g., reserve stock already sent directly to the clinic" /><small className={styles.errorText}>Reason must be filled before saving</small></section>
      </div>
      <div className={styles.editModalFooter}><button type="button" onClick={onClose}><AppIcon name="rotateCcw" width={16} height={16} />Back to AI Recommendations</button><span><button type="button" onClick={onClose}>Cancel</button><button type="button" onClick={onClose}>Save Changes</button></span></div>
    </ModalShell>
  );
}

function TrackModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} size="track">
      <div className={styles.trackHeader}><div><h2>Track Shipment</h2><p>Puskesmas Cangkringan • ID: PKM-CGK-2024-001</p></div><span><AppIcon name="truck" width={14} height={14} />In Transit</span></div>
      <div className={styles.stepper}>{['Requested\n30 Oct, 14:20', 'Approved\n31 Oct, 09:15', 'Dispatched\n1 Nov, 08:00', 'Received\nEst. 2 Nov'].map((step, index) => <div className={index < 2 ? styles.done : index === 2 ? styles.active : undefined} key={step}><span>{index < 2 ? <AppIcon name="checkCircle" width={18} height={18} /> : index === 2 ? <AppIcon name="truck" width={16} height={16} /> : <AppIcon name="package" width={16} height={16} />}</span><strong>{step.split('\n')[0]}</strong><small>{step.split('\n')[1]}</small></div>)}</div>
      <div className={styles.trackBody}><section><h3><AppIcon name="clock" width={15} height={15} />Shipping Info</h3><dl><dt>Courier</dt><dd>Sdr. Bambang</dd><dt>Phone</dt><dd className={styles.blueText}>+62 812-4455-xxxx</dd></dl><h4>Origin & Destination</h4><div className={styles.originPath}><i /><span><b>IFK Kab. Sleman</b><b>Puskesmas Cangkringan</b></span></div><dl><dt>Distance</dt><dd>24 km</dd></dl><p className={styles.arrival}>Est. Arrival <strong>2 Nov 2024, 10:00</strong></p><h4>Shipment Contents</h4><ul><li>Oxytocin 10IU (45 ampules)</li><li>MgSO4 40% (20 vials)</li></ul></section><section><h3><AppIcon name="clock" width={15} height={15} />Travel History</h3><div className={styles.historyTimeline}><article><b>Courier departed from Sleman District Pharmacy (IFK Kabupaten Sleman)</b><small>1 Nov 2024, 08:00 WIB</small></article><article><span>Request Approved (IFK Admin)</span><small>31 Oct 2024, 09:15 WIB</small></article><article><span>Request Created (Clinic)</span><small>30 Oct 2024, 14:20 WIB</small></article></div><div className={styles.routeMap}>Travel Route Map<AppIcon name="truck" width={22} height={22} /></div></section></div>
      <div className={styles.trackFooter}><a href="/medicine-sender/decision-history"><AppIcon name="fileText" width={14} height={14} />View Full History</a><span><button type="button" onClick={onClose}>Close</button><button type="button"><AppIcon name="alert" width={14} height={14} />Report Issue</button></span></div>
    </ModalShell>
  );
}

function FilterModal({ onClose }: { onClose: () => void }) {
  const groups = [
    ['Urgency Status', 'All', 'Critical', 'Warning', 'Routine'],
    ['Approval Status', 'All', 'Pending Approval', 'Approved', 'Rejected'],
    ['Medicine Dispatched', 'Oxytocin', 'MgSO4', 'Tablet Fe', 'Vitamin K', 'Nifedipine'],
    ['District', 'Cangkringan', 'Depok', 'Mlati', 'Sleman'],
    ['Qty Total', '< 50', '51-100', '101-200', '> 200'],
  ];
  return <ModalShell onClose={onClose} size="filter"><div className={styles.filterHeader}><h2>Filter Distribution Recommendations</h2></div><div className={styles.filterBody}>{groups.map((group) => <section key={group[0]}><h3>{group[0]}</h3><div>{group.slice(1).map((item, index) => <button className={index === 1 || (group[0] === 'Approval Status' && item === 'Pending Approval') || item === 'Cangkringan' ? styles.selected : undefined} type="button" key={item}>{item}</button>)}</div></section>)}<section><h3>Dispatch Date</h3><div className={styles.dateInputs}><span>10/27/2023</span><span>10/30/2023</span></div></section></div><div className={styles.filterFooter}><span>3 active filter</span><button type="button">Reset All</button><button type="button" onClick={onClose}>Apply Filter (8 results)</button></div></ModalShell>;
}

function ConfirmModal({ kind, onClose }: { kind: 'approve' | 'reject'; onClose: () => void }) {
  const approve = kind === 'approve';
  return <ModalShell onClose={onClose} size="confirm"><div className={styles.confirmBox}><span className={approve ? styles.confirmIcon : styles.rejectIcon}>{approve ? <AppIcon name="checkCircle" width={24} height={24} /> : <AppIcon name="x" width={24} height={24} />}</span><h2>{approve ? 'Shipment Confirmation' : 'Reject Shipment'}</h2><p>You are about to {approve ? 'approve' : 'reject'} shipment recommendation <b>#DX-9902 for Raja Ampat Utara Clinic.</b> {approve ? 'The shipment will be immediately sent to the maritime logistics operator for processing.' : 'Rejection will immediately notify the clinic and the request will be moved to the archive.'}</p><div><span><small>Main Content</small><strong>Oxytocin 10IU<br />(45 amp), MgSO4<br />40% (20 vial)</strong></span><span><small>Dispatch</small><strong>25 OCT 2023</strong></span></div><footer><button type="button" onClick={onClose}>Cancel</button><button type="button" onClick={onClose}>{approve ? 'Approve & Dispatch' : 'Reject'}</button></footer></div></ModalShell>;
}

function ModalShell({ children, onClose, size }: { children: ReactNode; onClose: () => void; size: 'edit' | 'track' | 'filter' | 'confirm' }) {
  return <div className={styles.recoOverlay} role="dialog" aria-modal="true"><div className={[styles.recoModal, styles[size]].join(' ')}>{children}<button className={styles.modalClose} type="button" aria-label="Close modal" onClick={onClose}><AppIcon name="x" width={22} height={22} /></button></div></div>;
}

export function MedicineSenderRecommendationsContent() {
  const [modal, setModal] = useState<ModalKind>(null);

  return (
    <div className={styles.recoShell}>
      <Sidebar />
      <div className={styles.recoWorkspace}>
        <Topbar />
        <main className={styles.recoPage}>
          <section className={styles.recoTitleRow}><div><p>Logistics Intelligence</p><h1>Distribution Recommendations</h1></div><a href="/medicine-sender/decision-history">Decision History</a></section>
          <section className={styles.recoStats}>{stats.map((stat) => <article className={styles[stat.tone]} key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></article>)}</section>
          <section className={styles.recoToolbar}><button type="button" onClick={() => setModal('filter')}><AppIcon name="filter" width={16} height={16} />Filter <AppIcon name="chevronDown" width={14} height={14} /></button><button type="button"><AppIcon name="plus" width={18} height={18} />Add Clinic</button></section>
          <RecommendationTable onOpen={setModal} />
          <FooterPanels onApproveAll={() => setModal('approve')} />
        </main>
      </div>
      {modal === 'edit' ? <EditModal onClose={() => setModal(null)} /> : null}
      {modal === 'track' ? <TrackModal onClose={() => setModal(null)} /> : null}
      {modal === 'filter' ? <FilterModal onClose={() => setModal(null)} /> : null}
      {modal === 'approve' ? <ConfirmModal kind="approve" onClose={() => setModal(null)} /> : null}
      {modal === 'reject' ? <ConfirmModal kind="reject" onClose={() => setModal(null)} /> : null}
    </div>
  );
}
