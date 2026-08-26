import type { Lang } from '@/types';

export interface SubjectMeta {
  id: string;
  tone: string;
  icon: string;
  en: string;
  es: string;
}

/** Built-in subjects. Custom subjects (store.customSubjects) are appended at render time. */
export const SUBJECTS: SubjectMeta[] = [
  { id: 'sci',  tone: 'primary', icon: '🔬', en: 'Science',        es: 'Ciencias' },
  { id: 'math', tone: 'sky',     icon: '➗', en: 'Math',           es: 'Matemáticas' },
  { id: 'lang', tone: 'berry',   icon: '📖', en: 'Language Arts',  es: 'Lengua' },
  { id: 'soc',  tone: 'honey',   icon: '🌎', en: 'Social Studies', es: 'Estudios Sociales' },
  { id: 'art',  tone: 'coral',   icon: '🎨', en: 'Art',            es: 'Arte' },
];

export function subjectMeta(id: string, custom?: Array<{ id: string; name: string; icon: string; color: string }>): SubjectMeta {
  const built = SUBJECTS.find((s) => s.id === id);
  if (built) return built;
  const c = (custom || []).find((s) => s.id === id);
  if (c) return { id: c.id, tone: 'primary', icon: c.icon || '📚', en: c.name, es: c.name };
  return { id, tone: 'primary', icon: '📚', en: id, es: id };
}

export function subjectLabel(id: string, lang: Lang, custom?: Array<{ id: string; name: string; icon: string; color: string }>): string {
  const m = subjectMeta(id, custom);
  return lang === 'es' ? m.es : m.en;
}

/**
 * Topic library. Every subject carries its own list so the picker (and the kid's
 * suggestions) stay dynamic per subject instead of falling back to Science.
 * Bands: 'early' = K–2, 'mid' = 3–5, 'upper' = 6–12. A subject's full list is
 * every band, ordered early → upper, so a picker without a grade still shows all.
 */
type Band = 'early' | 'mid' | 'upper';

