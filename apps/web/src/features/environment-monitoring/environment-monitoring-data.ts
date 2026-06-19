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
