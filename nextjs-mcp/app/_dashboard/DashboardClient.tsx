'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Summary {
  monthlyTotal: number;
  transactionCount: number;
  topCategories: Array<{ category: string; total: number }>;
  recentTransactions: Array<{
    description: string;
    chargedAmount: number;
    date: string;
    friendly_name: string;
    category: string | null;
  }>;
}

type SyncStatus = 'idle' | 'running' | 'done' | 'error';

const fmt = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit' });

export function DashboardClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [loading, setLoading] = useState(true);
  const [hasAccounts, setHasAccounts] = useState<boolean | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function loadSummary() {
    try {
      const [summaryRes, accountsRes] = await Promise.all([
        fetch('/api/transactions/summary'),
        fetch('/api/accounts'),
      ]);
      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (accountsRes.ok) {
        const accounts = await accountsRes.json();
        setHasAccounts(Array.isArray(accounts) && accounts.length > 0);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { loadSummary(); }, []);

  async function triggerSync() {
    setSyncStatus('running');
    if (successTimerRef.current) clearTimeout(successTimerRef.current);

    try {
      await fetch('/api/sync', { method: 'POST' });
    } catch {
      setSyncStatus('error');
      return;
    }

    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch('/api/sync/status');
        const s = await r.json();
        if (s.status !== 'running') {
          if (pollRef.current) clearInterval(pollRef.current);
          setSyncStatus(s.status === 'done' ? 'done' : 'error');
          if (s.status === 'done') {
            loadSummary();
            successTimerRef.current = setTimeout(() => setSyncStatus('idle'), 4000);
          }
        }
      } catch { /* ignore */ }
    }, 2000);
  }

  const isEmpty = !loading && (!summary || summary.transactionCount === 0);

  return (
    <div className="px-8 py-8 space-y-8" dir="rtl">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="font-display text-[24px] font-semibold text-card-foreground">לוח בקרה</h1>
          <p className="text-[13px] text-muted-foreground mt-1">סקירת חודש נוכחי</p>
        </div>
        <Button onClick={triggerSync} disabled={syncStatus === 'running'} size="sm">
          {syncStatus === 'running' ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin inline-block w-3 h-3 border border-current border-t-transparent rounded-full" />
              מסנכרן...
            </span>
          ) : 'סנכרן עכשיו'}
        </Button>
      </header>

      {syncStatus === 'running' && (
        <div className="border border-border bg-card px-3 py-2 text-[13px] text-muted-foreground">
          מביא עסקאות מהבנק... זה עשוי לקחת דקה-שתיים.
        </div>
      )}
      {syncStatus === 'done' && (
        <div className="border border-border bg-card px-3 py-2 text-[13px] text-foreground">
          הסנכרון הסתיים בהצלחה — הנתונים עודכנו.
        </div>
      )}
      {syncStatus === 'error' && (
        <div className="border border-destructive/40 bg-destructive/5 text-destructive px-3 py-2 text-[13px]">
          הסנכרון נכשל. בדוק פרטי גישה ב<Link href="/accounts" className="underline">חשבונות</Link>.
        </div>
      )}

      {isEmpty && (
        <div className="border border-border py-12 px-8 text-center space-y-3">
          {hasAccounts === false ? (
            <>
              <p className="text-[13px] font-medium text-card-foreground">אין חשבונות מחוברים</p>
              <p className="text-[13px] text-muted-foreground">חבר חשבון בנק כדי להתחיל לראות את ההוצאות שלך</p>
              <Link href="/accounts/new">
                <Button size="sm" className="mt-2">חבר חשבון בנק</Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-[13px] font-medium text-card-foreground">אין עסקאות החודש</p>
              <p className="text-[13px] text-muted-foreground">לחץ על &ldquo;סנכרן עכשיו&rdquo; כדי להביא את העסקאות מהבנק</p>
              <Button size="sm" onClick={triggerSync} disabled={syncStatus === 'running'} className="mt-2">
                סנכרן עכשיו
              </Button>
            </>
          )}
        </div>
      )}

      {!isEmpty && (
        <>
          <div className="grid grid-cols-3 gap-px bg-border">
            <KpiCell label="הוצאות החודש" value={loading ? '—' : fmt.format(summary?.monthlyTotal ?? 0)} highlight />
            <KpiCell label="מספר עסקאות" value={loading ? '—' : String(summary?.transactionCount ?? 0)} />
            <KpiCell label="קטגוריה מובילה" value={loading ? '—' : (summary?.topCategories?.[0]?.category ?? '—')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">קטגוריות מובילות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 pt-0">
                {!loading && summary?.topCategories.length === 0 && (
                  <p className="text-[13px] text-muted-foreground py-2">אין נתונים</p>
                )}
                {summary?.topCategories.map(c => (
                  <div key={c.category} className="flex justify-between items-baseline py-2 border-b border-border/40 last:border-0">
                    <span className="text-[13px]">{c.category}</span>
                    <span className="text-[13px] font-mono tabular-nums text-foreground">{fmt.format(c.total)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">עסקאות אחרונות</CardTitle>
                <Link href="/transactions" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                  הכל ←
                </Link>
              </CardHeader>
              <CardContent className="space-y-0 pt-0">
                {!loading && summary?.recentTransactions.length === 0 && (
                  <p className="text-[13px] text-muted-foreground py-2">אין עסקאות</p>
                )}
                {summary?.recentTransactions.slice(0, 8).map((t, i) => (
                  <div key={i} className="flex justify-between items-start gap-3 py-2 border-b border-border/40 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] truncate">{t.description}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {dateFmt.format(new Date(t.date))} · {t.friendly_name}
                      </div>
                    </div>
                    <div className="text-[13px] font-mono tabular-nums whitespace-nowrap">{fmt.format(t.chargedAmount)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCell({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-card px-5 py-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-2 font-mono tabular-nums ${highlight ? 'text-[28px] text-primary' : 'text-[22px] text-foreground'}`}>
        {value}
      </div>
    </div>
  );
}
