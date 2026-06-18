import { PatientDetailContent } from '@/features/patient-detail/patient-detail-content';

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PatientDetailContent patientId={id} />;
}
