import type { Metadata } from 'next';
import KidCodeClient from './KidCodeClient';

export const metadata: Metadata = { title: 'Enter Kid Code', robots: { index: false } };

export default function KidCodePage() { return <KidCodeClient />; }
