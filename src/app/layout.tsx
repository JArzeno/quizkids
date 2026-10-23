import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SITE_URL } from '@/lib/site';

// Social images and the apple touch icon come from opengraph-image.tsx and apple-icon.tsx next to this file
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'QuizKids — Bilingual K-12 Study Tool for Kids',
    template: '%s | QuizKids',
  },
  description: 'AI-generated quizzes, study guides, and printable worksheets for kids K-12, built from what they learn at school. Bilingual English & Spanish. No ads, no chat — just learning.',
  keywords: ['kids learning', 'quiz for kids', 'K-12 education', 'bilingual learning', 'study guide kids', 'flashcards kids', 'printable worksheets', 'google classroom', 'homeschool'],
  authors: [{ name: 'QuizKids' }],
  creator: 'QuizKids',
  applicationName: 'QuizKids',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'es_LA',
    title: 'QuizKids — A cozy place for kids to love learning',
    description: 'AI-generated quizzes, study guides, and printable worksheets for kids K-12. Bilingual English & Spanish.',
    siteName: 'QuizKids',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuizKids — Bilingual K-12 Study Tool',
    description: 'AI-generated quizzes, study guides, and printable worksheets for kids K-12.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3F7A4F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Spanish marketing pages switch lang to "es" before hydration (see components/marketing/MarketingShell)
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
