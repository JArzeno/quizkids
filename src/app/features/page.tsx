import type { Metadata } from 'next';
import { FeaturesPage } from '@/components/marketing/pages/FeaturesPage';
import { FEATURES } from '@/content/features';
import { pageMetadata } from '@/lib/site';

const L = 'en';

export const metadata: Metadata = pageMetadata(L, '/features', FEATURES[L].metaTitle, FEATURES[L].metaDescription);

export default function Page() {
  return <FeaturesPage locale={L} />;
}
