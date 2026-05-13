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
    <div className="min-h-screen" dir="rtl">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <header>
          <h1 className="font-display text-3xl">הגדרות</h1>
          <p className="text-sm text-muted-foreground mt-1">תצורת אפליקציה ומסד נתונים</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display">אבטחה</CardTitle>
            <CardDescription>נעילה אוטומטית אחרי 30 דקות חוסר פעילות</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleLock}>נעל עכשיו</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display">Claude Desktop (MCP)</CardTitle>
            <CardDescription>
              כדי שה-MCP route יעבוד ללא פתיחת ה-dashboard, הגדר משתנה סביבה ב-<code className="text-xs bg-muted px-1 py-0.5">.env.local</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <pre className="bg-muted p-3 text-xs text-start font-mono" dir="ltr">ENCRYPTION_KEY=your-key-here</pre>
            <p className="text-xs text-muted-foreground">
              ללא משתנה זה, Claude Desktop יצטרך שה-dashboard יהיה פתוח ופתוח לפני שליחת שאילתות.
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base font-display text-destructive">אזור סכנה</CardTitle>
            <CardDescription>פעולות בלתי הפיכות</CardDescription>
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
