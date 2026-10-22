import type { Metadata } from 'next';
import { Suspense } from 'react';
import ClassroomImportClient from './ClassroomImportClient';

export const metadata: Metadata = { title: 'Import from Google Classroom', robots: { index: false } };

export default function ClassroomImportPage() {
  return <Suspense><ClassroomImportClient /></Suspense>;
}
