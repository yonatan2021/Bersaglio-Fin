import { NextRequest, NextResponse } from 'next/server';
import { getInitializedDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { db, error } = await getInitializedDb();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '50');
  const startDate = searchParams.get('startDate') ?? undefined;
  const endDate = searchParams.get('endDate') ?? undefined;
  const scraperCredentialId = searchParams.get('accountId');

  let query = `
    SELECT t.*, sc.friendly_name, sc.scraper_type
    FROM transactions t
    JOIN scraper_credentials sc ON t.scraper_credential_id = sc.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (startDate) { query += ' AND t.date >= ?'; params.push(startDate); }
  if (endDate) { query += ' AND t.date <= ?'; params.push(endDate); }
  if (scraperCredentialId) { query += ' AND t.scraper_credential_id = ?'; params.push(Number(scraperCredentialId)); }

  query += ' ORDER BY t.date DESC';
  query += ` LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

  const rows = await db!.query(query, params);
  return NextResponse.json({ data: rows, page, pageSize });
}
