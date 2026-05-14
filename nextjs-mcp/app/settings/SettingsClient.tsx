'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function SettingsClient() {
  async function handleLock() {
    await fetch('/api/auth/lock', { method: 'POST' });
    window.location.reload();
  }

  async function handleWipe() {
    if (!confirm('האם למחוק את כל החשבונות והעסקאות? לא ניתן לשחזר אחרי המחיקה.')) return;
    await fetch('/api/accounts', { method: 'DELETE' });
    alert('כל הנתונים נמחקו.');
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen" dir="rtl">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <header>
          <h1 className="font-display text-3xl">הגדרות</h1>
          <p className="text-sm text-muted-foreground mt-1">ניהול האפליקציה</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display">נעילת מסך</CardTitle>
            <CardDescription>
              האפליקציה ננעלת אוטומטית אחרי 30 דקות ללא פעילות. ניתן לנעול ידנית בכל עת.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleLock}>נעל עכשיו</Button>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base font-display text-destructive">מחיקת כל הנתונים</CardTitle>
            <CardDescription>
              פעולה זו תמחק את כל החשבונות המחוברים ואת כל העסקאות השמורות. לא ניתן לשחזר.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleWipe}>
              מחק את כל הנתונים
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
