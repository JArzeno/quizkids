import type { Metadata } from 'next';
import ConvertPdfCatalogClient from './ConvertPdfCatalogClient';

export const metadata: Metadata = { title: 'Import PDF Catalog · QuizKids', robots: { index: false } };

export default function ConvertPdfCatalogPage() { return <ConvertPdfCatalogClient />; }
