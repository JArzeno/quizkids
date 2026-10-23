import type { Locale } from '@/lib/site';

export const ABOUT: Record<Locale, { metaTitle: string; metaDescription: string; eyebrow: string; title: string; lead: string; missionTitle: string; mission: string[]; principlesTitle: string; principles: { icon: string; tone: string; title: string; body: string }[]; forTitle: string; forWho: { title: string; body: string }[]; contactTitle: string; contactBody: string }> = {
  en: {
    metaTitle: 'About QuizKids',
    metaDescription: 'QuizKids helps families turn what kids learn at school into short, friendly study sessions, in English and Spanish. Learn what we believe and who we build for.',
    eyebrow: 'About us',
    title: 'Helping kids review what they learn at school, a little every day',
    lead: 'QuizKids is a study companion for families. It takes the topics a child is learning in class and turns them into quizzes, study guides and worksheets they actually want to open.',
    missionTitle: 'Our mission',
    mission: [
      'Most kids learn something new at school every day, and most of it fades if nobody revisits it at home. Parents want to help, but it is hard to know what to review, how to explain it, or how to make it feel like anything other than more homework.',
      'We build QuizKids so that the review part is easy: add what the class is covering, and your kid gets a short, friendly plan for today. In the language your family speaks, at the level your kid is at.',
    ],
    principlesTitle: 'What we believe',
    principles: [
      { icon: 'book', tone: 'primary', title: 'Follow the school, not an algorithm', body: 'Everything is built from the topics parents add. We never pad the plan with topics the class is not covering.' },
      { icon: 'shuffle', tone: 'honey', title: 'Bilingual by design', body: 'Spanish is not a translation layer. Kids can study each subject in the language they learn it in.' },
      { icon: 'leaf', tone: 'sky', title: 'Calm, not addictive', body: 'Short sessions, light rewards and weekends off. Success is a good habit, not more screen time.' },
      { icon: 'lock', tone: 'coral', title: 'Parents in charge, privacy first', body: 'No ads, no chat and no selling data. Parents decide what kids study and can remove their data at any time.' },
    ],
    forTitle: 'Who QuizKids is for',
    forWho: [
      { title: 'Families', body: 'Parents who want a simple, safe way to help with school, even when the subject is not their strongest.' },
      { title: 'Bilingual homes', body: 'Families who speak Spanish at home while kids learn in English at school, or the other way around.' },
      { title: 'Homeschoolers and tutors', body: 'Anyone who sets their own topics and wants practice material ready in seconds.' },
    ],
    contactTitle: 'Say hello',
    contactBody: 'Questions, ideas or feedback? We read every message.',
  },
  es: {
    metaTitle: 'Sobre QuizKids',
    metaDescription: 'QuizKids ayuda a las familias a convertir lo que los peques aprenden en la escuela en sesiones de estudio cortas y amigables, en español e inglés. Conoce lo que creemos y para quién lo hacemos.',
    eyebrow: 'Nosotros',
    title: 'Ayudamos a los peques a repasar lo que aprenden en la escuela, un poquito cada día',
    lead: 'QuizKids es un compañero de estudio para familias. Toma los temas que tu peque está viendo en clase y los convierte en quizzes, guías de estudio y hojas de trabajo que de verdad quiere abrir.',
    missionTitle: 'Nuestra misión',
    mission: [
      'Casi todos los días los peques aprenden algo nuevo en la escuela, y casi todo se olvida si nadie lo repasa en casa. Las familias quieren ayudar, pero no es fácil saber qué repasar, cómo explicarlo o cómo lograr que no se sienta como más tarea.',
      'Hacemos QuizKids para que repasar sea fácil: agregas lo que está viendo la clase y tu peque recibe un plan cortito y amigable para hoy. En el idioma que habla tu familia, al nivel en que está tu peque.',
    ],
    principlesTitle: 'Lo que creemos',
    principles: [
      { icon: 'book', tone: 'primary', title: 'Seguir a la escuela, no a un algoritmo', body: 'Todo se crea a partir de los temas que agregan las familias. Nunca rellenamos el plan con temas que la clase no está viendo.' },
      { icon: 'shuffle', tone: 'honey', title: 'Bilingüe desde el diseño', body: 'El español no es una traducción de último momento. Cada materia se puede estudiar en el idioma en que la aprenden.' },
      { icon: 'leaf', tone: 'sky', title: 'Tranquilo, no adictivo', body: 'Sesiones cortas, premios ligeros y fines de semana libres. El éxito es un buen hábito, no más tiempo de pantalla.' },
      { icon: 'lock', tone: 'coral', title: 'Las familias mandan y la privacidad va primero', body: 'Sin anuncios, sin chat y sin vender datos. Tú decides qué estudia tu peque y puedes borrar sus datos cuando quieras.' },
    ],
    forTitle: 'Para quién es QuizKids',
    forWho: [
      { title: 'Familias', body: 'Mamás y papás que quieren una forma sencilla y segura de ayudar con la escuela, aunque la materia no sea su fuerte.' },
      { title: 'Hogares bilingües', body: 'Familias que hablan español en casa mientras sus peques aprenden en inglés en la escuela, o al revés.' },
      { title: 'Educación en casa y tutores', body: 'Quien define sus propios temas y quiere material de práctica listo en segundos.' },
    ],
    contactTitle: 'Escríbenos',
    contactBody: '¿Preguntas, ideas o comentarios? Leemos todos los mensajes.',
  },
};
