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
  icon?: 'clipboardCheck';
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
  position?: TacticalPoint['position'];
};

export type ApprovalLog = {
  timestamp: string;
  entity: string;
  action: string;
  operator: string;
  status: 'approved' | 'rejected' | 'pending';
};

