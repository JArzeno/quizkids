'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/components/ui/Icons';
import { Avatar } from '@/components/ui/Avatar';
import { Btn } from '@/components/ui/Btn';
import { Stars, StatCard } from '@/components/ui/Stars';
import { AppShell } from '@/components/layout/AppShell';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/client';
import type { Kid } from '@/types';

const SUBJECT_LABELS: Record<string, { en: string; es: string; icon: string }> = {
  sci:  { en: 'Science',       es: 'Ciencias',         icon: '🔬' },
  math: { en: 'Math',          es: 'Matemáticas',      icon: '➗' },
  lang: { en: 'Language Arts', es: 'Lengua',           icon: '📖' },
  soc:  { en: 'Social Studies',es: 'Estudios Sociales',icon: '🌎' },
  art:  { en: 'Art',           es: 'Arte',             icon: '🎨' },
};

function gradeLabel(grade: string, lang: string) {
  const g = grade.toUpperCase();
  if (g === 'K') return lang === 'es' ? 'Kínder' : 'Kindergarten';
  return (lang === 'es' ? 'Grado ' : 'Grade ') + grade;
}

interface KidSummary {
  kidId: string;
  totalSessions: number;
  totalMinutes: number;
  quizzesDone: number;
  avgScore: number;  // 0–100
  topSubjects: Array<{ subject: string; count: number }>;
  recentTopics: string[];
}

