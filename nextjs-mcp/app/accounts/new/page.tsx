'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProviderGrid } from '@/components/ProviderGrid';
import { CredentialForm } from '@/components/CredentialForm';
import { Button } from '@/components/ui/button';

function NewAccountInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSetup = searchParams.get('from') === 'setup';
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const onSuccess = () => router.push(fromSetup ? '/setup?step=3' : '/accounts');

  return (
    <div className="max-w-2xl mx-auto p-6" dir="rtl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>→ חזור</Button>
        <h1 className="font-display text-2xl">הוסף חשבון</h1>
      </div>
      {!selectedProvider ? (
        <ProviderGrid selected={selectedProvider} onSelect={setSelectedProvider} />
      ) : (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedProvider(null)}>
            → בחר ספק אחר
          </Button>
          <CredentialForm
            providerId={selectedProvider}
            onSuccess={onSuccess}
          />
        </div>
      )}
    </div>
  );
}

export default function NewAccountPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground" dir="rtl">טוען...</div>}>
      <NewAccountInner />
    </Suspense>
  );
}