const TOPIC_LIBRARY: Record<string, Record<Band, { en: string[]; es: string[] }>> = {
  sci: {
    early: {
      en: ['Animals & Habitats', 'Weather & Seasons', 'Plants & How They Grow', 'Day & Night', 'Five Senses'],
      es: ['Animales y hábitats', 'Clima y estaciones', 'Las plantas y cómo crecen', 'Día y noche', 'Los cinco sentidos'],
    },
    mid: {
      en: ['Solar System & Planets', 'States of Matter', 'The Water Cycle', 'Plants & Photosynthesis', 'Human Body Basics', 'Forces & Motion', 'Rocks & Minerals', 'Food Chains & Ecosystems'],
      es: ['Sistema solar y planetas', 'Estados de la materia', 'Ciclo del agua', 'Plantas y fotosíntesis', 'El cuerpo humano', 'Fuerzas y movimiento', 'Rocas y minerales', 'Cadenas alimenticias y ecosistemas'],
    },
    upper: {
      en: ['Cells & Microscopes', 'Simple Chemical Reactions', 'Energy & Electricity', 'Genetics & Heredity', 'Climate & Carbon Cycle', 'Waves, Light & Sound'],
      es: ['Células y microscopios', 'Reacciones químicas simples', 'Energía y electricidad', 'Genética y herencia', 'Clima y ciclo del carbono', 'Ondas, luz y sonido'],
    },
  },
  math: {
    early: {
      en: ['Counting to 100', 'Shapes & Patterns', 'Adding & Subtracting to 20', 'Telling Time', 'Coins & Money'],
      es: ['Contar hasta 100', 'Figuras y patrones', 'Sumar y restar hasta 20', 'La hora', 'Monedas y dinero'],
    },
    mid: {
      en: ['Multiplication Facts', 'Division Basics', 'Fractions & Equal Parts', 'Place Value & Rounding', 'Perimeter & Area', 'Measurement & Units', 'Word Problems', 'Bar Graphs & Data'],
      es: ['Tablas de multiplicar', 'División básica', 'Fracciones y partes iguales', 'Valor posicional y redondeo', 'Perímetro y área', 'Medición y unidades', 'Problemas de palabras', 'Gráficas de barras y datos'],
    },
    upper: {
      en: ['Ratios & Proportions', 'Integers & Number Lines', 'Percentages & Discounts', 'Pre-Algebra Equations', 'Coordinate Plane & Graphs', 'Volume & Surface Area', 'Probability & Statistics'],
      es: ['Razones y proporciones', 'Números enteros y recta numérica', 'Porcentajes y descuentos', 'Ecuaciones de pre-álgebra', 'Plano cartesiano y gráficas', 'Volumen y área de superficie', 'Probabilidad y estadística'],
    },
  },
  lang: {
    early: {
      en: ['Letter Sounds & Phonics', 'Sight Words', 'Rhyming Words', 'Story Beginning, Middle & End', 'Capital Letters & Periods'],
      es: ['Sonidos de las letras', 'Palabras de uso frecuente', 'Palabras que riman', 'Inicio, medio y final del cuento', 'Mayúsculas y puntos'],
    },
    mid: {
      en: ['Nouns, Verbs & Adjectives', 'Main Idea & Details', 'Synonyms & Antonyms', 'Writing a Paragraph', 'Prefixes & Suffixes', 'Story Characters & Setting', 'Punctuation & Quotation Marks', 'Fact vs. Opinion'],
      es: ['Sustantivos, verbos y adjetivos', 'Idea principal y detalles', 'Sinónimos y antónimos', 'Escribir un párrafo', 'Prefijos y sufijos', 'Personajes y ambiente', 'Puntuación y comillas', 'Hecho u opinión'],
    },
    upper: {
      en: ['Theme & Author’s Purpose', 'Figurative Language', 'Essay Structure & Thesis', 'Citing Text Evidence', 'Poetry & Meter', 'Context Clues & Vocabulary'],
      es: ['Tema y propósito del autor', 'Lenguaje figurado', 'Estructura del ensayo y tesis', 'Citar evidencia del texto', 'Poesía y métrica', 'Pistas de contexto y vocabulario'],
    },
  },
  soc: {
    early: {
      en: ['My Family & Community', 'Maps & Directions', 'Jobs People Do', 'Holidays & Traditions', 'Rules & Being Fair'],
      es: ['Mi familia y comunidad', 'Mapas y direcciones', 'Los oficios', 'Días festivos y tradiciones', 'Reglas y justicia'],
    },
    mid: {
      en: ['Continents & Oceans', 'Native American Nations', 'Explorers & Early America', 'Branches of Government', 'States & Capitals', 'Landforms & Regions', 'Timelines & History Basics'],
      es: ['Continentes y océanos', 'Pueblos indígenas de América', 'Exploradores y la América temprana', 'Ramas del gobierno', 'Estados y capitales', 'Relieves y regiones', 'Líneas de tiempo e historia'],
    },
    upper: {
      en: ['Ancient Egypt & Mesopotamia', 'Ancient Greece & Rome', 'The Constitution & Bill of Rights', 'Industrial Revolution', 'World Geography & Climate Zones', 'Economics: Supply & Demand', 'Civil Rights Movement'],
      es: ['Antiguo Egipto y Mesopotamia', 'Grecia y Roma antiguas', 'La Constitución y sus enmiendas', 'Revolución Industrial', 'Geografía mundial y climas', 'Economía: oferta y demanda', 'Movimiento por los derechos civiles'],
    },
  },
  art: {
    early: {
      en: ['Primary & Secondary Colors', 'Lines & Shapes in Art', 'Drawing Faces', 'Collage & Textures', 'Songs & Rhythm'],
      es: ['Colores primarios y secundarios', 'Líneas y figuras en el arte', 'Dibujar caras', 'Collage y texturas', 'Canciones y ritmo'],
    },
    mid: {
      en: ['Color Wheel & Mixing', 'Famous Artists & Styles', 'Perspective & Depth', 'Sculpture & 3-D Forms', 'Patterns & Symmetry', 'Instruments of the Orchestra'],
      es: ['Círculo cromático y mezclas', 'Artistas y estilos famosos', 'Perspectiva y profundidad', 'Escultura y formas 3-D', 'Patrones y simetría', 'Instrumentos de la orquesta'],
    },
    upper: {
      en: ['Art History Movements', 'Composition & Rule of Thirds', 'Digital Art & Design Basics', 'Photography & Framing', 'Music Theory Basics', 'Theater & Stagecraft'],
      es: ['Movimientos de la historia del arte', 'Composición y regla de tercios', 'Arte digital y diseño', 'Fotografía y encuadre', 'Teoría musical básica', 'Teatro y escenografía'],
    },
  },
};

