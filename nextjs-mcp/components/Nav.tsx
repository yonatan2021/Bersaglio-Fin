'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const links = [
  { href: '/', label: 'לוח בקרה' },
  { href: '/accounts', label: 'חשבונות' },
  { href: '/transactions', label: 'עסקאות' },
  { href: '/budget', label: 'תקציב' },
  { href: '/settings', label: 'הגדרות' },
];

export function Nav() {
  const pathname = usePathname();

  // Hide nav on /setup (pre-DB-init context)
  if (pathname?.startsWith('/setup')) return null;

  async function handleLock() {
    await fetch('/api/auth/lock', { method: 'POST' });
    window.location.reload();
  }

  return (
    <nav className="border-b border-border" dir="rtl">
      <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="font-display text-base me-4 tracking-tight">Bersaglio</span>
          {links.map(l => {
            const active = pathname === l.href || (l.href !== '/' && pathname?.startsWith(l.href));
            return (
              <Link key={l.href} href={l.href}
                className={cn(
                  'px-3 py-1.5 text-sm transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <Button variant="ghost" size="sm" onClick={handleLock} className="text-muted-foreground hover:text-foreground">
          נעל
        </Button>
      </div>
    </nav>
  );
}
