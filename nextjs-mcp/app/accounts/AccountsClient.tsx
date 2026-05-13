'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PROVIDER_MAP } from '@/lib/providers';

interface Account {
  id: number;
  scraper_type: string;
  friendly_name: string;
  last_scraped_timestamp: string | null;
  tags: string[];
}

const dateFmt = new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' });

export function AccountsClient() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);

  async function load() {
    try {
      const r = await fetch('/api/accounts');
      if (!r.ok) { setLoading(false); return; }
      const data = await r.json();
      setAccounts(data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number, name: string) {
    if (!confirm(`למחוק את "${name}"? כל העסקאות יימחקו.`)) return;
    setDeleting(id);
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    await load();
    setDeleting(null);
  }

  async function handleSyncAll() {
    setSyncing(true);
    await fetch('/api/sync', { method: 'POST' });
    setSyncing(false);
  }

  return (
    <div className="min-h-screen" dir="rtl">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <header className="flex items-baseline justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl">חשבונות</h1>
            <p className="text-sm text-muted-foreground mt-1">{accounts.length} מחוברים</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSyncAll} disabled={syncing || accounts.length === 0}>
              {syncing ? 'מסנכרן...' : 'סנכרן הכל'}
            </Button>
            <Link href="/accounts/new">
              <Button size="sm">+ חשבון חדש</Button>
            </Link>
          </div>
        </header>

        {loading && <p className="text-sm text-muted-foreground">טוען...</p>}

        {!loading && accounts.length === 0 && (
          <div className="border border-border py-12 px-6 text-center">
            <p className="text-muted-foreground mb-4">אין חשבונות מחוברים</p>
            <Link href="/accounts/new">
              <Button>הוסף חשבון ראשון</Button>
            </Link>
          </div>
        )}

        <div className="divide-y divide-border border-y border-border">
          {accounts.map(account => {
            const provider = PROVIDER_MAP.get(account.scraper_type);
            return (
              <div key={account.id} className="flex items-center justify-between py-4 px-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{account.friendly_name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {provider?.displayName ?? account.scraper_type}
                    {account.last_scraped_timestamp && (
                      <span className="mx-2 text-border">·</span>
                    )}
                    {account.last_scraped_timestamp && (
                      <span>סנכרון אחרון: {dateFmt.format(new Date(account.last_scraped_timestamp))}</span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={deleting === account.id}
                  onClick={() => handleDelete(account.id, account.friendly_name)}
                >
                  {deleting === account.id ? '...' : 'מחק'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
