import type { Metadata } from 'next';
import AuthClient from './AuthClient';

export const metadata: Metadata = {
  title: 'Sign in or Create Account',
  description: 'Sign in to QuizKids or create a free account to start generating quizzes and study guides for your kids.',
  robots: { index: false },
};

export default function AuthPage() {
  return <AuthClient />;
}
