export type SenderStat = {
  label: string;
  value: string;
  tone: 'critical' | 'anticipatory' | 'regular' | 'primary';
};

export type DispatchRecommendation = {
  id: string;
  clinic: string;
  route: string;
  urgency: 'critical' | 'anticipatory' | 'regular';
  reasoning: string;
  contents: string;
  deadline: string;
};

export type TacticalPoint = {
  id: string;
  name: string;
  status: 'critical' | 'anticipatory' | 'regular';
  position: [number, number];
};

export type ApprovalMetric = {
  label: string;
  value: number;
};

export type DashboardKpi = {
  label: string;
  value: string;
  delta: string;
  tone: 'critical' | 'warning' | 'safe' | 'primary';
  progress: number;
};

export type DashboardAction = {
  id: string;
  name: string;
  status: 'critical' | 'warning' | 'safe';
  statusLabel: string;
  updatedAt: string;
  weather: string;
  supply: string;
  pointStatus: TacticalPoint['status'];
  position: TacticalPoint['position'];
};

export type ApprovalLog = {
  timestamp: string;
  entity: string;
  action: string;
  operator: string;
  status: 'approved' | 'rejected' | 'pending';
};

export const senderStats: SenderStat[] = [
  { label: 'Critical', value: '03', tone: 'critical' },
  { label: 'Anticipatory', value: '08', tone: 'anticipatory' },
  { label: 'Regular', value: '14', tone: 'regular' },
  { label: 'Total pending', value: '25', tone: 'primary' },
];

export const dispatchRecommendations: DispatchRecommendation[] = [
  {
    id: '#DX-9902',
    clinic: 'Puskesmas Tepus Pesisir',
    route: 'Maritime Transport Delivery',
    urgency: 'critical',
    reasoning:
      'Peringatan cuaca ekstrem diprediksi dalam 48 jam. Stok vaksin polio berada di bawah ambang batas kritis, sementara kasus demam di area pesisir meningkat.',
    contents: 'Vaksin polio 500 vial, antibiotik tipe B, cold-chain unit 04',
    deadline: '24 Okt 2026, 14:00 WIB',
  },
  {
    id: '#DX-9844',
    clinic: 'Klinik Satelit Sorong',
    route: 'Air Cargo Delivery',
    urgency: 'anticipatory',
    reasoning:
      'Proyeksi pertumbuhan pasien musiman dan kapasitas logistik udara akan penuh dalam tiga hari ke depan karena rotasi militer regional.',
    contents: 'Antiviral kits 1.200 unit, personal protective equipment',
    deadline: '26 Okt 2026, 09:00 WIT',
  },
  {
    id: '#DX-9711',
    clinic: 'Puskesmas Fakfak Timur',
    route: 'Overland Logistics',
    urgency: 'regular',
    reasoning:
      'Pengisian rutin pasokan bulanan. Kondisi cuaca stabil dan infrastruktur jalan tidak terhambat. Tidak ada anomali kesehatan terdeteksi.',
    contents: 'General medical supplies, paracetamol, bandages',
    deadline: '30 Okt 2026, 17:00 WIT',
  },
];

export const tacticalPoints: TacticalPoint[] = [
  { id: 'tepus', name: 'Puskesmas Tepus Pesisir', status: 'critical', position: [-8.1503, 110.6136] },
  { id: 'sorong', name: 'Klinik Satelit Sorong', status: 'anticipatory', position: [-0.8762, 131.2561] },
  { id: 'fakfak', name: 'Puskesmas Fakfak Timur', status: 'regular', position: [-2.9247, 132.2962] },
];

export const approvalMetrics: ApprovalMetric[] = [
  { label: 'Efficiency index', value: 92 },
  { label: 'AI confidence', value: 88 },
  { label: 'Logistics load', value: 64 },
];

export const dashboardKpis: DashboardKpi[] = [
  { label: 'Klinik kritis', value: '12', delta: '+3 jam', tone: 'critical', progress: 76 },
  { label: 'Klinik waspada', value: '08', delta: '-2 jam', tone: 'warning', progress: 42 },
  { label: 'Klinik aman', value: '142', delta: 'stabil', tone: 'safe', progress: 88 },
  { label: 'Menunggu approval', value: '05', delta: 'review', tone: 'primary', progress: 54 },
];

export const dashboardActions: DashboardAction[] = [
  {
    id: 'jetis',
    name: 'Puskesmas Jetis',
    status: 'critical',
    statusLabel: 'Critical risk',
    updatedAt: '2 menit lalu',
    weather: 'Hujan lebat 90%',
    supply: 'Oksitosin < 12 vial',
    pointStatus: 'critical',
    position: [-7.7765, 110.3689],
  },
  {
    id: 'umbulharjo',
    name: 'Klinik Umbulharjo',
    status: 'warning',
    statusLabel: 'Weather watch',
    updatedAt: '14 menit lalu',
    weather: 'Potensi genangan',
    supply: 'Tablet FE 7 hari stok',
    pointStatus: 'anticipatory',
    position: [-7.8122, 110.3892],
  },
  {
    id: 'sleman',
    name: 'RS Pratama Sleman',
    status: 'critical',
    statusLabel: 'Depletion alert',
    updatedAt: '45 menit lalu',
    weather: 'Akses normal',
    supply: 'Insulin kritis',
    pointStatus: 'critical',
    position: [-7.7162, 110.3554],
  },
];

export const dashboardMapPoints: TacticalPoint[] = dashboardActions.map((item) => ({
  id: item.id,
  name: item.name,
  status: item.pointStatus,
  position: item.position,
}));

export const dashboardApprovalLogs: ApprovalLog[] = [
  { timestamp: '2026-06-07 14:22:01', entity: 'Klinik Kotagede', action: 'VACCINE_RESUPPLY_A12', operator: 'A. Ramadhan', status: 'approved' },
  { timestamp: '2026-06-07 14:18:55', entity: 'RSUD Wates', action: 'EVAC_READY_SIGNAL', operator: 'S. Hidayat', status: 'approved' },
  { timestamp: '2026-06-07 14:05:12', entity: 'Puskesmas Turi', action: 'LOGISTICS_BYPASS_U09', operator: 'SYSTEM_AUTO', status: 'rejected' },
];
