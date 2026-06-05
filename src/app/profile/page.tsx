import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: "Who's learning today?",
  robots: { index: false },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
