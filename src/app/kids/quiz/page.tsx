import type { Metadata } from 'next';
import QuizClient from './QuizClient';

export const metadata: Metadata = { title: 'Quiz Time!', robots: { index: false } };

export default function QuizPage() { return <QuizClient />; }
