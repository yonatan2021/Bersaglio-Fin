'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type Step = 1 | 2 | 3;

const STEP_LABELS = ['הגדרת סיסמה', 'חיבור חשבון בנק', 'מוכן!'];

function SetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = (parseInt(searchParams.get('step') ?? '1') as Step) || 1;
  const [step, setStep] = useState<Step>(initialStep);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = parseInt(searchParams.get('step') ?? '1');
    if (s >= 1 && s <= 3) setStep(s as Step);
  }, [searchParams]);

  async function handleInitDb() {
    if (encryptionKey !== confirm) { setError('הסיסמאות אינן זהות'); return; }
    if (encryptionKey.length < 6) { setError('הסיסמה צריכה להיות לפחות 6 תווים'); return; }
    setLoading(true);
    const res = await fetch('/api/setup/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: encryptionKey }),
    });
    setLoading(false);
    if (res.ok) { setStep(2); setError(''); }
    else { const d = await res.json(); setError(d.error ?? 'שגיאה בהגדרה'); }
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
          {/* step indicator */}
          <div className="flex items-center gap-3 mb-4">
            {([1, 2, 3] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0
                  ${step > s ? 'bg-primary text-primary-foreground' : step === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {step > s ? '✓' : s}
                </span>
                <span className={`text-xs ${step === s ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {STEP_LABELS[i]}
                </span>
                {i < 2 && <span className="text-border mx-1">›</span>}
              </div>
            ))}
          </div>

          <CardTitle className="font-display text-xl">
            {step === 1 && 'בחר סיסמה לאפליקציה'}
            {step === 2 && 'חבר את חשבון הבנק שלך'}
            {step === 3 && 'הכל מוכן!'}
          </CardTitle>
          <CardDescription>
            {step === 1 && 'הסיסמה מגנה על הנתונים הפיננסיים שלך. היא שמורה רק במחשב שלך ולא נשלחת לשום מקום.'}
            {step === 2 && 'כדי לראות את ההוצאות שלך, חבר לפחות חשבון בנק אחד. ניתן להוסיף עוד חשבונות בהמשך.'}
            {step === 3 && 'הנתונים מוכנים. עכשיו ניתן לראות את ההוצאות, להגדיר תקציב ולנהל את החשבונות.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="key1">סיסמה</Label>
                <Input
                  id="key1"
                  type="password"
                  value={encryptionKey}
                  onChange={e => setEncryptionKey(e.target.value)}
                  placeholder="לפחות 6 תווים"
                  onKeyDown={e => e.key === 'Enter' && document.getElementById('key2')?.focus()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key2">אימות סיסמה</Label>
                <Input
                  id="key2"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="הקלד שוב"
                  onKeyDown={e => e.key === 'Enter' && handleInitDb()}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <p className="text-xs text-muted-foreground">
                שים לב: אם תשכח את הסיסמה, תצטרך להתחיל מחדש. שמור אותה במקום בטוח.
              </p>
              <Button onClick={handleInitDb} disabled={loading || !encryptionKey || !confirm} className="w-full">
                {loading ? 'יוצר...' : 'המשך'}
              </Button>
            </>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Button onClick={() => router.push('/accounts/new?from=setup')} className="w-full">
                חבר חשבון בנק
              </Button>
              <Button onClick={handleSync} disabled={loading} variant="outline" className="w-full">
                {loading ? 'ממשיך...' : 'דלג בינתיים'}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                ניתן לחבר חשבונות בנק בכל עת דרך עמוד החשבונות
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <Button onClick={() => router.push('/')} className="w-full">
                כניסה ללוח הבקרה
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                מומלץ לסנכרן את החשבונות מלוח הבקרה לאחר הכניסה
              </p>
            </div>
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
