import type { Locale } from '@/lib/site';

export interface HowStep { title: string; body: string; bullets: string[]; time: string }

export const HOW: Record<Locale, { metaTitle: string; metaDescription: string; eyebrow: string; title: string; sub: string; parentLabel: string; kidLabel: string; parentSteps: HowStep[]; kidSteps: HowStep[]; dayTitle: string; daySub: string; day: { time: string; text: string }[] }> = {
  en: {
    metaTitle: 'How it works',
    metaDescription: 'How QuizKids works for parents and kids: create a free account, add your kid and their school topics, approve a goal, and your kid gets a short study plan every school day.',
    eyebrow: 'How it works',
    title: 'From school topics to a study habit',
    sub: 'Parents set things up in a few minutes. After that, kids open the app to a short plan every school day, and you can see how it is going.',
    parentLabel: 'For parents',
    kidLabel: 'For kids',
    parentSteps: [
      { title: 'Create your free account', time: '1 min', body: 'Sign up with your email. Every account starts with a 14-day free trial, no card needed.', bullets: ['Tell us who you are and the languages spoken at home', 'Set a weekly study goal and a parent PIN'] },
      { title: 'Add your kid', time: '1 min', body: 'Add their name, grade, favorite color and an avatar. They draw their signature, so they know it is their space.', bullets: ['Add as many kids as you need, each with their own profile', 'Each kid gets a kid code to sign in on their own'] },
      { title: 'Pick their subjects', time: '2 min', body: 'Choose the subjects they study and the language for each one. A short placement quiz finds their level in every subject.', bullets: ['Math, Language Arts, Science, Social Studies, French and Art', 'Add your own subjects with a custom icon and color'] },
      { title: 'Add what they are learning at school', time: '2 min', body: 'Type the topics from class, upload photos or PDFs of their notes, or import classes from Google Classroom.', bullets: ['Topics are pulled out of photos and PDFs for you to review', 'Google Classroom is read-only and can be disconnected anytime'] },
      { title: 'Approve a goal', time: '30 sec', body: 'QuizKids proposes a goal for each subject using only your topics. Approve it, edit it, or write your own.', bullets: ['Tap the topics in the order you want them studied', 'Add upcoming tests for a focused review'] },
    ],
    kidSteps: [
      { title: 'Open their space', time: '', body: 'Kids sign in with their kid code, or you hand over the device from your account. Leaving their space needs your PIN.', bullets: [] },
      { title: "Follow today's plan", time: '', body: 'A short list of quizzes, study guides and worksheets is waiting every weekday, matched to their level.', bullets: [] },
      { title: 'Earn stars and keep the streak', time: '', body: 'Stars, stickers and streaks reward effort. The study timer keeps track of real study minutes.', bullets: [] },
    ],
    dayTitle: 'A typical school day',
    daySub: 'About 20 to 30 minutes, split however works for your family.',
    day: [
      { time: '3:30 pm', text: 'Snack, then Mateo opens QuizKids. Today’s plan has three items on Magnets, the topic his class started this week.' },
      { time: '3:40 pm', text: 'He reads the study guide and taps “Tell me more” about compasses.' },
      { time: '3:50 pm', text: 'Flashcard quiz: 7 of 8 right, a sticker and 5 stars. His streak reaches 7 days.' },
      { time: '7:00 pm', text: 'You check the dashboard: Magnets is now a strength, and the goal is 3 of 5 topics in.' },
    ],
  },
  es: {
    metaTitle: 'Cómo funciona',
    metaDescription: 'Cómo funciona QuizKids para padres y peques: crea una cuenta gratis, agrega a tu peque y sus temas de la escuela, aprueba una meta y tu peque recibe un plan de estudio cortito cada día de escuela.',
    eyebrow: 'Cómo funciona',
    title: 'De los temas de la escuela a un hábito de estudio',
    sub: 'Los adultos lo configuran en pocos minutos. Después, tu peque abre la app y encuentra un plan cortito cada día de escuela, y tú puedes ver cómo va.',
    parentLabel: 'Para adultos',
    kidLabel: 'Para peques',
    parentSteps: [
      { title: 'Crea tu cuenta gratis', time: '1 min', body: 'Regístrate con tu correo. Toda cuenta empieza con 14 días gratis, sin tarjeta.', bullets: ['Cuéntanos quién eres y qué idiomas se hablan en casa', 'Define una meta semanal de estudio y un PIN para adultos'] },
      { title: 'Agrega a tu peque', time: '1 min', body: 'Agrega su nombre, grado, color favorito y un avatar. Dibuja su firma para saber que ese es su espacio.', bullets: ['Agrega todos los peques que necesites, cada uno con su perfil', 'Cada peque recibe un código para entrar por su cuenta'] },
      { title: 'Elige sus materias', time: '2 min', body: 'Elige las materias que estudia y el idioma de cada una. Un quiz de nivelación cortito encuentra su nivel en cada materia.', bullets: ['Matemáticas, Lenguaje, Ciencia, Sociales, Francés y Arte', 'Agrega tus propias materias con ícono y color'] },
      { title: 'Agrega lo que ve en la escuela', time: '2 min', body: 'Escribe los temas de clase, sube fotos o PDF de sus apuntes, o importa sus clases de Google Classroom.', bullets: ['Sacamos los temas de las fotos y PDF para que los revises', 'Google Classroom es solo lectura y se puede desconectar cuando quieras'] },
      { title: 'Aprueba una meta', time: '30 s', body: 'QuizKids propone una meta para cada materia usando solo tus temas. Apruébala, edítala o escribe la tuya.', bullets: ['Toca los temas en el orden en que quieres que los estudie', 'Agrega los exámenes que vienen para un repaso enfocado'] },
    ],
    kidSteps: [
      { title: 'Entra a su espacio', time: '', body: 'Tu peque entra con su código, o le pasas el equipo desde tu cuenta. Para salir de su espacio hace falta tu PIN.', bullets: [] },
      { title: 'Sigue el plan de hoy', time: '', body: 'Cada día de escuela le espera una lista cortita de quizzes, guías y hojas de trabajo a su nivel.', bullets: [] },
      { title: 'Gana estrellas y cuida su racha', time: '', body: 'Las estrellas, estampitas y rachas premian el esfuerzo. El cronómetro cuenta los minutos reales de estudio.', bullets: [] },
    ],
    dayTitle: 'Un día de escuela típico',
    daySub: 'Unos 20 a 30 minutos, repartidos como le funcione a tu familia.',
    day: [
      { time: '3:30 pm', text: 'Merienda, y Mateo abre QuizKids. El plan de hoy tiene tres actividades sobre Imanes, el tema que su clase empezó esta semana.' },
      { time: '3:40 pm', text: 'Lee la guía de estudio y toca “Cuéntame más” sobre las brújulas.' },
      { time: '3:50 pm', text: 'Quiz con tarjetas: 7 de 8 correctas, una estampita y 5 estrellas. Su racha llega a 7 días.' },
      { time: '7:00 pm', text: 'Revisas el panel: Imanes ya es una fortaleza, y la meta va en 3 de 5 temas.' },
    ],
  },
};
