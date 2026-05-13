'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Transaction {
  scraper_credential_id: number;
  identifier: string;
  type: string;
  date: string;
  chargedAmount: number;
  chargedCurrency: string;
  description: string;
  category: string | null;
  friendly_name: string;
  scraper_type: string;
}

const fmt = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 });

export function TransactionsClient() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hasMore, setHasMore] = useState(true);

  async function load(p: number = 1, reset = false) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), pageSize: '50' });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    try {
      const r = await fetch(`/api/transactions?${params}`);
      if (!r.ok) { setLoading(false); return; }
      const data = await r.json();
      setTransactions(prev => reset ? data.data : [...prev, ...data.data]);
      setHasMore(data.data.length === 50);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(1, true); setPage(1); }, [startDate, endDate]);

  function handleExport() {
    const header = ['תאריך', 'תיאור', 'סכום', 'מטבע', 'קטגוריה', 'חשבון'].join(',');
    const rows = transactions.map(t => [
      t.date.split('T')[0],
      `"${(t.description ?? '').replace(/"/g, '""')}"`,
      t.chargedAmount,
      t.chargedCurrency,
      t.category ?? '',
      t.friendly_name,
    ].join(','));
    const csv = '﻿' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen" dir="rtl">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <header className="flex items-baseline justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl">עסקאות</h1>
            <p className="text-sm text-muted-foreground mt-1">{transactions.length} עסקאות מוצגות</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={transactions.length === 0}>
            ייצא CSV
          </Button>
        </header>

        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">מ-</label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-auto h-8" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">עד</label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-auto h-8" />
          </div>
          {(startDate || endDate) && (
            <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>נקה</Button>
          )}
        </div>

        <div className="border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-card">
              <tr>
                <th className="text-start p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">תאריך</th>
                <th className="text-start p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">תיאור</th>
                <th className="text-start p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">קטגוריה</th>
                <th className="text-start p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">חשבון</th>
                <th className="text-end p-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">סכום</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((t, i) => (
                <tr key={`${t.scraper_credential_id}-${t.identifier}-${i}`} className="hover:bg-card/50">
                  <td className="p-3 text-muted-foreground whitespace-nowrap font-mono tabular-nums text-xs">{t.date.split('T')[0]}</td>
                  <td className="p-3 max-w-xs truncate">{t.description}</td>
                  <td className="p-3 text-muted-foreground">{t.category ?? '—'}</td>
                  <td className="p-3 text-muted-foreground text-xs">{t.friendly_name}</td>
                  <td className="p-3 text-end font-mono tabular-nums whitespace-nowrap">{fmt.format(t.chargedAmount)}</td>
                </tr>
              ))}
              {transactions.length === 0 && !loading && (
                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground text-sm">אין עסקאות</td></tr>
              )}
            </tbody>
          </table>
          {loading && <div className="p-4 text-center text-muted-foreground text-sm">טוען...</div>}
          {!loading && hasMore && transactions.length > 0 && (
            <div className="p-3 border-t border-border text-center">
              <Button variant="outline" size="sm" onClick={() => { const next = page + 1; setPage(next); load(next); }}>
                טען עוד
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
