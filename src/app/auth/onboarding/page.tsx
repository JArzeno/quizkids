import type { Metadata } from 'next';
import OnboardingClient from './OnboardingClient';

export const metadata: Metadata = {
  title: 'Set up your account',
  description: "Tell us a bit about your family so we can tailor QuizKids to you.",
  robots: { index: false },
};

export default function ParentOnboardingPage() {
  return <OnboardingClient />;
}
