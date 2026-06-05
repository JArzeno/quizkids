import type { Metadata } from 'next';
import PickerClient from './PickerClient';

export const metadata: Metadata = { title: 'Pick a Subject & Topic', robots: { index: false } };

export default function PickerPage() { return <PickerClient />; }
