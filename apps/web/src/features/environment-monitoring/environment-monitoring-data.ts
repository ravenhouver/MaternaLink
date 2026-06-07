export type ForecastRisk = 'stable' | 'warning' | 'blocked';

export type EnvironmentForecast = {
  location: string;
  status: string;
  risk: ForecastRisk;
  temperature: string;
  metric: string;
  bars: ForecastRisk[];
};

export type RouteVulnerability = {
  id: string;
  route: string;
  clinics: string;
  risk: number;
  status: 'critical' | 'operational' | 'elevated';
  blockedAt: string;
  confidence: string;
};

export type EnvironmentalPoint = {
  id: string;
  name: string;
  metric: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  position: [number, number];
};

export const forecasts: EnvironmentForecast[] = [
  {
    location: 'Waisai Island',
    status: 'Stable',
    risk: 'stable',
    temperature: '28°C',
    metric: 'Hum: 82%',
    bars: ['stable', 'stable', 'stable', 'warning', 'stable', 'stable', 'stable'],
  },
  {
    location: 'Sorong Selatan',
    status: 'Warning',
    risk: 'warning',
    temperature: '24°C',
    metric: 'Precip: 88%',
    bars: ['blocked', 'blocked', 'blocked', 'blocked', 'blocked', 'warning', 'stable'],
  },
  {
    location: 'Misool Sector',
    status: 'Stable',
    risk: 'stable',
    temperature: '31°C',
    metric: 'Wind 12km',
    bars: ['stable', 'stable', 'stable', 'stable', 'stable', 'stable', 'stable'],
  },
  {
    location: 'Maybrat Highlands',
    status: 'Blocked Risk',
    risk: 'blocked',
    temperature: '19°C',
    metric: 'Risk: High',
    bars: ['blocked', 'blocked', 'blocked', 'blocked', 'blocked', 'blocked', 'blocked'],
  },
];

export const routeVulnerabilities: RouteVulnerability[] = [
  {
    id: 'R-SOR-01',
    route: 'Maybrat Pass',
    clinics: 'Klinik Maybrat A, Puskesmas Ayamaru',
    risk: 88,
    status: 'critical',
    blockedAt: '24 Oct 2024',
    confidence: '94%',
  },
  {
    id: 'R-WAIS-03',
    route: 'Sea Route',
    clinics: 'Klinik Gam, Mansuar Post',
    risk: 12,
    status: 'operational',
    blockedAt: 'N/A',
    confidence: '99%',
  },
  {
    id: 'R-MAN-12',
    route: 'Arfak Valley',
    clinics: 'Minyambouw Clinic Cluster',
    risk: 45,
    status: 'elevated',
    blockedAt: '29 Oct 2024',
    confidence: '78%',
  },
  {
    id: 'R-TIM-09',
    route: 'Highlands North',
    clinics: 'Tembagapura Sector 3',
    risk: 92,
    status: 'critical',
    blockedAt: 'Immediate',
    confidence: '97%',
  },
];

export const environmentalPoints: EnvironmentalPoint[] = [
  {
    id: 'raja-ampat',
    name: 'Raja Ampat Sector',
    metric: '92mm/hr',
    risk: 'critical',
    position: [-0.423, 130.829],
  },
  {
    id: 'maybrat',
    name: 'Maybrat Highlands',
    metric: '150mm/6h',
    risk: 'high',
    position: [-1.318, 132.528],
  },
  {
    id: 'sorong',
    name: 'Sorong Selatan',
    metric: '88% precip',
    risk: 'medium',
    position: [-1.063, 131.253],
  },
  {
    id: 'misool',
    name: 'Misool Sector',
    metric: '3.5m swell',
    risk: 'low',
    position: [-1.872, 130.088],
  },
];
