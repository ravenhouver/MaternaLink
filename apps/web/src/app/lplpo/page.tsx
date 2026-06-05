import { ModulePage } from '@/components/module-page';

export default function LplpoPage() {
  return (
    <ModulePage
      title="LPLPO"
      description="Predictive LPLPO workspace for generated medicine request rows from forecast results."
      rows={[
        { key: 'generate', item: 'Generate predictive LPLPO', status: 'API ready' },
        { key: 'list', item: 'Filter generated LPLPO rows', status: 'API ready' },
      ]}
    />
  );
}
