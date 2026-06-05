import type { Metadata } from 'next';
import PinClient from './PinClient';

export const metadata: Metadata = { title: 'Enter Parent PIN', robots: { index: false } };

export default function PinPage() { return <PinClient />; }
