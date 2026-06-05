import { ModulePage } from '@/components/module-page';

export default function DistributionPage() {
  return (
    <ModulePage
      title="Distribution"
      description="Allocation plan and alert workspace for route disruption and cold-chain risk simulation."
      rows={[
        { key: 'alerts', item: 'Distribution alerts', status: 'API ready' },
        { key: 'plans', item: 'Allocation plans', status: 'API ready' },
        { key: 'simulate', item: 'Simulation risk checks', status: 'API ready' },
      ]}
    />
  );
}
