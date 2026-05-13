'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function UnlockModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((data) => {
        if (!data.unlocked) setOpen(true);
      })
      .catch(() => {
        // If status check fails, surface the modal so the user can try anyway.
        setOpen(true);
      });
  }, []);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: encryptionKey }),
    });
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      const shouldRedirect =
        typeof window !== 'undefined' && window.location.pathname === '/setup';
      router.refresh();
      if (shouldRedirect) router.push('/');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'שגיאה בפתיחת המסד');
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-display">נעול</DialogTitle>
          <DialogDescription>
            הזן את מפתח ההצפנה כדי לגשת לנתונים
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key">מפתח הצפנה</Label>
            <Input
              id="key"
              type="password"
              value={encryptionKey}
              onChange={(e) => setEncryptionKey(e.target.value)}
              placeholder="לפחות 6 תווים"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            disabled={loading || encryptionKey.length < 6}
            className="w-full"
          >
            {loading ? 'פותח...' : 'פתח'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
