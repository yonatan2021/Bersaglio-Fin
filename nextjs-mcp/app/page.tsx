import { redirect } from 'next/navigation';
import { getDbInstance } from '@main-src/services/DatabaseService';
import { DashboardClient } from './_dashboard/DashboardClient';

export const runtime = 'nodejs';

export default async function Page() {
  const db = getDbInstance();
  const initialized = await db.databaseExists();
  if (!initialized) redirect('/setup');
  return <DashboardClient />;
}
