import type { Metadata } from 'next';
import ImportClient from './ImportClient';

export const metadata: Metadata = { title: 'Import a Class', robots: { index: false } };

export default function ImportPage() { return <ImportClient />; }
