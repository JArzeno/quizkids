import type { Metadata } from 'next';
import { Suspense } from 'react';
import PlayClient from './PlayClient';

export const metadata: Metadata = { title: 'Learning Games', robots: { index: false } };

export default function PlayPage() { return <Suspense><PlayClient /></Suspense>; }
