'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import { SUBJECTS, libraryTopics } from '@/lib/topics';

export default function PickerClient() {
  const {
    lang, kids, activeKidId, setActiveKidId, studyParams, setStudyParams,
    difficulty, setDifficulty, customSubjects, customTopics, addCustomTopic, setCustomTopics, isDemo,
  } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const kid = kids.find((k) => k.id === activeKidId) || kids[0];
  const [custom, setCustom] = React.useState('');
  const [toast, setToast] = React.useState('');

  // Saved custom topics live in Supabase so they follow the family across devices.
  React.useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from('custom_topics')
          .select('subject, topic')
          .eq('parent_id', user.id);
        if (error || !data || cancelled) return;
        const merged: Record<string, string[]> = { ...useStore.getState().customTopics };
        for (const row of data) {
          const list = merged[row.subject] || [];
          if (!list.some((x) => x.toLowerCase() === row.topic.toLowerCase())) merged[row.subject] = [row.topic, ...list];
        }
        setCustomTopics(merged);
      } catch (e) {
        console.warn('Could not load saved topics:', e);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isDemo]);

  /** Topics for the selected subject: the parent's own first, then the library. */
  const topicsFor = React.useCallback((subject: string): { mine: string[]; library: string[] } => ({
    mine: customTopics[subject] || [],
    library: libraryTopics(subject, lang, kid?.grade),
  }), [customTopics, lang, kid?.grade]);

  const current = topicsFor(studyParams.subject);
  const topics = [...current.mine, ...current.library.filter((x) => !current.mine.some((m) => m.toLowerCase() === x.toLowerCase()))];

  const countFor = (subject: string) => {
    const { mine, library } = topicsFor(subject);
    const set = new Set([...mine, ...library].map((x) => x.toLowerCase()));
    return set.size;
  };

  const selectKid = (id: string) => {
    const k = kids.find((k) => k.id === id);
    if (!k) return;
    setActiveKidId(id);
    setStudyParams({ ...studyParams, grade: k.grade });
  };

  /** Adding a topic saves it under the current subject and selects it right away. */
  const saveTopic = async () => {
    const clean = custom.trim();
    if (!clean) return;
    const subject = studyParams.subject;
    addCustomTopic(subject, clean);
    setStudyParams({ ...studyParams, topic: clean, contentId: undefined, assignmentId: undefined });
    setCustom('');
    setToast(t('topicAdded'));
    setTimeout(() => setToast(''), 2000);

    if (!isDemo) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('custom_topics').upsert(
            { parent_id: user.id, subject, topic: clean },
            { onConflict: 'parent_id,subject,topic' },
          );
        }
      } catch (e) {
        // Kept locally either way — the topic still shows up in the list.
        console.warn('Could not save topic to Supabase:', e);
      }
    }
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
                const count = countFor(s.id);
                const mineCt = (customTopics[s.id] || []).length;
                return (
                  <button key={s.id} onClick={() => setStudyParams({ ...studyParams, subject: s.id, topic: '', contentId: undefined, assignmentId: undefined })} className="qk-wiggle"
                    style={{ appearance: 'none', textAlign: 'left', padding: '18px 16px', borderRadius: 18, background: on ? bg : 'var(--surface)', border: '2px solid ' + (on ? fg : 'var(--line)'), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, boxShadow: on ? 'var(--shadow)' : 'var(--shadow-sm)', transition: 'all .15s ease' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, color: fg, display: 'grid', placeItems: 'center', fontSize: 24 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{t(s.id)}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                        {count} {t('topicsCount')}{mineCt ? ` · ${mineCt} ${t('topicYours').toLowerCase()}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
              {(customSubjects || []).map((s) => {
                const on = studyParams.subject === s.id;
                const count = countFor(s.id);
                return (
                  <button key={s.id} onClick={() => setStudyParams({ ...studyParams, subject: s.id, topic: '', contentId: undefined, assignmentId: undefined })} className="qk-wiggle"
                    style={{ appearance: 'none', textAlign: 'left', padding: '18px 16px', borderRadius: 18, background: on ? s.color + '22' : 'var(--surface)', border: '2px solid ' + (on ? s.color : 'var(--line)'), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, boxShadow: on ? 'var(--shadow)' : 'var(--shadow-sm)', transition: 'all .15s ease' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: s.color + '22', color: s.color, display: 'grid', placeItems: 'center', fontSize: 24 }}>{s.icon}</div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                        {count ? `${count} ${t('topicsCount')}` : <span style={{ color: s.color, fontWeight: 700 }}>{lang === 'es' ? 'PERSONAL' : 'CUSTOM'}</span>}
                      </div>
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

          {/* topic — parent's saved topics first, then the subject's library */}
          <section style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <div className="qk-label" style={{ fontSize: 14 }}>{t('topic')}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                {t(studyParams.subject) !== studyParams.subject ? t(studyParams.subject) : (customSubjects.find((s) => s.id === studyParams.subject)?.name || '')}
                {' · '}{topics.length} {t('topicsCount')}
              </div>
            </div>
            {topics.length === 0 ? (
              <div className="qk-card" style={{ padding: 18, fontSize: 14, color: 'var(--ink-3)' }}>{t('topicsEmpty')}</div>
            ) : (
              <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {topics.map((topic) => {
                  const on = studyParams.topic === topic;
                  const mine = current.mine.some((m) => m.toLowerCase() === topic.toLowerCase());
                  return (
                    <button key={topic} onClick={() => setStudyParams({ ...studyParams, topic, contentId: undefined, assignmentId: undefined })}
                      style={{ appearance: 'none', padding: '14px 14px', textAlign: 'left', background: on ? 'var(--primary-l)' : 'var(--surface)', border: '1.5px solid ' + (on ? 'var(--primary)' : 'var(--line)'), borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 15, color: 'var(--ink)', boxShadow: on ? 'var(--shadow-sm)' : 'none', transition: 'all .15s ease' }}>
                      <span style={{ flex: 1 }}>{topic}</span>
                      {mine && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--honey)', background: 'var(--honey-l)', padding: '2px 7px', borderRadius: 999 }}>{t('topicYours')}</span>}
                      {on && <span style={{ color: 'var(--primary)' }}>{ICONS.check}</span>}
                    </button>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input className="qk-input" placeholder={t('customTopicPh')} value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void saveTopic(); } }}
                style={{ flex: 1, minWidth: 220 }} />
              <Btn kind="ghost" icon={ICONS.plus} onClick={() => void saveTopic()} disabled={!custom.trim()}>{t('customTopic')}</Btn>
            </div>
          </section>

          <div style={{ marginTop: 36, display: 'flex', justifyContent: 'flex-end' }}>
            <Btn kind="primary" iconRight={ICONS.next} onClick={() => router.push('/dashboard/generate')} disabled={!studyParams.subject || !studyParams.topic} style={{ opacity: (studyParams.subject && studyParams.topic) ? 1 : .5 }}>{t('continue')}</Btn>
          </div>
        </div>

        {toast && (
          <div style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', padding: '12px 16px', background: 'var(--ink)', color: '#fff', borderRadius: 12, boxShadow: 'var(--shadow-lg)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, zIndex: 9999 }}>
            {toast}
          </div>
        )}
      </div>
    </AppShell>
  );
}
