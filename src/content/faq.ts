import type { Locale } from '@/lib/site';

export interface FaqItem { id: string; q: string; a: string }
export interface FaqGroup { title: string; items: FaqItem[] }

/** Questions shown on the homepage, by id */
export const HOME_FAQ_IDS = ['what', 'school', 'languages', 'grades', 'safe', 'price'];

export const FAQ: Record<Locale, { metaTitle: string; metaDescription: string; eyebrow: string; title: string; sub: string; groups: FaqGroup[]; contact: string }> = {
  en: {
    metaTitle: 'Frequently asked questions',
    metaDescription: 'Answers about QuizKids: how it follows what kids learn at school, Google Classroom import, languages, grades, safety, pricing and the free trial.',
    eyebrow: 'FAQ',
    title: 'Questions parents ask',
    sub: "Can't find your answer? Write to us and a real person will reply.",
    contact: 'Still have a question? Email us at',
    groups: [
      {
        title: 'The basics',
        items: [
          { id: 'what', q: 'What is QuizKids?', a: "QuizKids is a study app for kids from Kindergarten to 12th grade. You add the topics your child is learning at school, and QuizKids turns them into flashcard quizzes, friendly study guides and printable worksheets, plus a short daily plan so studying becomes a habit." },
          { id: 'school', q: 'Does it follow what my child learns at school?', a: "Yes, that's the whole idea. QuizKids doesn't invent its own curriculum. Quizzes, guides, goals and daily plans are built only from the topics and classes you add, whether you type them, upload a photo or PDF of class notes, or import them from Google Classroom." },
          { id: 'grades', q: 'Which grades and subjects does it cover?', a: 'Every grade from Kindergarten to 12th, in Math, Language Arts, Science, Social Studies, French and Art. You can also add your own subjects, such as Robotics or Spelling. A short placement quiz finds the right level for each subject.' },
          { id: 'languages', q: 'Which languages are supported?', a: 'The whole app works in English and Spanish, and you can choose the study language for each subject, so a child in a dual-language school can study Science in Spanish and Math in English. French is available as a subject too.' },
          { id: 'devices', q: 'Do we need to install anything?', a: 'No. QuizKids runs in the web browser on phones, tablets and computers. Worksheets print from any printer.' },
        ],
      },
      {
        title: 'Studying with QuizKids',
        items: [
          { id: 'import', q: 'How does the Google Classroom import work?', a: "Connect your child's Google account and pick the classes to import. QuizKids reads courses, assignments and class materials (read-only) and turns them into topics for each subject. It never posts, submits or changes anything in Classroom, and you can disconnect at any time." },
          { id: 'photo', q: 'Can I add topics from a photo of the notebook?', a: 'Yes. Upload up to six photos or PDFs of class notes, worksheets or a study sheet. QuizKids pulls out the topics and key ideas so you can review them before adding them to a subject.' },
          { id: 'plan', q: 'What is the daily plan?', a: 'Once you approve a goal for a subject, QuizKids spreads its topics across the school week. Each weekday your child opens the app to a short list of quizzes, guides and worksheets. Weekends are rest days.' },
          { id: 'tests', q: 'Can it help my child prepare for a test?', a: 'Yes. Add the test date and pick the topics it covers, and QuizKids prepares a focused review. Topics used by earlier tests are flagged, so the next test can cover new ones.' },
          { id: 'progress', q: 'How do I see how my child is doing?', a: 'The parent dashboard shows study time, quiz accuracy, streaks, strengths and the topics that need more practice for every kid. You can copy a weekly summary to share with a teacher or tutor.' },
        ],
      },
      {
        title: 'Safety and privacy',
        items: [
          { id: 'safe', q: 'Is it safe for kids?', a: "There are no ads, no chat and no links to other websites. Kids only see study material. Parent screens are protected by a 4-digit PIN, and kids sign in with their own kid code instead of an email." },
          { id: 'data', q: 'What happens with our data?', a: 'We store only what the app needs to work: your account, your kids\' profiles, the topics you add and their study progress. We never sell personal information or show advertising. Read the privacy policy for the details.' },
          { id: 'ai', q: 'Is the content made with AI?', a: 'Yes. Quizzes, guides and worksheets are written by an AI model, always from the topics you add and at your child\'s grade level. Kids never chat with the AI directly.' },
        ],
      },
      {
        title: 'Plans and billing',
        items: [
          { id: 'price', q: 'How much does QuizKids cost?', a: 'One family plan: $10 per month for your first kid, plus $5 per month for each additional kid. Yearly billing saves 20% ($96 per year, plus $48 per additional kid).' },
          { id: 'trial', q: 'Is there a free trial?', a: 'Yes. Every new account starts with a 14-day free trial, and you don\'t need a card to sign up. You can also browse the demo without creating an account.' },
          { id: 'cancel', q: 'Can I cancel anytime?', a: 'Yes. There are no commitments, and you can cancel or switch between monthly and yearly billing from Settings at any time.' },
        ],
      },
    ],
  },
  es: {
    metaTitle: 'Preguntas frecuentes',
    metaDescription: 'Respuestas sobre QuizKids: cómo sigue lo que tu peque aprende en la escuela, la importación de Google Classroom, idiomas, grados, seguridad, precios y la prueba gratis.',
    eyebrow: 'Preguntas',
    title: 'Lo que preguntan las familias',
    sub: '¿No encuentras tu respuesta? Escríbenos y te contestará una persona de verdad.',
    contact: '¿Te queda alguna duda? Escríbenos a',
    groups: [
      {
        title: 'Lo básico',
        items: [
          { id: 'what', q: '¿Qué es QuizKids?', a: 'QuizKids es una app de estudio para peques de kínder a 12.º grado. Agregas los temas que tu peque está viendo en la escuela y QuizKids los convierte en quizzes con tarjetas, guías de estudio amigables y hojas de trabajo imprimibles, además de un plan diario cortito para que estudiar se vuelva un hábito.' },
          { id: 'school', q: '¿Sigue lo que mi peque ve en la escuela?', a: 'Sí, esa es la idea. QuizKids no se inventa su propio programa. Los quizzes, guías, metas y planes diarios se crean solo a partir de los temas y clases que tú agregas, ya sea escribiéndolos, subiendo una foto o PDF de los apuntes, o importándolos de Google Classroom.' },
          { id: 'grades', q: '¿Qué grados y materias cubre?', a: 'Todos los grados, de kínder a 12.º, en Matemáticas, Lenguaje, Ciencia, Sociales, Francés y Arte. También puedes agregar tus propias materias, como Robótica u Ortografía. Un quiz de nivelación cortito encuentra el nivel adecuado en cada materia.' },
          { id: 'languages', q: '¿En qué idiomas funciona?', a: 'Toda la app funciona en español e inglés, y puedes elegir el idioma de estudio de cada materia: un peque en una escuela bilingüe puede estudiar Ciencia en español y Matemáticas en inglés. El francés también está disponible como materia.' },
          { id: 'devices', q: '¿Hay que instalar algo?', a: 'No. QuizKids funciona en el navegador de celulares, tabletas y computadoras. Las hojas de trabajo se imprimen en cualquier impresora.' },
        ],
      },
      {
        title: 'Estudiar con QuizKids',
        items: [
          { id: 'import', q: '¿Cómo funciona la importación de Google Classroom?', a: 'Conecta la cuenta de Google de tu peque y elige las clases que quieres importar. QuizKids lee los cursos, tareas y materiales (solo lectura) y los convierte en temas para cada materia. Nunca publica, entrega ni cambia nada en Classroom, y puedes desconectarlo cuando quieras.' },
          { id: 'photo', q: '¿Puedo agregar temas desde una foto del cuaderno?', a: 'Sí. Sube hasta seis fotos o PDF de apuntes, tareas o una guía de estudio. QuizKids saca los temas y las ideas clave para que los revises antes de agregarlos a una materia.' },
          { id: 'plan', q: '¿Qué es el plan diario?', a: 'Cuando apruebas una meta para una materia, QuizKids reparte sus temas durante la semana escolar. Cada día de lunes a viernes tu peque abre la app y encuentra una lista cortita de quizzes, guías y hojas de trabajo. Los fines de semana son para descansar.' },
          { id: 'tests', q: '¿Me ayuda a preparar un examen?', a: 'Sí. Agrega la fecha del examen y elige los temas que entran, y QuizKids prepara un repaso enfocado. Los temas usados en exámenes anteriores quedan marcados para que el siguiente cubra temas nuevos.' },
          { id: 'progress', q: '¿Cómo veo cómo le va a mi peque?', a: 'El panel para padres muestra el tiempo de estudio, los aciertos, las rachas, las fortalezas y los temas que necesitan más práctica de cada peque. Puedes copiar un resumen semanal para compartirlo con su maestra o tutor.' },
        ],
      },
      {
        title: 'Seguridad y privacidad',
        items: [
          { id: 'safe', q: '¿Es seguro para niños?', a: 'No hay anuncios, ni chat, ni enlaces a otros sitios. Tu peque solo ve material de estudio. Las pantallas de adultos están protegidas con un PIN de 4 dígitos, y tu peque entra con su propio código en lugar de un correo.' },
          { id: 'data', q: '¿Qué pasa con nuestros datos?', a: 'Solo guardamos lo que la app necesita para funcionar: tu cuenta, los perfiles de tus peques, los temas que agregas y su progreso. Nunca vendemos información personal ni mostramos publicidad. Lee la política de privacidad para más detalles.' },
          { id: 'ai', q: '¿El contenido se hace con IA?', a: 'Sí. Los quizzes, guías y hojas de trabajo los escribe un modelo de IA, siempre a partir de los temas que tú agregas y al nivel de grado de tu peque. Tu peque nunca conversa directamente con la IA.' },
        ],
      },
      {
        title: 'Planes y pagos',
        items: [
          { id: 'price', q: '¿Cuánto cuesta QuizKids?', a: 'Un solo plan familiar: $10 al mes por tu primer peque, más $5 al mes por cada peque adicional. El pago anual ahorra 20% ($96 al año, más $48 por cada peque adicional).' },
          { id: 'trial', q: '¿Hay prueba gratis?', a: 'Sí. Toda cuenta nueva empieza con 14 días gratis, y no necesitas tarjeta para registrarte. También puedes explorar el demo sin crear una cuenta.' },
          { id: 'cancel', q: '¿Puedo cancelar cuando quiera?', a: 'Sí. No hay compromisos, y puedes cancelar o cambiar entre pago mensual y anual desde Configuración cuando quieras.' },
        ],
      },
    ],
  },
};

export function faqItems(locale: Locale, ids?: string[]): FaqItem[] {
  const all = FAQ[locale].groups.flatMap((g) => g.items);
  return ids ? ids.map((id) => all.find((i) => i.id === id)).filter((i): i is FaqItem => !!i) : all;
}
