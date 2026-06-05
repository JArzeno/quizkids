import type { Metadata } from 'next';
import AddKidClient from './AddKidClient';

export const metadata: Metadata = { title: 'Add a Kid', robots: { index: false } };

export default function AddKidPage() { return <AddKidClient />; }
