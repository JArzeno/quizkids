import type { Metadata } from 'next';
import { AboutPage } from '@/components/marketing/pages/AboutPage';
import { ABOUT } from '@/content/about';
import { pageMetadata } from '@/lib/site';

const L = 'es';

export const metadata: Metadata = pageMetadata(L, '/about', ABOUT[L].metaTitle, ABOUT[L].metaDescription);

export default function Page() {
  return <AboutPage locale={L} />;
}