function DeleteKidModal({ kid, onCancel, onConfirm }: { kid: Kid; onCancel: () => void; onConfirm: () => void }) {
  const [typed, setTyped] = React.useState('');
  const canDelete = typed === 'DELETE';
  React.useEffect(() => { setTyped(''); }, [kid.id]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: 24 }} onClick={onCancel}>
      <div className="qk-card" style={{ width: '100%', maxWidth: 420, padding: 28 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--coral-l)', color: 'var(--coral)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>{ICONS.trash}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Remove {kid.name}?</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>This will delete all their progress and history.</div>
          </div>
        </div>
        <div style={{ padding: '12px 14px', background: 'var(--coral-l)', borderRadius: 12, marginBottom: 20, fontSize: 13, color: 'var(--coral)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar id={kid.avatar} size={28} />
          <span>{kid.name} · {gradeLabel(kid.grade, 'en')}</span>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 8 }}>
            Type <strong style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--coral)' }}>DELETE</strong> to confirm:
          </div>
          <input className="qk-input" placeholder="DELETE" value={typed} onChange={e => setTyped(e.target.value)} autoFocus style={{ fontFamily: 'ui-monospace, monospace', letterSpacing: '.1em' }} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="qk-btn qk-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="qk-btn" disabled={!canDelete} onClick={canDelete ? onConfirm : undefined}
            style={{ background: canDelete ? 'var(--coral)' : 'var(--surface-2)', color: canDelete ? '#fff' : 'var(--ink-3)', cursor: canDelete ? 'pointer' : 'not-allowed', opacity: canDelete ? 1 : 0.7, transition: 'background .2s, color .2s' }}>
            {ICONS.trash}<span>Remove kid</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function KidSummaryPanel({ kid, summary, lang }: { kid: Kid; summary: KidSummary | undefined; lang: string }) {
  if (!summary) return null;
  const { totalMinutes, quizzesDone, avgScore, topSubjects, recentTopics } = summary;
  if (quizzesDone === 0 && totalMinutes === 0) return null;

  return (
    <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {lang === 'es' ? 'Resumen de estudio' : 'Study summary'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--surface)', borderRadius: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>{totalMinutes}</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600 }}>{lang === 'es' ? 'MIN' : 'MIN'}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--surface)', borderRadius: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--sky)' }}>{quizzesDone}</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600 }}>{lang === 'es' ? 'QUIZZES' : 'QUIZZES'}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--surface)', borderRadius: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--honey)' }}>{avgScore}%</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 600 }}>{lang === 'es' ? 'PRECISIÓN' : 'ACCURACY'}</div>
        </div>
      </div>

      {topSubjects.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {topSubjects.map((ts) => {
            const info = SUBJECT_LABELS[ts.subject] || { en: ts.subject, es: ts.subject, icon: '📚' };
            return (
              <span key={ts.subject} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: 'var(--primary-l)', color: 'var(--primary-d)', fontSize: 11, fontWeight: 700 }}>
                {info.icon} {lang === 'es' ? info.es : info.en} · {ts.count}
              </span>
            );
          })}
        </div>
      )}

      {recentTopics.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>
            {lang === 'es' ? 'Temas recientes:' : 'Recent topics:'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            {recentTopics.slice(0, 3).join(' · ')}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardClient() {
  const { lang, kids, account, setActiveKidId, setMode, gamification, removeKid, setKids, isDemo } = useStore();
  const t = useT(lang);
  const router = useRouter();
  const [deletingKid, setDeletingKid] = React.useState<Kid | null>(null);
  const [summaries, setSummaries] = React.useState<Record<string, KidSummary>>({});

  React.useEffect(() => {
    if (isDemo) return;
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('kids').select('*').eq('parent_id', user.id).order('created_at');
      if (data) {
        setKids(data.map((k) => ({
          id: k.id,
          parent_id: k.parent_id,
          name: k.name,
          grade: k.grade,
          avatar: k.avatar || 'sprout',
          color: k.color || '#3F7A4F',
          code: k.code,
          streak: k.streak || 0,
          stars: k.stars || 0,
          minutes_total: k.minutes_total || 0,
          weekly: k.weekly_pct || 0,
          goal_min: k.goal_min || 30,
          lastSubject: k.last_subject || undefined,
          recent: [],
        })));

        // Load summaries for all kids
        const kidIds = data.map((k) => k.id);
        if (kidIds.length > 0) {
          const [quizRes, sessionRes] = await Promise.all([
            supabase.from('quiz_results').select('kid_id, subject, topic, correct, total, stars, created_at').in('kid_id', kidIds),
            supabase.from('study_sessions').select('kid_id, minutes').in('kid_id', kidIds),
          ]);

          const newSummaries: Record<string, KidSummary> = {};
          for (const kidId of kidIds) {
            const quizzes = (quizRes.data || []).filter((r) => r.kid_id === kidId);
            const sessions = (sessionRes.data || []).filter((s) => s.kid_id === kidId);

            const totalMinutes = sessions.reduce((acc, s) => acc + (s.minutes || 0), 0)
              + data.find((k) => k.id === kidId)?.minutes_total || 0;
            const quizzesDone = quizzes.length;
            const avgScore = quizzesDone > 0
              ? Math.round(quizzes.reduce((acc, q) => acc + (q.total > 0 ? (q.correct / q.total) * 100 : 0), 0) / quizzesDone)
              : 0;

            // Count by subject
            const subjectCount: Record<string, number> = {};
            quizzes.forEach((q) => {
              if (q.subject) subjectCount[q.subject] = (subjectCount[q.subject] || 0) + 1;
            });
            const topSubjects = Object.entries(subjectCount)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([subject, count]) => ({ subject, count }));

            // Recent unique topics
            const seen = new Set<string>();
            const recentTopics: string[] = [];
            for (const q of [...quizzes].reverse()) {
              if (q.topic && !seen.has(q.topic)) { seen.add(q.topic); recentTopics.push(q.topic); }
              if (recentTopics.length >= 5) break;
            }

            newSummaries[kidId] = { kidId, totalSessions: sessions.length, totalMinutes, quizzesDone, avgScore, topSubjects, recentTopics };
          }
          setSummaries(newSummaries);
        }
      }
    };
    load();
  }, [isDemo]);

  const totalStars = kids.reduce((a, k) => a + (k.stars || 0), 0);
  const totalMin = kids.reduce((a, k) => a + (k.minutes_total || 0), 0);
  const longest = Math.max(0, ...kids.map((k) => k.streak || 0));

  const openKidHome = (id: string) => { setActiveKidId(id); setMode('kid'); router.push('/kids/home'); };
  const createFor = (id: string) => { setActiveKidId(id); router.push('/dashboard/picker'); };

  return (
    <AppShell>
      <div className="qk-screen qk-page-enter">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="qk-eyebrow">{t('parent')}</span>
              <h1 className="qk-h1" style={{ marginTop: 10 }}>{t('dashHi')}, {account?.name?.split(' ')[0] || 'Ana'} 👋</h1>
              <p className="qk-sub">{t('dashGreet')}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/dashboard/add-kid" className="qk-btn qk-btn-ghost">{ICONS.plus}<span>{t('addKid')}</span></Link>
              <Btn kind="primary" icon={ICONS.spark} onClick={() => createFor(kids[0]?.id || '')}>{t('createNew')}</Btn>
            </div>
          </div>

          {gamification !== 'minimal' && (
            <div className="qk-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 24 }}>
              <StatCard tone="honey" icon={ICONS.star} value={totalStars} label={t('starsEarned')} />
              <StatCard tone="coral" icon={ICONS.flame} value={longest} label={t('streak')} />
              <StatCard tone="sky" icon={ICONS.book} value={totalMin + ' ' + t('minutes')} label={t('thisWeek') + ' · ' + t('minStudied')} />
            </div>
          )}

          <div className="qk-stagger" style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {kids.map((k) => (
              <div key={k.id} className="qk-card qk-card-interactive" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Avatar id={k.avatar} size={64} ring={k.color || 'var(--primary)'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20 }}>{k.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                      {gradeLabel(k.grade, lang)}
                      {k.lastSubject ? ' · ' + k.lastSubject : ''}
                    </div>
                  </div>
                  {gamification !== 'minimal' && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--coral)', fontWeight: 700 }}>{ICONS.flame}{k.streak || 0}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{t('streak')}</div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6 }}>
                    <span>{lang === 'es' ? 'Progreso semanal' : 'Weekly progress'}</span>
                    <span>{k.weekly || 0}%</span>
                  </div>
                  <div className="qk-progress"><span style={{ width: (k.weekly || 0) + '%' }} /></div>
                </div>

                {/* Study summary */}
                <KidSummaryPanel kid={k} summary={summaries[k.id]} lang={lang} />

                {/* Recent items from local state */}
                {k.recent && k.recent.length > 0 && !summaries[k.id] && (
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {k.recent.slice(0, 3).map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary-l)', color: 'var(--primary-d)', display: 'grid', placeItems: 'center' }}>
                          {r.kind === 'quiz' ? ICONS.cards : r.kind === 'pdf' ? ICONS.pdf : ICONS.book}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r.when}</div>
                        </div>
                        {gamification !== 'minimal' && r.kind === 'quiz' && <Stars count={r.score} of={5} size={14} />}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  <Btn kind="primary" onClick={() => createFor(k.id)} icon={ICONS.spark}>{t('createNew')}</Btn>
                  <button className="qk-btn qk-btn-ghost" onClick={() => openKidHome(k.id)}>{t('open')}</button>
                  <button className="qk-btn qk-btn-ghost" onClick={() => setDeletingKid(k)}
                    style={{ marginLeft: 'auto', color: 'var(--coral)', padding: '0 10px' }} title="Remove kid">
                    {ICONS.trash}
                  </button>
                </div>
              </div>
            ))}

            <button onClick={() => router.push('/dashboard/add-kid')} className="qk-card qk-dotgrid"
              style={{ display: 'grid', placeItems: 'center', border: '2px dashed var(--line)', background: 'transparent', cursor: 'pointer', padding: 20, minHeight: 200, color: 'var(--ink-3)', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, margin: '0 auto 10px', borderRadius: '50%', background: 'var(--surface)', display: 'grid', placeItems: 'center', color: 'var(--primary)' }}>{ICONS.plus}</div>
                {t('addKid')}
              </div>
            </button>
          </div>
        </div>
      </div>

      {deletingKid && (
        <DeleteKidModal
          kid={deletingKid}
          onCancel={() => setDeletingKid(null)}
          onConfirm={async () => {
            if (!isDemo) {
              const supabase = createClient();
              await supabase.from('kids').delete().eq('id', deletingKid.id);
            }
            removeKid(deletingKid.id);
            setDeletingKid(null);
          }}
        />
      )}
    </AppShell>
  );
}
