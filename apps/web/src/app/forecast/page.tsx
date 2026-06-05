import { ModulePage } from '@/components/module-page';

export default function ForecastPage() {
  return (
    <ModulePage
      title="Forecast"
      description="Forecast workspace for deterministic stock prediction runs exposed by the existing API."
      rows={[
        { key: 'run', item: 'Run forecast', status: 'API ready' },
        { key: 'runs', item: 'Forecast run history', status: 'API ready' },
        { key: 'results', item: 'Forecast result details', status: 'API ready' },
      ]}
    />
  );
}
