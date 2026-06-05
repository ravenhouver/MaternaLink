import { ModulePage } from '@/components/module-page';

export default function MasterPage() {
  return (
    <ModulePage
      title="Master Data"
      description="Reference workspace for puskesmas, medicines, maternal conditions, and symptoms from the existing API."
      rows={[
        { key: 'puskesmas', item: 'Puskesmas reference data', status: 'API ready' },
        { key: 'obat', item: 'Medicine reference data', status: 'API ready' },
        { key: 'kondisi', item: 'Maternal condition data', status: 'API ready' },
        { key: 'gejala', item: 'Symptom data', status: 'API ready' },
      ]}
    />
  );
}
