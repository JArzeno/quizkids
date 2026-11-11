import type { Metadata } from 'next';
import { Suspense } from 'react';
import WordsClient from './WordsClient';

export const metadata: Metadata = { title: 'Spelling Words', robots: { index: false } };

export default function WordsPage() { return <Suspense><WordsClient /></Suspense>; }
