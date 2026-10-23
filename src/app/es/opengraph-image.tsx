import { OG_SIZE, socialImage } from '@/components/marketing/socialImage';

export const alt = 'QuizKids: quizzes, guías de estudio y hojas de trabajo bilingües para K-12';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return socialImage('es');
}
