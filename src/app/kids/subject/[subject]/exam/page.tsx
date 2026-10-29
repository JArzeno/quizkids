import type { Metadata } from 'next';
import ExamNewClient from './ExamNewClient';

export const metadata: Metadata = { title: 'Test Mode', robots: { index: false } };

export default function ExamNewPage() { return <ExamNewClient />; }
