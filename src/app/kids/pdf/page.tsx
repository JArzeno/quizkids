import type { Metadata } from 'next';
import PdfClient from './PdfClient';

export const metadata: Metadata = { title: 'Printable Worksheet', robots: { index: false } };

export default function PdfPage() { return <PdfClient />; }
