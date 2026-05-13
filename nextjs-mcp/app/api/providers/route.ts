import { NextResponse } from 'next/server';
import { PROVIDERS } from '@/lib/providers';

export async function GET() {
  return NextResponse.json(PROVIDERS);
}
