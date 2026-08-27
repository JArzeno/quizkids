'use client';

/**
 * Browser-side client for the app's own API routes.
 *
 * Before the Railway migration these calls went straight from the browser to
 * Supabase, with Row Level Security deciding what each parent could see. A
 * plain Postgres database can't be reached from a browser, so every read and
 * write now goes through /api/* where the session cookie identifies the parent
 * and the route handler enforces ownership.
 */

import type { Kid } from '@/types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: init?.body ? { 'Content-Type': 'application/json', ...init?.headers } : init?.headers,
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, payload?.error || 'Request failed');
  }
  return payload as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

export interface KidRow {
  id: string;
  parent_id: string;
  name: string;
  grade: string;
  avatar: string | null;
  color: string | null;
  code: string | null;
  goal_min: number | null;
  streak: number | null;
  stars: number | null;
  minutes_total: number | null;
  weekly_pct: number | null;
  last_subject: string | null;
  signature: string | null;
  created_at: string;
}

export interface AssignmentRow {
  id: string;
  subject: string | null;
  topic: string | null;
  grade: string | null;
  type: string | null;
  status: string;
  assigned_at: string;
  content_id: string | null;
}

export interface QuizResultRow {
  kid_id?: string;
  assignment_id: string | null;
  subject?: string | null;
  topic?: string | null;
  correct: number | null;
  total: number | null;
  stars: number | null;
  created_at?: string;
}

export const api = {
  // --- auth ---
  signup: (body: { name: string; email: string; password: string }) =>
    post<{ user: SessionUser }>('/api/auth/signup', body),
  login: (body: { email: string; password: string }) =>
    post<{ user: SessionUser }>('/api/auth/login', body),
  logout: () => post<{ ok: true }>('/api/auth/logout', {}),
  me: () => get<{ user: SessionUser | null }>('/api/auth/me'),

  // --- kids ---
  listKids: () => get<{ kids: KidRow[] }>('/api/kids'),
  createKid: (body: {
    name: string;
    grade: string;
    avatar: string;
    color: string;
    code: string;
    signature?: string | null;
  }) => post<{ kid: KidRow }>('/api/kids', body),
  updateKid: (id: string, body: Partial<KidRow>) => patch<{ kid: KidRow }>(`/api/kids/${id}`, body),
  deleteKid: (id: string) => del<{ ok: true }>(`/api/kids/${id}`),

  // --- dashboard ---
  dashboardSummary: () =>
    get<{
      kids: KidRow[];
      quizResults: QuizResultRow[];
      studySessions: Array<{ kid_id: string; minutes: number | null }>;
    }>('/api/dashboard/summary'),

  // --- assignments ---
  listAssignments: (kidId: string) =>
    get<{ assignments: AssignmentRow[]; results: QuizResultRow[] }>(
      `/api/assignments?kidId=${encodeURIComponent(kidId)}`
    ),
  createAssignment: (body: {
    kid_id: string;
    content_id: string | null;
    subject: string;
    topic: string;
    grade: string;
    type: string;
    status?: string;
  }) => post<{ assignment: { id: string } }>('/api/assignments', body),
  completeAssignment: (id: string) =>
    patch<{ assignment: AssignmentRow }>(`/api/assignments/${id}`, { status: 'completed' }),

  // --- study time ---
  minutesSince: (kidId: string, since: Date) =>
    get<{ minutes: number }>(
      `/api/study-sessions?kidId=${encodeURIComponent(kidId)}&since=${encodeURIComponent(since.toISOString())}`
    ),
  logStudySession: (body: {
    kid_id: string;
    minutes: number;
    started_at: string;
    ended_at: string;
  }) => post<{ session: { id: string } }>('/api/study-sessions', body),

  // --- quiz results ---
  saveQuizResult: (body: {
    kid_id: string;
    assignment_id: string | null;
    subject: string;
    topic: string;
    grade: string;
    difficulty: string;
    total: number;
    correct: number;
    stars: number;
    lang: string;
  }) => post<{ result: { id: string } }>('/api/quiz-results', body),

  // --- cached content ---
  getContent: <T>(id: string) => get<{ content: T; id: string }>(`/api/content/${id}`),
};

/** Maps a `kids` row from the API onto the shape the Zustand store keeps. */
export function toKid(k: KidRow): Kid {
  return {
    id: k.id,
    parent_id: k.parent_id,
    name: k.name,
    grade: k.grade,
    avatar: k.avatar || 'sprout',
    color: k.color || '#3F7A4F',
    code: k.code || '',
    streak: k.streak || 0,
    stars: k.stars || 0,
    minutes_total: k.minutes_total || 0,
    weekly: k.weekly_pct || 0,
    goal_min: k.goal_min || 30,
    lastSubject: k.last_subject || undefined,
    signature: k.signature || undefined,
    recent: [],
  };
}
