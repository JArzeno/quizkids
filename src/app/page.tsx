import type { Metadata } from 'next';
import LandingClient from './LandingClient';

export const metadata: Metadata = {
  title: 'QuizKids — A cozy place for kids to love learning',
  description: 'AI-generated quizzes, study guides, and printable worksheets for kids K-12. Bilingual English & Spanish. No ads, no chat — just learning.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'QuizKids — A cozy place for kids to love learning',
    description: 'AI-generated quizzes, study guides, and printable worksheets for kids K-12.',
    url: '/',
  },
};

export default function HomePage() {
  return <LandingClient />;
}
