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
    <div className="px-8 py-8" dir="rtl">
      <header className="flex items-baseline justify-between mb-8">
        <div>
          <h1 className="font-display text-[24px] font-semibold text-card-foreground">חשבונות</h1>
          <p className="text-[13px] text-muted-foreground mt-1">{accounts.length} מחוברים</p>
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

      {loading && <p className="text-[13px] text-muted-foreground">טוען...</p>}

      {!loading && accounts.length === 0 && (
        <div className="border border-border py-8 px-6">
          <p className="text-[13px] text-muted-foreground mb-4">אין חשבונות מחוברים. הוסף חשבון ראשון להתחיל לסנכרן עסקאות.</p>
          <Link href="/accounts/new">
            <Button size="sm">הוסף חשבון ראשון</Button>
          </Link>
        </div>
      )}

      {accounts.length > 0 && (
        <div className="border border-border divide-y divide-border">
          {accounts.map(account => {
            const provider = PROVIDER_MAP.get(account.scraper_type);
            return (
              <div key={account.id} className="flex items-center justify-between px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-card-foreground">{account.friendly_name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {provider?.displayName ?? account.scraper_type}
                    {account.last_scraped_timestamp && (
                      <>
                        <span className="mx-1.5 text-border">·</span>
                        <span>סנכרון אחרון: {dateFmt.format(new Date(account.last_scraped_timestamp))}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-[13px]"
                  disabled={deleting === account.id}
                  onClick={() => handleDelete(account.id, account.friendly_name)}
                >
                  {deleting === account.id ? '...' : 'מחק'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
