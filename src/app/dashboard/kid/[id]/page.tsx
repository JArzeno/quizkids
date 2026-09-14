import type { Metadata } from 'next';
import KidDetailClient from './KidDetailClient';

export const metadata: Metadata = {
  title: 'Kid progress',
  description: 'See tracked study time, subjects, and strengths for your child.',
  robots: { index: false },
};

export default function KidDetailPage() {
  return <KidDetailClient />;
}
