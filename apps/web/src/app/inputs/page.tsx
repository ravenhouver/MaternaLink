import { ModulePage } from '@/components/module-page';

export default function InputsPage() {
  return (
    <ModulePage
      title="Inputs"
      description="Monthly clinical, context, stock, symptom, and anamnesis input areas for the existing backend workflow."
      rows={[
        { key: 'diagnosis', item: 'Diagnosis period input', status: 'API ready' },
        { key: 'gejala', item: 'Symptom period input', status: 'API ready' },
        { key: 'konteks', item: 'Context period input', status: 'API ready' },
        { key: 'stok', item: 'Stock input', status: 'API ready' },
        { key: 'anamnesis', item: 'Raw anamnesis input', status: 'API ready' },
      ]}
    />
  );
}
