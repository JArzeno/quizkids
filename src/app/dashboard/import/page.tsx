import type { Metadata } from 'next';
import { Suspense } from 'react';
import ImportClient from './ImportClient';

export const metadata: Metadata = { title: 'Import a Class', robots: { index: false } };

export default function ImportPage() {
  return (
    <Suspense>
      <ImportClient />
    </Suspense>
  );
}
