import type { Metadata } from 'next';
import ResultsClient from './ResultsClient';

export const metadata: Metadata = { title: 'Quiz Results', robots: { index: false } };

export default function ResultsPage() { return <ResultsClient />; }
