import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://quizkids.app'),
  title: {
    default: 'QuizKids — Bilingual K-12 Study Tool for Kids',
    template: '%s | QuizKids',
  },
  description: 'AI-generated quizzes, study guides, and printable worksheets for kids K-12. Bilingual English & Spanish. No ads, no chat — just learning.',
  keywords: ['kids learning', 'quiz for kids', 'K-12 education', 'bilingual learning', 'study guide kids', 'flashcards kids', 'homeschool'],
  authors: [{ name: 'QuizKids' }],
  creator: 'QuizKids',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'es_ES',
    title: 'QuizKids — A cozy place for kids to love learning',
    description: 'AI-generated quizzes, study guides, and printable worksheets for kids K-12. Bilingual English & Spanish.',
    siteName: 'QuizKids',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'QuizKids — Bilingual learning for kids' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuizKids — Bilingual K-12 Study Tool',
    description: 'AI-generated quizzes, study guides, and printable worksheets for kids K-12.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3F7A4F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'QuizKids',
              description: 'AI-generated quizzes, study guides, and printable worksheets for kids K-12.',
              applicationCategory: 'EducationApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
              },
              audience: {
                '@type': 'EducationalAudience',
                educationalRole: 'student',
              },
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
