import type { Metadata } from 'next';
import { Suspense } from 'react';
import ClassroomClient from './ClassroomClient';

export const metadata: Metadata = { title: 'Google Classroom', robots: { index: false } };

export default function ClassroomPage() {
  return <Suspense><ClassroomClient /></Suspense>;
}
