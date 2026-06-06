import { MetricCard } from '@/components/ui/metric-card';
import { ResponsiveCardGrid } from '@/components/ui/responsive-card-grid';
import type { DashboardStat } from '../dashboard-data';

type StatsGridProps = {
  stats: DashboardStat[];
};

const asset = (name: string) => `/figma-dashboard/${name}`;

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <ResponsiveCardGrid minCardWidth="220px">
      {stats.map((item) => (
        <MetricCard key={item.label} label={item.label} value={item.value} iconSrc={asset(item.icon)} accent={item.accent} tag={item.tag} />
      ))}
    </ResponsiveCardGrid>
  );
}
