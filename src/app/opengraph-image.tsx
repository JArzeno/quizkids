import { OG_SIZE, socialImage } from '@/components/marketing/socialImage';

export const alt = 'QuizKids: bilingual quizzes, study guides and worksheets for K-12 kids';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return socialImage('en');
}