export function gradeBand(grade?: string): Band {
  const g = (grade || '').toUpperCase();
  if (!g || g === 'K') return 'early';
  const n = parseInt(g, 10);
  if (Number.isNaN(n)) return 'mid';
  if (n <= 2) return 'early';
  if (n <= 5) return 'mid';
  return 'upper';
}

/** All library topics for a subject, ordered with the kid's grade band first. */
export function libraryTopics(subject: string, lang: Lang, grade?: string): string[] {
  const subj = TOPIC_LIBRARY[subject];
  if (!subj) return [];
  const band = gradeBand(grade);
  const order: Band[] = band === 'early' ? ['early', 'mid', 'upper'] : band === 'mid' ? ['mid', 'early', 'upper'] : ['upper', 'mid', 'early'];
  const out: string[] = [];
  for (const b of order) out.push(...(subj[b][lang] || subj[b].en));
  return Array.from(new Set(out));
}

/** Just the topics matching the kid's grade band — used for suggestions. */
export function gradeTopics(subject: string, lang: Lang, grade?: string): string[] {
  const subj = TOPIC_LIBRARY[subject];
  if (!subj) return [];
  const band = subj[gradeBand(grade)];
  return band[lang] || band.en;
}

export function hasLibrary(subject: string): boolean {
  return !!TOPIC_LIBRARY[subject];
}

/** Subject ids that have a built-in topic library. */
export const LIBRARY_SUBJECTS = Object.keys(TOPIC_LIBRARY);

/**
 * Local suggestion engine — used as the instant first paint and as the fallback
 * when the AI suggestion endpoint is unavailable.
 */
export function localSuggestions(
  opts: { lang: Lang; grade?: string; subjects?: string[]; exclude?: string[]; limit?: number },
): Array<{ subject: string; topic: string; reason: string }> {
  const { lang, grade, exclude = [], limit = 6 } = opts;
  const done = new Set(exclude.map((t) => t.trim().toLowerCase()));
  const pool = (opts.subjects && opts.subjects.length ? opts.subjects : LIBRARY_SUBJECTS).filter(hasLibrary);
  const ordered = pool.length ? pool : LIBRARY_SUBJECTS;

  const out: Array<{ subject: string; topic: string; reason: string }> = [];
  let round = 0;
  // Round-robin across subjects so suggestions stay varied instead of all-Science.
  while (out.length < limit && round < 12) {
    let added = 0;
    for (const subject of ordered) {
      const topics = gradeTopics(subject, lang, grade);
      const topic = topics[round];
      if (!topic) continue;
      if (done.has(topic.trim().toLowerCase())) continue;
      out.push({
        subject,
        topic,
        reason: lang === 'es' ? 'Nuevo para tu grado' : 'New for your grade',
      });
      done.add(topic.trim().toLowerCase());
      added++;
      if (out.length >= limit) break;
    }
    if (!added) break;
    round++;
  }
  return out;
}
