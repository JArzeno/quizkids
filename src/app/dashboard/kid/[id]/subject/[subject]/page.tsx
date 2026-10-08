import type { Metadata } from 'next';
import SubjectClient from './SubjectClient';

export const metadata: Metadata = {
  title: 'Subject',
  description: 'Topics, goals, quizzes and progress for one subject.',
  robots: { index: false },
};

export default function SubjectPage() {
  return <SubjectClient />;
}
