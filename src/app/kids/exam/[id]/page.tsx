import type { Metadata } from 'next';
import ExamClient from './ExamClient';

export const metadata: Metadata = { title: 'My Test', robots: { index: false } };

export default function ExamPage() { return <ExamClient />; }
