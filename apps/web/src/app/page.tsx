import { DashboardContent } from '@/components/dashboard-content';
import { apiBaseUrl, checkApiReachability } from '@/lib/api';

export default async function DashboardPage() {
  const reachability = await checkApiReachability();

  return <DashboardContent apiBaseUrl={apiBaseUrl} reachability={reachability} />;
}
