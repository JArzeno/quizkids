import type { Metadata } from 'next';
import GuideClient from './GuideClient';

export const metadata: Metadata = { title: 'Study Guide', robots: { index: false } };

export default function GuidePage() { return <GuideClient />; }
