import type { Metadata } from 'next';
import { LegalPage } from '@/components/marketing/pages/LegalPage';
import { TERMS } from '@/content/legal';
import { pageMetadata } from '@/lib/site';

const L = 'en';

export const metadata: Metadata = pageMetadata(L, '/terms', TERMS[L].metaTitle, TERMS[L].metaDescription);

export default function Page() {
  return <LegalPage locale={L} page="/terms" doc={TERMS[L]} />;
}
