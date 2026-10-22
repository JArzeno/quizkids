import type { Metadata } from 'next';
import PlacementClient from './PlacementClient';

export const metadata: Metadata = { title: 'Find your level', robots: { index: false } };

export default function PlacementPage() { return <PlacementClient />; }
