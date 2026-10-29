'use client';
import React from 'react';

export interface TopicImageRequest {
  subject: string;
  /** Subject name for the prompt (custom subjects only exist on the parent's account) */
  subjectName: string;
  topic: string;
  topics?: string[];
  grade: string;
}

export type TopicImageState = { status: 'loading' | 'none' } | { status: 'ready'; url: string; band?: string };

/** While another kid's request is drawing the same picture, ask again every few seconds (about 80 s in all) */
const POLL_MS = 4000;
const MAX_POLLS = 20;

/** Loads (or has the server draw) the header picture of a study guide. Start it with the guide request: drawing takes a while */
export function useTopicImage(req: TopicImageRequest): TopicImageState {
  const [state, setState] = React.useState<TopicImageState>({ status: 'loading' });
  const body = JSON.stringify(req);

  React.useEffect(() => {
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
        else setState({ status: 'none' });
      } catch {
        if (!cancelled) setState({ status: 'none' });
      }
    };
    load();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [body]);

  return state;
}

/** Header picture: a soft shimmer while it's drawn, then a fade-in with a slow drift (and a gentle float for the youngest) */
export function TopicImage({ state, alt, loadingLabel }: { state: TopicImageState; alt: string; loadingLabel: string }) {
  // Tracked per URL: a cached picture can finish loading before any effect would run
  const [loaded, setLoaded] = React.useState<string | null>(null);
  const [broken, setBroken] = React.useState<string | null>(null);
  const url = state.status === 'ready' ? state.url : null;
  const shown = !!url && loaded === url;

  if (state.status === 'none' || (url && broken === url)) return null;
  return (
    <div className="qk-topic-img" data-band={state.status === 'ready' ? state.band : undefined}>
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
