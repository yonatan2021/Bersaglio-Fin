'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type Step = 1 | 2 | 3;

function SetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = (parseInt(searchParams.get('step') ?? '1') as Step) || 1;
  const [step, setStep] = useState<Step>(initialStep);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state when URL ?step= changes (e.g., returning from /accounts/new)
  useEffect(() => {
    const s = parseInt(searchParams.get('step') ?? '1');
    if (s >= 1 && s <= 3) setStep(s as Step);
  }, [searchParams]);

  async function handleInitDb() {
    if (encryptionKey !== confirm) { setError('המפתחות אינם תואמים'); return; }
    if (encryptionKey.length < 6) { setError('לפחות 6 תווים'); return; }
    setLoading(true);
    const res = await fetch('/api/setup/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: encryptionKey }),
    });
    setLoading(false);
    if (res.ok) { setStep(2); setError(''); }
    else { const d = await res.json(); setError(d.error ?? 'שגיאה'); }
  }

  async function handleSync() {
    setLoading(true);
    await fetch('/api/sync', { method: 'POST' });
    setLoading(false);
    setStep(3);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            {([1, 2, 3] as Step[]).map(s => (
              <span key={s} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {s}
              </span>
            ))}
          </div>
          <CardTitle className="font-display">
            {step === 1 && 'הגדרת מפתח הצפנה'}
            {step === 2 && 'הוסף חשבון בנק ראשון'}
            {step === 3 && 'הגדרה הושלמה'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'הנתונים מוצפנים מקומית. המפתח לא נשמר בשום מקום.'}
            {step === 2 && 'הוסף חשבון בנק כדי להתחיל לעקוב אחר הוצאות.'}
            {step === 3 && 'הנתונים מוכנים. ניתן עכשיו לגשת ללוח הבקרה.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="key1">מפתח הצפנה</Label>
                <Input id="key1" type="password" value={encryptionKey} onChange={e => setEncryptionKey(e.target.value)} placeholder="לפחות 6 תווים" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key2">אימות מפתח</Label>
                <Input id="key2" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="הזן שוב" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleInitDb} disabled={loading} className="w-full">
                {loading ? 'יוצר...' : 'הגדר מסד נתונים'}
              </Button>
            </>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <Button onClick={() => router.push('/accounts/new?from=setup')} variant="outline" className="w-full">
                הוסף חשבון עכשיו
              </Button>
              <Button onClick={handleSync} disabled={loading} className="w-full">
                {loading ? 'מסנכרן...' : 'דלג וסנכרן'}
              </Button>
            </div>
          )}
          {step === 3 && (
            <Button onClick={() => router.push('/')} className="w-full">
              עבור ללוח הבקרה
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense>
      <SetupPageContent />
    </Suspense>
  );
}
