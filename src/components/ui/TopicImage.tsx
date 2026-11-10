'use client';
import React from 'react';

export interface TopicImageRequest {
  subject: string;
  /** Subject name for the prompt (custom subjects only exist on the parent's account) */
  subjectName: string;
  topic: string;
  topics?: string[];
  grade: string;
  /** Title of one section of the guide: asks for that section's picture instead of the header picture */
  section?: string;
  /** Key idea of the section, so the picture shows the right thing */
  hint?: string;
  /** Only use a picture that already exists: never has a new one drawn */
  cachedOnly?: boolean;
}

export type TopicImageState = { status: 'loading' | 'none' } | { status: 'ready'; url: string; band?: string };

/** While another kid's request is drawing the same picture, ask again every few seconds (about 80 s in all) */
const POLL_MS = 4000;
const MAX_POLLS = 20;

/**
 * Loads (or has the server draw) a picture of a study guide. Start it with the guide request: drawing takes a while.
 * With `enabled` false nothing is asked yet (a section's picture waits until the section is near the screen).
 */
export function useTopicImage(req: TopicImageRequest, enabled = true): TopicImageState {
  const [state, setState] = React.useState<TopicImageState>({ status: 'loading' });
  const body = JSON.stringify(req);

  React.useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let polls = 0;
    setState({ status: 'loading' });
    const load = async () => {
      try {
        const res = await fetch('/api/generate/image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        const data = await res.json();
        if (cancelled) return;
        if (data.status === 'ready' && data.url) setState({ status: 'ready', url: data.url, band: data.band });
        else if (data.status === 'pending' && ++polls < MAX_POLLS) timer = setTimeout(load, POLL_MS);
        else {
          // 'not-drawn' and 'signed-out' are expected; anything else is a setup problem worth seeing in the console
          if (data.reason && data.reason !== 'not-drawn' && data.reason !== 'signed-out') console.warn('No picture:', data.reason, data.detail || '');
          setState({ status: 'none' });
        }
      } catch {
        if (!cancelled) setState({ status: 'none' });
      }
    };
    load();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [body, enabled]);

  return state;
}

/** True once the element has come near the screen (stays true) */
function useNearScreen<T extends Element>(): [React.RefObject<T>, boolean] {
  const ref = React.useRef<T>(null);
  const [near, setNear] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (typeof IntersectionObserver === 'undefined') { setNear(true); return; }
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) setNear(true); }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return [ref, near];
}

/** Picture frame: a soft shimmer while it's drawn, then a fade-in */
function Frame({ state, alt, loadingLabel, className = '' }: { state: TopicImageState; alt: string; loadingLabel: string; className?: string }) {
  // Tracked per URL: a cached picture can finish loading before any effect would run
  const [loaded, setLoaded] = React.useState<string | null>(null);
  const [broken, setBroken] = React.useState<string | null>(null);
  const url = state.status === 'ready' ? state.url : null;
  const shown = !!url && loaded === url;

  if (state.status === 'none' || (url && broken === url)) return null;
  return (
    <div className={`qk-topic-img ${className}`} data-band={state.status === 'ready' ? state.band : undefined}>
      {!shown && (
        <div className="qk-topic-img-loading">
          <span className="qk-topic-img-brush" aria-hidden>🎨</span>
          <span>{loadingLabel}</span>
        </div>
      )}
      {url && <img src={url} alt={alt} className={shown ? 'on' : undefined} onLoad={() => setLoaded(url)} onError={() => setBroken(url)} />}
    </div>
  );
}

/** Header picture of a guide (with a slow drift, and a gentle float for the youngest) */
export function TopicImage({ state, alt, loadingLabel }: { state: TopicImageState; alt: string; loadingLabel: string }) {
  return <Frame state={state} alt={alt} loadingLabel={loadingLabel} />;
}

/**
 * Picture of one section of a guide, next to its key idea. It is asked for when the section comes near the screen.
 * When there is no picture the key idea takes the whole row: an empty frame is never left on the page.
 */
export function SectionVisual({ req, alt, loadingLabel, children }: { req: TopicImageRequest; alt: string; loadingLabel: string; children?: React.ReactNode }) {
  const [ref, near] = useNearScreen<HTMLDivElement>();
  const state = useTopicImage(req, near);
  const hasImage = state.status !== 'none';
  if (!hasImage && !children) return null;
  return (
    <div ref={ref} className="qk-stack-sm" style={{ marginTop: 18, display: 'grid', gridTemplateColumns: hasImage && children ? 'minmax(0, 1.2fr) minmax(0, 1fr)' : 'minmax(0, 1fr)', gap: 14, alignItems: 'stretch' }}>
      {hasImage && <Frame state={state} alt={alt} loadingLabel={loadingLabel} className="qk-topic-img-still" />}
      {children}
    </div>
  );
}

/** Cover of a card: the topic's picture when there is one, the fallback (the subject's emoji) until then */
export function TopicThumb({ req, alt, children }: { req: TopicImageRequest; alt: string; children: React.ReactNode }) {
  const [ref, near] = useNearScreen<HTMLDivElement>();
  const state = useTopicImage(req, near);
  const [loaded, setLoaded] = React.useState<string | null>(null);
  const url = state.status === 'ready' ? state.url : null;
  return (
    <div ref={ref} className="qk-thumb">
      {children}
      {url && <img src={url} alt={alt} className={loaded === url ? 'on' : undefined} onLoad={() => setLoaded(url)} onError={() => setLoaded(null)} />}
    </div>
  );
}
