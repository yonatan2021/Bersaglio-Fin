'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function SettingsClient() {
  async function handleLock() {
    await fetch('/api/auth/lock', { method: 'POST' });
    window.location.reload();
  }

  async function handleWipe() {
    if (!confirm('למחוק את כל החשבונות והעסקאות? פעולה זו אינה הפיכה.')) return;
    await fetch('/api/accounts', { method: 'DELETE' });
    alert('הנתונים נמחקו.');
    window.location.href = '/';
  }

  return (
    <div className="px-8 py-8 space-y-6 max-w-2xl" dir="rtl">
      <header>
        <h1 className="font-display text-[24px] font-semibold text-card-foreground">הגדרות</h1>
        <p className="text-[13px] text-muted-foreground mt-1">ניהול האפליקציה</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-[15px] font-display">נעילת מסך</CardTitle>
          <CardDescription className="text-[13px]">
            האפליקציה ננעלת אוטומטית אחרי 30 דקות ללא פעילות. ניתן לנעול ידנית בכל עת.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={handleLock}>נעל עכשיו</Button>
        </CardContent>
      </Card>

      <div className="border border-destructive/30 rounded-lg">
        <div className="px-6 py-4 border-b border-destructive/20">
          <div className="text-[15px] font-display font-semibold text-destructive">אזור סכנה</div>
          <div className="text-[13px] text-muted-foreground mt-0.5">
            פעולה זו תמחק את כל החשבונות המחוברים ואת כל העסקאות השמורות. לא ניתן לשחזר.
          </div>
        </div>
        <div className="px-6 py-4">
          <Button variant="destructive" size="sm" onClick={handleWipe}>
            מחק את כל הנתונים
          </Button>
        </div>
      </div>
    </div>
  );
}
