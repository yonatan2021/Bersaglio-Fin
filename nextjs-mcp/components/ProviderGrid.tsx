'use client';

import { PROVIDERS, type Provider } from '@/lib/providers';
import { cn } from '@/lib/utils';

interface Props {
  selected: string | null;
  onSelect: (id: string) => void;
}

export function ProviderGrid({ selected, onSelect }: Props) {
  const banks = PROVIDERS.filter(p => p.category === 'bank');
  const credit = PROVIDERS.filter(p => p.category === 'credit');

  function ProviderCard({ p }: { p: Provider }) {
    return (
      <button
        type="button"
        onClick={() => onSelect(p.id)}
        className={cn(
          'w-full p-3 rounded-lg border text-start transition-colors',
          selected === p.id
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        )}
      >
        <div className="font-medium text-sm">{p.displayName}</div>
        <div className="text-xs text-muted-foreground">{p.displayNameEn}</div>
      </button>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">בנקים</h3>
        <div className="grid grid-cols-2 gap-2">
          {banks.map(p => <ProviderCard key={p.id} p={p} />)}
        </div>
      </section>
      <section>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">כרטיסי אשראי</h3>
        <div className="grid grid-cols-2 gap-2">
          {credit.map(p => <ProviderCard key={p.id} p={p} />)}
        </div>
      </section>
    </div>
  );
}
