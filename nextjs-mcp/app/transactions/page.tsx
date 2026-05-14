import { redirect } from 'next/navigation';
import { getDbInstance } from '@main-src/services/DatabaseService';
import { TransactionsClient } from './TransactionsClient';

export const runtime = 'nodejs';

export default async function Page() {
  const db = getDbInstance();
  if (!(await db.databaseExists())) redirect('/setup');
  return <TransactionsClient />;
}
