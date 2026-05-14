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
        <p className="text-[13px] text-muted-foreground mt-1">תצורת אפליקציה ומסד נתונים</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-[15px] font-display">אבטחה</CardTitle>
          <CardDescription className="text-[13px]">נעילה אוטומטית אחרי 30 דקות חוסר פעילות</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={handleLock}>נעל עכשיו</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[15px] font-display">Claude Desktop (MCP)</CardTitle>
          <CardDescription className="text-[13px]">
            כדי שה-MCP route יעבוד ללא פתיחת ה-dashboard, הגדר משתנה סביבה ב-<code className="text-[11px] bg-muted px-1 py-0.5 rounded font-mono">‎.env.local</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="bg-muted p-3 text-[11px] text-start font-mono rounded" dir="ltr">ENCRYPTION_KEY=your-key-here</pre>
          <p className="text-[11px] text-muted-foreground">
            ללא משתנה זה, Claude Desktop יצטרך שה-dashboard יהיה פתוח לפני שליחת שאילתות.
          </p>
        </CardContent>
      </Card>

      <div className="border border-destructive/30 rounded-lg">
        <div className="px-6 py-4 border-b border-destructive/20">
          <div className="text-[15px] font-display font-semibold text-destructive">אזור סכנה</div>
          <div className="text-[13px] text-muted-foreground mt-0.5">פעולות בלתי הפיכות</div>
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
