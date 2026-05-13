import { redirect } from 'next/navigation';
import { getDbInstance } from '@main-src/services/DatabaseService.js';
import { AccountsClient } from './AccountsClient';

export const runtime = 'nodejs';

export default async function Page() {
  const db = getDbInstance();
  if (!(await db.databaseExists())) redirect('/setup');
  return <AccountsClient />;
}
