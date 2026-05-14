'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Building2, ReceiptText, PieChart, Settings, Lock } from 'lucide-react';

const links = [
  { href: '/', label: 'לוח בקרה', icon: LayoutDashboard },
  { href: '/accounts', label: 'חשבונות', icon: Building2 },
  { href: '/transactions', label: 'עסקאות', icon: ReceiptText },
  { href: '/budget', label: 'תקציב', icon: PieChart },
  { href: '/settings', label: 'הגדרות', icon: Settings },
];

export function Nav() {
  const pathname = usePathname();

  if (pathname?.startsWith('/setup')) return null;

  async function handleLock() {
    await fetch('/api/auth/lock', { method: 'POST' });
    window.location.reload();
  }

  return (
    <aside className="w-52 flex-shrink-0 border-e border-border bg-sidebar flex flex-col">
      <div className="px-5 pt-5 pb-6">
        <span className="font-display text-lg font-bold text-primary tracking-tight">Bersaglio</span>
      </div>

      <nav className="flex-1 px-2 space-y-0.5" aria-label="ניווט ראשי">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 text-sm rounded transition-colors duration-150',
                active
                  ? 'bg-secondary text-card-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              )}
            >
              <Icon size={14} strokeWidth={1.75} className="flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border">
        <button
          onClick={handleLock}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded transition-colors duration-150"
        >
          <Lock size={14} strokeWidth={1.75} className="flex-shrink-0" />
          נעל
        </button>
      </div>
    </aside>
  );
}
