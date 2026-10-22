import type { Metadata } from 'next';
import KidSubjectClient from './KidSubjectClient';

export const metadata: Metadata = { title: 'My Subject', robots: { index: false } };

export default function KidSubjectPage() { return <KidSubjectClient />; }
