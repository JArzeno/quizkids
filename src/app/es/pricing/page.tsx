import type { Metadata } from 'next';
import { PricingPage } from '@/components/marketing/pages/PricingPage';
import { PRICING } from '@/content/pricing';
import { pageMetadata } from '@/lib/site';

const L = 'es';

export const metadata: Metadata = pageMetadata(L, '/pricing', PRICING[L].metaTitle, PRICING[L].metaDescription);

export default function Page() {
  return <PricingPage locale={L} />;
}
