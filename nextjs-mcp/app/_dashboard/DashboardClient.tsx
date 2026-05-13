'use client';

import { useEffect, useState } from 'react';
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

const fmt = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 });

export function DashboardClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>('idle');
  const [loading, setLoading] = useState(true);

  async function loadSummary() {
    try {
      const r = await fetch('/api/transactions/summary');
      if (!r.ok) { setLoading(false); return; }
      const d = await r.json();
      setSummary(d);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { loadSummary(); }, []);

  async function triggerSync() {
    setSyncStatus('running');
    await fetch('/api/sync', { method: 'POST' });

    const poll = setInterval(async () => {
      const r = await fetch('/api/sync/status');
      const s = await r.json();
      setSyncStatus(s.status);
      if (s.status !== 'running') {
        clearInterval(poll);
        if (s.status === 'done') loadSummary();
      }
    }, 3000);
  }

  return (
    <div className="min-h-screen" dir="rtl">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <header className="flex items-baseline justify-between">
          <div>
            <h1 className="font-display text-3xl text-foreground">לוח בקרה</h1>
            <p className="text-sm text-muted-foreground mt-1">סקירת חודש נוכחי</p>
          </div>
          <Button onClick={triggerSync} disabled={syncStatus === 'running'} size="sm">
            {syncStatus === 'running' ? 'מסנכרן...' : 'סנכרן עכשיו'}
          </Button>
        </header>

        {syncStatus === 'error' && (
          <div className="border border-destructive/40 bg-destructive/5 text-destructive px-3 py-2 text-sm">
            שגיאה בסנכרון. בדוק פרטי גישה ב<Link href="/accounts" className="underline">חשבונות</Link>.
          </div>
        )}

        {/* KPI row — dense, mono amounts. Primary monthly total is the only gold element. */}
        <div className="grid grid-cols-3 gap-px bg-border">
          <KpiCell label="הוצאות החודש" value={loading ? '—' : fmt.format(summary?.monthlyTotal ?? 0)} highlight />
          <KpiCell label="מספר עסקאות" value={loading ? '—' : String(summary?.transactionCount ?? 0)} />
          <KpiCell label="קטגוריה מובילה" value={loading ? '—' : (summary?.topCategories?.[0]?.category ?? 'אחר')} />
        </div>

        {/* Two equal panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">קטגוריות מובילות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {summary?.topCategories.length === 0 && (
                <p className="text-sm text-muted-foreground">אין נתונים</p>
              )}
              {summary?.topCategories.map(c => (
                <div key={c.category} className="flex justify-between items-baseline border-b border-border/40 pb-1.5">
                  <span className="text-sm">{c.category}</span>
                  <span className="text-sm font-mono tabular-nums">{fmt.format(c.total)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">עסקאות אחרונות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 pt-0">
              {summary?.recentTransactions.length === 0 && (
                <p className="text-sm text-muted-foreground">אין עסקאות</p>
              )}
              {summary?.recentTransactions.slice(0, 8).map((t, i) => (
                <div key={i} className="flex justify-between items-start gap-3 border-b border-border/40 pb-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{t.description}</div>
                    <div className="text-xs text-muted-foreground">{t.friendly_name}</div>
                  </div>
                  <div className="text-sm font-mono tabular-nums whitespace-nowrap">{fmt.format(t.chargedAmount)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiCell({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-card px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono tabular-nums text-xl ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value}
      </div>
    </div>
  );
}
