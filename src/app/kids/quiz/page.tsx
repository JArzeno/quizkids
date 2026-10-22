import type { Metadata } from 'next';
import { Suspense } from 'react';
import QuizClient from './QuizClient';

export const metadata: Metadata = { title: 'Quiz Time!', robots: { index: false } };

export default function QuizPage() {
  return (
    <Suspense>
      <QuizClient />
    </Suspense>
  );
}
