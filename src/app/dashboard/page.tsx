import type { Metadata } from 'next';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: 'Parent Dashboard',
  description: "See how your kids are doing and create new study materials.",
  robots: { index: false },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
