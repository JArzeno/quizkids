import type { Metadata } from 'next';
import GenerateClient from './GenerateClient';

export const metadata: Metadata = { title: 'Generate Study Material', robots: { index: false } };

export default function GeneratePage() { return <GenerateClient />; }
