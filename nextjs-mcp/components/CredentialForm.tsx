'use client';

import { useState } from 'react';
import { PROVIDER_MAP } from '@/lib/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  providerId: string;
  onSuccess: () => void;
}

export function CredentialForm({ providerId, onSuccess }: Props) {
  const provider = PROVIDER_MAP.get(providerId);
  const [values, setValues] = useState<Record<string, string>>({});
  const [friendlyName, setFriendlyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!provider) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scraper_type: providerId,
        friendly_name: friendlyName || provider!.displayName,
        credentials: values,
      }),
    });
    setLoading(false);
    if (res.ok) {
      onSuccess();
    } else {
      const d = await res.json().catch(() => ({ error: 'שגיאת רשת' }));
      setError(typeof d.error === 'string' ? d.error : 'שגיאה בשמירת הפרטים');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      <div className="space-y-2">
        <Label htmlFor="friendly_name">שם לחשבון</Label>
        <Input
          id="friendly_name"
          value={friendlyName}
          onChange={e => setFriendlyName(e.target.value)}
          placeholder={provider.displayName}
        />
      </div>
      {provider.fields.map(field => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            type={field.type}
            value={values[field.name] ?? ''}
            onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}
            placeholder={field.placeholder}
            required
            autoComplete={field.type === 'password' ? 'new-password' : 'off'}
          />
        </div>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'שומר...' : 'שמור חשבון'}
      </Button>
    </form>
  );
}
