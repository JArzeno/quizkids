import type { Metadata } from 'next';
import { FaqPage } from '@/components/marketing/pages/FaqPage';
import { FAQ } from '@/content/faq';
import { pageMetadata } from '@/lib/site';

const L = 'en';

export const metadata: Metadata = pageMetadata(L, '/faq', FAQ[L].metaTitle, FAQ[L].metaDescription);

export default function Page() {
  return <FaqPage locale={L} />;
}
