import type { Metadata } from 'next';
import { HomePage } from '@/components/marketing/pages/HomePage';
import { HOME } from '@/content/home';
import { pageMetadata } from '@/lib/site';

const L = 'es';

export const metadata: Metadata = pageMetadata(L, '/', HOME[L].metaTitle, HOME[L].metaDescription, { absoluteTitle: true });

export default function Page() {
  return <HomePage locale={L} />;
}
