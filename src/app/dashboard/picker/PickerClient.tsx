'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

const SUBJECTS = [
  { id: 'sci', tone: 'primary', icon: '🔬' }, { id: 'math', tone: 'sky', icon: '➗' },
  { id: 'lang', tone: 'berry', icon: '📖' }, { id: 'soc', tone: 'honey', icon: '🌎' }, { id: 'art', tone: 'coral', icon: '🎨' },
];
const TOPICS_BY_SUBJECT: Record<string, { en: string[]; es: string[] }> = {
  sci: {
    en: ['Solar System & Planets', 'Plants & Photosynthesis', 'States of Matter', 'Animals & Habitats', 'Weather & Seasons', 'The Water Cycle', 'Human Body Basics', 'Forces & Motion'],
    es: ['Sistema solar y planetas', 'Plantas y fotosíntesis', 'Estados de la materia', 'Animales y hábitats', 'Clima y estaciones', 'Ciclo del agua', 'El cuerpo humano', 'Fuerzas y movimiento'],
  },
};

export default function PickerClient() {
  const { lang, kids, activeKidId, setActiveKidId, studyParams, setStudyParams, difficulty, setDifficulty, customSubjects } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];
  const [custom, setCustom] = React.useState('');

  const topics = (TOPICS_BY_SUBJECT[studyParams.subject]?.[lang] || TOPICS_BY_SUBJECT.sci[lang]) as string[];

  const selectKid = (id: string) => {
    const k = kids.find((k) => k.id === id);
    if (!k) return;
    setActiveKidId(id);
    setStudyParams({ ...studyParams, grade: k.grade });
  };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <button className="qk-btn qk-btn-ghost" onClick={() => router.push('/dashboard')}>{ICONS.back} <span>{t('back')}</span></button>

          <div style={{ marginTop: 18 }}>
            <h1 className="qk-h1" style={{ margin: 0 }}>{t('pickerTitle')}</h1>
            <p className="qk-sub" style={{ margin: '6px 0 0' }}>{t('pickerSub')}</p>
          </div>

          {/* kid assignment */}
          {kids.length > 0 && (
            <section style={{ marginTop: 24 }}>
              <div className="qk-label" style={{ marginBottom: 10, fontSize: 14 }}>{lang === 'es' ? 'Asignar a' : 'Assign to'}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {kids.map((k) => {
                  const on = (kid?.id ?? '') === k.id;
                  return (
                    <button key={k.id} onClick={() => selectKid(k.id)}
                      style={{ appearance: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px 8px 8px', borderRadius: 999, border: '2px solid ' + (on ? k.color || 'var(--primary)' : 'var(--line)'), background: on ? (k.color || 'var(--primary)') + '18' : 'var(--surface)', cursor: 'pointer', transition: 'all .15s ease' }}>
                      <Avatar id={k.avatar} size={32} ring={on ? k.color : undefined} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: on ? (k.color || 'var(--primary)') : 'var(--ink)' }}>{k.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{lang === 'es' ? 'Grado ' : 'Grade '}{k.grade}</div>
                      </div>
                      {on && <span style={{ marginLeft: 4, color: k.color || 'var(--primary)' }}>{ICONS.check}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* subject */}
          <section style={{ marginTop: 28 }}>
            <div className="qk-label" style={{ marginBottom: 12, fontSize: 14 }}>{t('subject')}</div>
            <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
              {SUBJECTS.map((s) => {
                const on = studyParams.subject === s.id;
                const bg = `var(--${s.tone === 'primary' ? 'primary-l' : s.tone + '-l'})`;
                const fg = `var(--${s.tone === 'primary' ? 'primary' : s.tone})`;
                return (
                  <button key={s.id} onClick={() => setStudyParams({ ...studyParams, subject: s.id, topic: '' })} className="qk-wiggle"
                    style={{ appearance: 'none', textAlign: 'left', padding: '18px 16px', borderRadius: 18, background: on ? bg : 'var(--surface)', border: '2px solid ' + (on ? fg : 'var(--line)'), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, boxShadow: on ? 'var(--shadow)' : 'var(--shadow-sm)', transition: 'all .15s ease' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, color: fg, display: 'grid', placeItems: 'center', fontSize: 24 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{t(s.id)}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{s.id === 'sci' ? (lang === 'es' ? '8 temas' : '8 topics') : (lang === 'es' ? 'próximamente' : 'coming soon')}</div>
                    </div>
                  </button>
                );
              })}
              {(customSubjects || []).map((s) => {
                const on = studyParams.subject === s.id;
                return (
                  <button key={s.id} onClick={() => setStudyParams({ ...studyParams, subject: s.id, topic: '' })} className="qk-wiggle"
                    style={{ appearance: 'none', textAlign: 'left', padding: '18px 16px', borderRadius: 18, background: on ? s.color + '22' : 'var(--surface)', border: '2px solid ' + (on ? s.color : 'var(--line)'), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, boxShadow: on ? 'var(--shadow)' : 'var(--shadow-sm)', transition: 'all .15s ease' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: s.color + '22', color: s.color, display: 'grid', placeItems: 'center', fontSize: 24 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: s.color, fontWeight: 700 }}>{lang === 'es' ? 'PERSONAL' : 'CUSTOM'}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* difficulty */}
          <section style={{ marginTop: 28 }}>
            <div className="qk-label" style={{ marginBottom: 12, fontSize: 14 }}>{t('difficulty')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 520 }}>
              {[{ id: 'easy', label: t('easy'), sub: lang === 'es' ? '6 tarjetas' : '6 cards', emoji: '🌱' }, { id: 'medium', label: t('medium'), sub: lang === 'es' ? '8 tarjetas' : '8 cards', emoji: '🌳' }, { id: 'hard', label: t('hard'), sub: lang === 'es' ? '8 + giros' : '8 + twists', emoji: '⛰️' }].map((d) => {
                const on = difficulty === d.id;
                return <button key={d.id} onClick={() => setDifficulty(d.id as 'easy' | 'medium' | 'hard')} style={{ appearance: 'none', padding: '14px 12px', background: on ? 'var(--primary-l)' : 'var(--surface)', border: '2px solid ' + (on ? 'var(--primary)' : 'var(--line)'), borderRadius: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, boxShadow: on ? 'var(--shadow-sm)' : 'none', transition: 'all .15s ease' }}><span style={{ fontSize: 24 }}>{d.emoji}</span><span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>{d.label}</span><span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{d.sub}</span></button>;
              })}
            </div>
          </section>

          {/* topic */}
          <section style={{ marginTop: 28 }}>
            <div className="qk-label" style={{ marginBottom: 12, fontSize: 14 }}>{t('topic')}</div>
            <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {topics.map((topic) => {
                const on = studyParams.topic === topic;
                return <button key={topic} onClick={() => setStudyParams({ ...studyParams, topic })} style={{ appearance: 'none', padding: '14px 14px', textAlign: 'left', background: on ? 'var(--primary-l)' : 'var(--surface)', border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--line)'), borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 15, color: 'var(--ink)', boxShadow: on ? 'var(--shadow-sm)' : 'none', transition: 'all .15s ease' }}><span style={{ flex: 1 }}>{topic}</span>{on && <span style={{ color: 'var(--primary)' }}>{ICONS.check}</span>}</button>;
              })}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <input className="qk-input" placeholder={t('customTopicPh')} value={custom} onChange={(e) => setCustom(e.target.value)} style={{ flex: 1 }} />
              <Btn kind="ghost" icon={ICONS.plus} onClick={() => { if (custom.trim()) { setStudyParams({ ...studyParams, topic: custom.trim() }); setCustom(''); } }}>{t('customTopic')}</Btn>
            </div>
          </section>

          <div style={{ marginTop: 36, display: 'flex', justifyContent: 'flex-end' }}>
            <Btn kind="primary" iconRight={ICONS.next} onClick={() => router.push('/dashboard/generate')} disabled={!studyParams.subject || !studyParams.topic} style={{ opacity: (studyParams.subject && studyParams.topic) ? 1 : .5 }}>{t('continue')}</Btn>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
 
