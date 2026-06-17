import { ManualEntryFlowContent } from '@/features/patient-registration/manual-entry-flow-content';

type ManualPatientPageProps = {
  searchParams?: Promise<{ source?: string }>;
};

export default async function ManualPatientPage({ searchParams }: ManualPatientPageProps) {
  const params = await searchParams;
  return <ManualEntryFlowContent mode={params?.source === 'kia' ? 'kia' : 'manual'} />;
}
