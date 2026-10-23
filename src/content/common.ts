import type { Locale } from '@/lib/site';

/** Copy shared by every marketing page: header, footer and the closing call to action */
export const COMMON = {
  en: {
    nav: { features: 'Features', how: 'How it works', pricing: 'Pricing', faq: 'FAQ' },
    menu: 'Menu',
    signIn: 'Sign in',
    startTrial: 'Start free trial',
    dashboard: 'Go to dashboard',
    seeDemo: 'See a demo',
    trialNote: '14-day free trial · No card needed · Cancel anytime',
    home: 'Home',
    footer: {
      tagline: 'A cozy place for kids to study what they learn at school. Bilingual, K-12, no ads.',
      product: 'Product',
      company: 'Company',
      legal: 'Legal',
      subjects: 'Subjects & grades',
      about: 'About us',
      contact: 'Contact',
      privacy: 'Privacy policy',
      terms: 'Terms of service',
      language: 'Language',
      copy: `© ${new Date().getFullYear()} QuizKids. Made with care for curious kids.`,
    },
    cta: {
      badge: '14-day free trial',
      title: 'Ready to make studying feel a little cozier?',
      body: 'Set up your first kid in about a minute. Add what they are learning at school, and their first quiz is ready right away.',
      primary: 'Start free trial',
      secondary: 'Browse the demo',
    },
  },
  es: {
    nav: { features: 'Funciones', how: 'Cómo funciona', pricing: 'Precios', faq: 'Preguntas' },
    menu: 'Menú',
    signIn: 'Iniciar sesión',
    startTrial: 'Prueba gratis',
    dashboard: 'Ir a mi panel',
    seeDemo: 'Ver un demo',
    trialNote: '14 días gratis · Sin tarjeta · Cancela cuando quieras',
    home: 'Inicio',
    footer: {
      tagline: 'Un rinconcito amigable para estudiar lo que ven en la escuela. Bilingüe, de kínder a 12.º, sin anuncios.',
      product: 'Producto',
      company: 'Empresa',
      legal: 'Legal',
      subjects: 'Materias y grados',
      about: 'Nosotros',
      contact: 'Contacto',
      privacy: 'Política de privacidad',
      terms: 'Términos del servicio',
      language: 'Idioma',
      copy: `© ${new Date().getFullYear()} QuizKids. Hecho con cariño para peques curiosos.`,
    },
    cta: {
      badge: '14 días gratis',
      title: '¿Listos para que estudiar se sienta más acogedor?',
      body: 'Crea el perfil de tu peque en un minuto. Agrega lo que está viendo en la escuela y su primer quiz queda listo al instante.',
      primary: 'Empezar prueba gratis',
      secondary: 'Explorar el demo',
    },
  },
} satisfies Record<Locale, unknown>;

export type CommonCopy = (typeof COMMON)['en'];
