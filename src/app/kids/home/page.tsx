import type { Metadata } from 'next';
import KidHomeClient from './KidHomeClient';

export const metadata: Metadata = { title: "Kid's Learning Space", robots: { index: false } };

export default function KidHomePage() { return <KidHomeClient />; }
