import { NextRequest, NextResponse } from 'next/server';
import { getInitializedDb } from '@/lib/db';
import { scraperConfigSchema } from '@main-src/schemas';

export const runtime = 'nodejs';

export async function GET() {
  const { db, error } = await getInitializedDb();
  if (error) return error;

  const rows = await db!.getScraperCredentials();
  // Never return credentials field
  const safe = rows.map(({ id, scraper_type, friendly_name, last_scraped_timestamp, tags }) => ({
    id,
    scraper_type,
    friendly_name,
    last_scraped_timestamp,
    tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
  }));
  return NextResponse.json(safe);
}

export async function POST(req: NextRequest) {
  const { db, error } = await getInitializedDb();
  if (error) return error;

  const body = await req.json();
  const parsed = scraperConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { scraper_type, friendly_name, credentials, tags } = parsed.data;

  // VERIFIED stringify behavior in DatabaseService.upsertScraperCredential:
  //  - `credentials` is passed verbatim to SQL TEXT column → we MUST stringify here.
  //  - `tags`: if array, DB layer stringifies internally. Pass raw array.
  const id = await db!.upsertScraperCredential({
    scraper_type,
    friendly_name,
    credentials: JSON.stringify(credentials),
    tags: tags && tags.length > 0 ? JSON.stringify(tags) : null,
  });

  return NextResponse.json({ id }, { status: 201 });
}

// DELETE all accounts (used by /settings danger zone)
export async function DELETE() {
  const { db, error } = await getInitializedDb();
  if (error) return error;
  await db!.query('DELETE FROM scraper_credentials');
  return NextResponse.json({ ok: true });
}
