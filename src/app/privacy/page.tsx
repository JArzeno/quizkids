import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/pages/LegalPage';
import { PRIVACY } from '@/content/legal';
import { pageMetadata } from '@/lib/site';

const L = 'en';

export const metadata: Metadata = pageMetadata(L, '/privacy', PRIVACY[L].metaTitle, PRIVACY[L].metaDescription);

export default function Page() {
  return <LegalPage locale={L} page="/privacy" doc={PRIVACY[L]} />;
}
