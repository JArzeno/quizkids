import type { Locale } from '@/lib/site';

/** Visual next to a feature: a product screenshot or one of the illustrated mockups in components/marketing/Mockups */
export type FeatureVisual = 'shot:quiz' | 'shot:guide' | 'shot:worksheet' | 'shot:dashboard' | 'shot:kidhome' | 'mock:school' | 'mock:plan' | 'mock:placement' | 'mock:test';

export interface FeatureRow { id: string; eyebrow: string; title: string; body: string; bullets: string[]; visual: FeatureVisual; alt: string }
export interface FeatureTile { icon: string; tone: string; title: string; body: string }

export const FEATURES: Record<Locale, { metaTitle: string; metaDescription: string; eyebrow: string; title: string; sub: string; jump: string; rows: FeatureRow[]; moreTitle: string; more: FeatureTile[] }> = {
  en: {
    metaTitle: 'Features: quizzes, study guides, worksheets and daily plans',
    metaDescription: 'Everything QuizKids does: flashcard quizzes, study guides, printable worksheets, placement quizzes, goals and daily plans, test prep, Google Classroom import and progress for parents.',
    eyebrow: 'Features',
    title: 'Everything your kid needs to study what they learn at school',
    sub: 'One topic from class becomes a quiz, a study guide and a worksheet. Goals, a daily plan and test prep turn it into a habit, and you see how it is going.',
    jump: 'Jump to',
    rows: [
      {
        id: 'quizzes', eyebrow: 'Flashcard quizzes', title: 'Quizzes that feel like a game, not a test',
        body: 'Kids tap to flip each card, get instant feedback and a gentle hint when they need one. At the end there is a sticker and a quick review of every answer.',
        bullets: ['Questions match their grade and placement level', "'More questions' brings fresh cards on the same topic, never repeats", 'Results feed their strengths and the topics that need practice'],
        visual: 'shot:quiz', alt: 'A QuizKids flashcard quiz question with four answer choices',
      },
      {
        id: 'study-guides', eyebrow: 'Study guides', title: 'Friendly guides that explain, not just test',
        body: 'Each guide breaks a topic into short sections with key ideas, examples, words to know and a quick recap. A "did you know?" fact makes it stick.',
        bullets: ["'Tell me more' adds a new section on any idea they are curious about", 'Listen mode reads the guide aloud', 'Print it, or keep it on screen with a table of contents'],
        visual: 'shot:guide', alt: 'A QuizKids study guide about magnets with sections and key ideas',
      },
      {
        id: 'worksheets', eyebrow: 'Printable worksheets', title: 'Worksheets worth printing',
        body: 'Clean, printer-friendly worksheets with name and date lines, built from the same topic as the quiz and the guide.',
        bullets: ['True or false, multiple choice, fill in the blank, matching and explain-your-thinking sections', 'Choose which sections to include before printing', 'Great for the fridge, the backpack or a quiet table at a restaurant'],
        visual: 'shot:worksheet', alt: 'A printable QuizKids worksheet about magnets with several question types',
      },
      {
        id: 'school-import', eyebrow: 'Follows their school', title: 'Bring in what the teacher is teaching',
        body: 'QuizKids builds everything from the topics you add, so studying at home matches the classroom. Adding them takes seconds.',
        bullets: ['Type topics, or paste them from a class newsletter', 'Upload up to six photos or PDFs of notes and worksheets, and the topics are pulled out for you', 'Import courses, assignments and materials from Google Classroom, read-only'],
        visual: 'mock:school', alt: 'Illustration of classes imported from Google Classroom with their topics',
      },
      {
        id: 'placement', eyebrow: 'Placement', title: 'Starts at the right level',
        body: "A nine-question placement quiz, from a little easier to a little harder, finds where your kid is in each subject. It's not a grade, just a starting point.",
        bullets: ['A level for every subject, not just their school grade', 'Shows what they are strong at and what needs practice', 'Retake it anytime as they grow'],
        visual: 'mock:placement', alt: 'Illustration of a placement result showing a working level, strengths and topics to practice',
      },
      {
        id: 'goals-and-plan', eyebrow: 'Goals & daily plan', title: 'A goal for each subject and a plan for each day',
        body: 'Approve a goal built from your topics and QuizKids spreads it across the school week. Your kid opens the app to a short, clear plan every weekday.',
        bullets: ['Plans are handed out Monday to Friday, weekends are rest days', 'Quizzes on the goal topics move the progress bar', 'A final test checks the goal, and missed topics come back as extra practice'],
        visual: 'mock:plan', alt: "Illustration of today's study plan with a quiz, a guide and a worksheet",
      },
      {
        id: 'test-prep', eyebrow: 'Test prep', title: 'Ready for test day',
        body: 'Add an upcoming test, pick the topics it covers and QuizKids prepares a focused review: a guide and a quiz that cover all of them together.',
        bullets: ['Set the test date so the review lands at the right time', 'Topics used by earlier tests are flagged, so the next one covers new ground', 'Works for spelling tests, unit tests and finals alike'],
        visual: 'mock:test', alt: 'Illustration of a test prep card with a date and selected topics',
      },
      {
        id: 'progress', eyebrow: 'Progress for parents', title: "Know what's working",
        body: 'The parent dashboard shows every kid at a glance, and each kid has a detailed progress page.',
        bullets: ['Study time for the last 14 days and a weekly study goal', 'Accuracy by subject, strengths and topics that need practice', 'A weekly summary you can copy and share with a teacher or tutor'],
        visual: 'shot:dashboard', alt: 'QuizKids progress page for a kid with study time, accuracy and streak',
      },
      {
        id: 'kid-space', eyebrow: 'Their own space', title: 'A home screen made for kids',
        body: "Kids get a calm space of their own with today's plan, their subjects and what they were working on last.",
        bullets: ['Stars, streaks and stickers reward effort', 'A study timer runs while they work and pauses when they step away', 'Kids sign in with a kid code, and leaving needs your PIN'],
        visual: 'shot:kidhome', alt: "A kid's QuizKids home screen with today's plan and recent studies",
      },
    ],
    moreTitle: 'And the little things that make it work',
    more: [
      { icon: 'shuffle', tone: 'honey', title: 'English and Spanish', body: 'The whole app works in both languages, and each subject can be studied in English, Spanish or French.' },
      { icon: 'plus', tone: 'primary', title: 'Your own subjects', body: 'Add subjects like Robotics, Coding or Spelling with their own icon and color.' },
      { icon: 'lock', tone: 'sky', title: 'Parent PIN', body: 'Settings and parent screens stay behind a 4-digit PIN, so little hands can’t change things.' },
      { icon: 'leaf', tone: 'primary', title: 'No ads, no chat', body: 'Kids only see study material. No messaging, no links out, no advertising.' },
      { icon: 'users', tone: 'berry', title: 'Multiple kids', body: 'One family account for all your kids, each with their own level, plan and progress.' },
      { icon: 'device', tone: 'coral', title: 'Any device', body: 'Runs in the browser on phones, tablets and computers. Nothing to install.' },
    ],
  },
  es: {
    metaTitle: 'Funciones: quizzes, guías de estudio, hojas de trabajo y planes diarios',
    metaDescription: 'Todo lo que hace QuizKids: quizzes con tarjetas, guías de estudio, hojas de trabajo imprimibles, quiz de nivelación, metas y plan diario, preparación de exámenes, importación de Google Classroom y progreso para padres.',
    eyebrow: 'Funciones',
    title: 'Todo lo que tu peque necesita para repasar lo que ve en la escuela',
    sub: 'Un tema de clase se convierte en quiz, guía de estudio y hoja de trabajo. Las metas, el plan diario y la preparación de exámenes lo vuelven hábito, y tú ves cómo va.',
    jump: 'Ir a',
    rows: [
      {
        id: 'quizzes', eyebrow: 'Quizzes con tarjetas', title: 'Quizzes que se sienten como juego, no como examen',
        body: 'Tu peque voltea cada tarjeta con un toque, sabe al instante si acertó y recibe una pista amable cuando la necesita. Al final hay una estampita y un repaso de cada respuesta.',
        bullets: ['Las preguntas van con su grado y su nivel', "'Más preguntas' trae tarjetas nuevas del mismo tema, sin repetir", 'Los resultados alimentan sus fortalezas y los temas por practicar'],
        visual: 'shot:quiz', alt: 'Pregunta de un quiz de QuizKids con cuatro opciones de respuesta',
      },
      {
        id: 'study-guides', eyebrow: 'Guías de estudio', title: 'Guías amigables que explican, no solo evalúan',
        body: 'Cada guía divide el tema en secciones cortas con ideas clave, ejemplos, palabras para aprender y un repaso rápido. Un dato de "¿Sabías que…?" ayuda a recordarlo.',
        bullets: ["'Cuéntame más' agrega una sección nueva sobre lo que le dé curiosidad", 'El modo escuchar lee la guía en voz alta', 'Imprímela o léela en pantalla con su índice'],
        visual: 'shot:guide', alt: 'Guía de estudio de QuizKids sobre imanes con secciones e ideas clave',
      },
      {
        id: 'worksheets', eyebrow: 'Hojas de trabajo', title: 'Hojas de trabajo que vale la pena imprimir',
        body: 'Hojas limpias y fáciles de imprimir, con líneas para nombre y fecha, creadas a partir del mismo tema que el quiz y la guía.',
        bullets: ['Verdadero o falso, opción múltiple, completar, unir con líneas y explicar su respuesta', 'Elige qué secciones incluir antes de imprimir', 'Perfectas para la mochila, la nevera o una mesa tranquila en un restaurante'],
        visual: 'shot:worksheet', alt: 'Hoja de trabajo imprimible de QuizKids sobre imanes con varios tipos de preguntas',
      },
      {
        id: 'school-import', eyebrow: 'Sigue a su escuela', title: 'Trae lo que enseña la maestra',
        body: 'QuizKids crea todo a partir de los temas que agregas, así lo que estudian en casa coincide con el salón. Agregarlos toma segundos.',
        bullets: ['Escribe los temas o pégalos del boletín de la clase', 'Sube hasta seis fotos o PDF de apuntes y tareas, y sacamos los temas por ti', 'Importa cursos, tareas y materiales de Google Classroom, solo lectura'],
        visual: 'mock:school', alt: 'Ilustración de clases importadas de Google Classroom con sus temas',
      },
      {
        id: 'placement', eyebrow: 'Nivelación', title: 'Empieza en el nivel correcto',
        body: 'Un quiz de nivelación de nueve preguntas, de un poco más fácil a un poco más difícil, encuentra dónde está tu peque en cada materia. No es una nota, solo un punto de partida.',
        bullets: ['Un nivel para cada materia, no solo su grado escolar', 'Muestra en qué es fuerte y qué necesita práctica', 'Repítelo cuando quieras a medida que crece'],
        visual: 'mock:placement', alt: 'Ilustración de un resultado de nivelación con su nivel, fortalezas y temas por practicar',
      },
      {
        id: 'goals-and-plan', eyebrow: 'Metas y plan diario', title: 'Una meta por materia y un plan para cada día',
        body: 'Aprueba una meta creada a partir de tus temas y QuizKids la reparte durante la semana escolar. Cada día de escuela tu peque abre la app y encuentra un plan cortito y claro.',
        bullets: ['Los planes se entregan de lunes a viernes, el fin de semana es para descansar', 'Los quizzes de los temas de la meta mueven la barra de progreso', 'Una prueba final revisa la meta, y los temas fallados vuelven como práctica extra'],
        visual: 'mock:plan', alt: 'Ilustración del plan de estudio de hoy con un quiz, una guía y una hoja de trabajo',
      },
      {
        id: 'test-prep', eyebrow: 'Exámenes', title: 'Listos para el día del examen',
        body: 'Agrega un examen próximo, elige los temas que entran y QuizKids prepara un repaso enfocado: una guía y un quiz que cubren todos esos temas juntos.',
        bullets: ['Pon la fecha del examen para que el repaso llegue a tiempo', 'Los temas de exámenes anteriores quedan marcados, para que el siguiente cubra temas nuevos', 'Sirve para dictados, exámenes de unidad y finales'],
        visual: 'mock:test', alt: 'Ilustración de una tarjeta de preparación de examen con fecha y temas elegidos',
      },
      {
        id: 'progress', eyebrow: 'Progreso para padres', title: 'Sabe qué está funcionando',
        body: 'El panel para padres muestra a todos tus peques de un vistazo, y cada peque tiene una página de progreso detallada.',
        bullets: ['Tiempo de estudio de los últimos 14 días y una meta semanal', 'Aciertos por materia, fortalezas y temas que necesitan práctica', 'Un resumen semanal que puedes copiar y compartir con su maestra o tutor'],
        visual: 'shot:dashboard', alt: 'Página de progreso de QuizKids con tiempo de estudio, aciertos y racha',
      },
      {
        id: 'kid-space', eyebrow: 'Su propio espacio', title: 'Una pantalla de inicio hecha para peques',
        body: 'Tu peque tiene un espacio tranquilo solo para él o ella, con el plan de hoy, sus materias y lo último que estaba estudiando.',
        bullets: ['Estrellas, rachas y estampitas premian el esfuerzo', 'Un cronómetro corre mientras estudia y se pausa cuando se aleja', 'Entra con su código de peque, y para salir hace falta tu PIN'],
        visual: 'shot:kidhome', alt: 'Pantalla de inicio de un peque en QuizKids con el plan de hoy y estudios recientes',
      },
    ],
    moreTitle: 'Y los detallitos que hacen la diferencia',
    more: [
      { icon: 'shuffle', tone: 'honey', title: 'Español e inglés', body: 'Toda la app funciona en los dos idiomas, y cada materia se puede estudiar en español, inglés o francés.' },
      { icon: 'plus', tone: 'primary', title: 'Tus propias materias', body: 'Agrega materias como Robótica, Programación u Ortografía con su propio ícono y color.' },
      { icon: 'lock', tone: 'sky', title: 'PIN para adultos', body: 'La configuración y las pantallas de adultos están protegidas con un PIN de 4 dígitos.' },
      { icon: 'leaf', tone: 'primary', title: 'Sin anuncios ni chat', body: 'Tu peque solo ve material de estudio. Sin mensajes, sin enlaces a otros sitios, sin publicidad.' },
      { icon: 'users', tone: 'berry', title: 'Varios peques', body: 'Una sola cuenta familiar para todos tus peques, cada uno con su nivel, su plan y su progreso.' },
      { icon: 'device', tone: 'coral', title: 'Cualquier equipo', body: 'Funciona en el navegador de celulares, tabletas y computadoras. Nada que instalar.' },
    ],
  },
};
