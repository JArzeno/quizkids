'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { PricingCards } from '@/components/ui/PricingCards';
import type { Locale } from '@/lib/site';

/** The app's plan card with its monthly/yearly toggle; picking it goes to sign-up */
export function PricingPlan({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [cycle, setCycle] = React.useState('monthly');
  return <PricingCards lang={locale} cycle={cycle} setCycle={setCycle} onSelect={() => router.push('/auth')} />;
}
