'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [hasMore, setHasMore] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearchChange(v: string) {
    setSearchInput(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(v), 300);
  }

  useEffect(() => {
    fetch('/api/transactions/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  async function load(p: number = 1, reset = false) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), pageSize: '50' });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    try {
      const r = await fetch(`/api/transactions?${params}`);
      if (!r.ok) { setLoading(false); return; }
      const data = await r.json();
      setTransactions(prev => reset ? data.data : [...prev, ...data.data]);
      setHasMore(data.data.length === 50);
    } catch { /* ignore */ }
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(1, true); setPage(1); }, [startDate, endDate, search, category]);

  const hasActiveFilters = startDate || endDate || search || category;

  function clearFilters() {
    setStartDate(''); setEndDate('');
    setSearchInput(''); setSearch(''); setCategory('');
  }

  function handleExport() {
    const header = ['תאריך', 'תיאור', 'סכום', 'מטבע', 'קטגוריה', 'חשבון'].join(',');
    const rows = transactions.map(t => [
      t.date.split('T')[0],
      `"${(t.description ?? '').replace(/"/g, '""')}"`,
      t.chargedAmount, t.chargedCurrency, t.category ?? '', t.friendly_name,
    ].join(','));
    const csv = '﻿' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="px-8 py-8" dir="rtl">
      <header className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="font-display text-[24px] font-semibold text-card-foreground">עסקאות</h1>
          <p className="text-[13px] text-muted-foreground mt-1">{transactions.length} עסקאות מוצגות</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={transactions.length === 0}>
          ייצא CSV
        </Button>
      </header>

      <div className="flex flex-wrap gap-2 mb-5 items-center">
        <Input
          type="search"
          placeholder="חיפוש לפי תיאור..."
          value={searchInput}
          onChange={e => handleSearchChange(e.target.value)}
          className="h-7 w-48 text-[13px]"
        />
        {categories.length > 0 && (
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="h-7 rounded border border-input bg-background px-2 text-[13px] text-foreground"
          >
            <option value="">כל הקטגוריות</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-muted-foreground">מ-</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-auto h-7 text-[13px]" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-muted-foreground">עד</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-auto h-7 text-[13px]" />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-[13px] text-muted-foreground">
            נקה פילטרים
          </Button>
        )}
      </div>

      <div className="border border-border">
        <table className="w-full text-[13px]">
          <thead className="border-b border-border bg-card">
            <tr>
              <th className="text-start px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-widest">תאריך</th>
              <th className="text-start px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-widest">תיאור</th>
              <th className="text-start px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-widest">קטגוריה</th>
              <th className="text-start px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-widest">חשבון</th>
              <th className="text-end px-4 py-2.5 font-medium text-muted-foreground text-[11px] uppercase tracking-widest">סכום</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((t, i) => (
              <tr key={`${t.scraper_credential_id}-${t.identifier}-${i}`} className="hover:bg-card/50">
                <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap font-mono tabular-nums text-[11px]">{t.date.split('T')[0]}</td>
                <td className="px-4 py-2.5 max-w-xs truncate">{t.description}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {t.category ? (
                    <button className="hover:text-foreground hover:underline text-[13px]" onClick={() => setCategory(t.category!)}>
                      {t.category}
                    </button>
                  ) : '—'}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground text-[11px]">{t.friendly_name}</td>
                <td className="px-4 py-2.5 text-end font-mono tabular-nums whitespace-nowrap">{fmt.format(t.chargedAmount)}</td>
              </tr>
            ))}
            {transactions.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-muted-foreground text-[13px]">
                  {hasActiveFilters ? 'אין עסקאות התואמות לפילטר הנוכחי' : 'אין עסקאות — סנכרן חשבונות כדי להתחיל'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && <div className="px-4 py-4 text-muted-foreground text-[13px]">טוען...</div>}
        {!loading && hasMore && transactions.length > 0 && (
          <div className="p-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => { const next = page + 1; setPage(next); load(next); }}>
              טען עוד
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
