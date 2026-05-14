'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BudgetEntry {
  id: number;
  category: string;
  monthly_limit: number;
  spent: number;
}

const fmt = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 });

function ProgressBar({ pct }: { pct: number }) {
  const over = pct > 100;
  return (
    <div className="h-1 bg-border rounded-full overflow-hidden">
      <div
        className={`h-full transition-all ${over ? 'bg-destructive' : 'bg-primary'}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

export function BudgetClient() {
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formCategory, setFormCategory] = useState('');
  const [formLimit, setFormLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  async function load() {
    try {
      const r = await fetch('/api/budget');
      if (!r.ok) { setLoading(false); return; }
      const d = await r.json();
      setBudgets(d.budgets);
      setAllCategories(d.allCategories);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // load once on mount

  async function handleSave() {
    if (!formCategory || !formLimit) return;
    setSaving(true);
    await fetch('/api/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: formCategory, monthly_limit: Number(formLimit) }),
    });
    setSaving(false);
    setShowForm(false);
    setFormCategory('');
    setFormLimit('');
    load();
  }

  async function handleDelete(category: string) {
    if (!confirm(`למחוק תקציב עבור "${category}"?`)) return;
    setDeletingCategory(category);
    await fetch('/api/budget', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    });
    setDeletingCategory(null);
    load();
  }

  const budgetCategories = new Set(budgets.map(b => b.category));
  const availableCategories = allCategories.filter(c => !budgetCategories.has(c));

  return (
    <div className="min-h-screen" dir="rtl">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <header className="flex items-baseline justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl">תקציב</h1>
            <p className="text-sm text-muted-foreground mt-1">מגבלות חודשיות לפי קטגוריה</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'ביטול' : '+ תקציב חדש'}
          </Button>
        </header>

        {showForm && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">הגדר מגבלה חודשית</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">קטגוריה</label>
                  {availableCategories.length > 0 ? (
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                    >
                      <option value="">בחר קטגוריה</option>
                      {availableCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      placeholder="שם קטגוריה"
                    />
                  )}
                </div>
                <div className="w-36">
                  <label className="text-xs text-muted-foreground mb-1 block">מגבלה (₪)</label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={formLimit}
                    onChange={e => setFormLimit(e.target.value)}
                    placeholder="5000"
                  />
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !formCategory || !formLimit}
              >
                {saving ? 'שומר...' : 'שמור'}
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && <p className="text-sm text-muted-foreground">טוען...</p>}

        {!loading && budgets.length === 0 && (
          <div className="border border-border py-12 px-6 text-center">
            <p className="text-muted-foreground mb-2">אין תקציבים מוגדרים</p>
            <p className="text-xs text-muted-foreground mb-4">הגדר מגבלה חודשית לפי קטגוריה כדי לעקוב אחר ההוצאות</p>
            <Button onClick={() => setShowForm(true)}>הגדר תקציב ראשון</Button>
          </div>
        )}

        <div className="space-y-px">
          {budgets.map(b => {
            const pct = b.monthly_limit > 0 ? (b.spent / b.monthly_limit) * 100 : 0;
            const over = pct > 100;
            return (
              <div key={b.category} className="bg-card px-4 py-4 space-y-2 border border-border border-b-0 last:border-b">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-sm">{b.category}</span>
                  <div className="flex items-center gap-4">
                    <span className={`font-mono tabular-nums text-sm ${over ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {fmt.format(b.spent)} / {fmt.format(b.monthly_limit)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-6 px-2"
                      disabled={deletingCategory === b.category}
                      onClick={() => handleDelete(b.category)}
                    >
                      {deletingCategory === b.category ? '...' : '×'}
                    </Button>
                  </div>
                </div>
                <ProgressBar pct={pct} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{over ? `חריגה של ${fmt.format(b.spent - b.monthly_limit)}` : `נותר ${fmt.format(b.monthly_limit - b.spent)}`}</span>
                  <span>{Math.round(pct)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
