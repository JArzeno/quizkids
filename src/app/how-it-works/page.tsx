import type { Metadata } from 'next';
import { HowItWorksPage } from '@/components/marketing/pages/HowItWorksPage';
import { HOW } from '@/content/howItWorks';
import { pageMetadata } from '@/lib/site';

const L = 'en';

export const metadata: Metadata = pageMetadata(L, '/how-it-works', HOW[L].metaTitle, HOW[L].metaDescription);

export default function Page() {
  return <HowItWorksPage locale={L} />;
}
