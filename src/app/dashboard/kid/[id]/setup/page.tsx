import type { Metadata } from 'next';
import SetupClient from './SetupClient';

export const metadata: Metadata = {
  title: 'Set up classes',
  description: "Add your child's subjects, classes, and a few photos from school.",
  robots: { index: false },
};

export default function KidSetupPage() {
  return <SetupClient />;
}
