'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import type { QuizQuestion } from '@/types';

const FALLBACK: { questions: QuizQuestion[]; bonus: string } = {
  questions: [
    { q: 'How many planets are in our solar system?', choices: ['6', '7', '8', '9'], a: 2, hint: '' },
    { q: 'Which planet is closest to the Sun?', choices: ['Mercury', 'Venus', 'Earth', 'Mars'], a: 0, hint: '' },
    { q: 'Which is the largest planet?', choices: ['Saturn', 'Jupiter', 'Neptune', 'Earth'], a: 1, hint: '' },
    { q: 'What planet do we live on?', choices: ['Mars', 'Venus', 'Earth', 'Saturn'], a: 2, hint: '' },
    { q: "Which planet has the most famous rings?", choices: ['Uranus', 'Saturn', 'Mars', 'Mercury'], a: 1, hint: '' },
    { q: "What is the Sun?", choices: ['A planet', 'A star', 'A moon', 'A comet'], a: 1, hint: '' },
  ],
  bonus: 'Draw your favorite planet and write 2 things you learned.',
};

export default function PdfClient() {
  const { lang, kids, activeKidId, studyParams } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];

  const [data, setData] = React.useState<{ questions: QuizQuestion[]; bonus: string } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/generate/worksheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: studyParams.topic, grade: studyParams.grade, lang }),
        });
        if (res.ok) setData(await res.json());
        else setData(FALLBACK);
      } catch { setData(FALLBACK); }
      setLoading(false);
    };
    fetch_();
  }, [studyParams.topic, studyParams.grade, lang]);

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <button className="qk-btn qk-btn-ghost" onClick={() => router.back()}>{ICONS.back} <span>{t('back')}</span></button>
            <Btn kind="primary" icon={ICONS.printer} onClick={() => window.print()}>{t('print')}</Btn>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, paddingTop: 80 }}>
              <div className="qk-progress" style={{ width: 280 }}><span style={{ width: '60%', animation: 'qk-pulse 1.2s ease infinite' }} /></div>
              <div style={{ fontSize: 16, color: 'var(--ink-3)', fontFamily: 'var(--font-display)' }}>{t('generating')}</div>
            </div>
          ) : data && (
            <div style={{ background: '#fff', color: '#1F3326', borderRadius: 8, boxShadow: 'var(--shadow-lg)', padding: '56px 60px', maxWidth: 780, margin: '0 auto', fontFamily: '"Patrick Hand", "Quicksand", sans-serif' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px dashed #1F3326', paddingBottom: 12, gap: 18 }}>
                <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 26, lineHeight: 1.1 }}>{studyParams.topic}</div>
                  <div style={{ fontSize: 14, marginTop: 6 }}>{t(studyParams.subject)} · {lang === 'es' ? 'Grado ' : 'Grade '}{studyParams.grade}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, flex: '0 0 auto' }}>
                  <div>{lang === 'es' ? 'Nombre:' : 'Name:'} <span style={{ display: 'inline-block', borderBottom: '1.5px solid #1F3326', minWidth: 120, marginLeft: 4 }}>{kid?.name || ''}</span></div>
                  <div style={{ marginTop: 6 }}>{lang === 'es' ? 'Fecha:' : 'Date:'} <span style={{ display: 'inline-block', borderBottom: '1.5px solid #1F3326', minWidth: 120, marginLeft: 4 }} /></div>
                </div>
              </div>

              <ol style={{ marginTop: 20, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {data.questions.map((q, idx) => (
                  <li key={idx}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{idx + 1}. {q.q}</div>
                    <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 18, rowGap: 6, fontSize: 15 }}>
                      {q.choices.map((ch, ci) => (
                        <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                          <span style={{ width: 18, height: 18, border: '1.5px solid #1F3326', borderRadius: 4, display: 'inline-block', flexShrink: 0 }} />
                          <span>{String.fromCharCode(65 + ci)}. {ch}</span>
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ol>

              <div style={{ marginTop: 24, padding: 14, border: '1.5px dashed #1F3326', borderRadius: 8, fontSize: 14 }}>
                ⭐ {lang === 'es' ? 'Extra:' : 'Bonus:'} {data.bonus}
              </div>

              <div style={{ marginTop: 24, fontSize: 11, color: '#5b6e60', textAlign: 'center', fontFamily: 'ui-monospace, monospace' }}>
                QuizKids · Generated for {kid?.name || '—'} · {new Date().toLocaleDateString(lang === 'es' ? 'es' : 'en')}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
