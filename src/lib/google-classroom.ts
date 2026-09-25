import crypto from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

/**
 * Google Classroom connector (read-only).
 * OAuth tokens live in an encrypted, httpOnly cookie so no database table is needed.
 * Env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, optional GOOGLE_REDIRECT_URI.
 */

export const TOKEN_COOKIE = 'qk_gclass';
export const STATE_COOKIE = 'qk_gclass_state';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const API = 'https://classroom.googleapis.com/v1';

export const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
  'https://www.googleapis.com/auth/classroom.announcements.readonly',
  'https://www.googleapis.com/auth/classroom.topics.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
];

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // ms epoch
}

export function isConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(req: NextRequest) {
  return process.env.GOOGLE_REDIRECT_URI || `${req.nextUrl.origin}/api/classroom/callback`;
}

export function authUrl(req: NextRequest, state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(req),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent select_account',
    state,
  });
  return `${AUTH_URL}?${params}`;
}

// ---------- token cookie (AES-256-GCM, key derived from the client secret) ----------

function key() {
  return crypto.createHash('sha256').update(`qk-gclass:${process.env.GOOGLE_CLIENT_SECRET}`).digest();
}

function encrypt(tokens: GoogleTokens) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(tokens), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}

function decrypt(value: string): GoogleTokens | null {
  try {
    const buf = Buffer.from(value, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    const json = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function readTokens(req: NextRequest) {
  const raw = req.cookies.get(TOKEN_COOKIE)?.value;
  return raw ? decrypt(raw) : null;
}

export function writeTokens(res: NextResponse, tokens: GoogleTokens) {
  res.cookies.set(TOKEN_COOKIE, encrypt(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/classroom',
    maxAge: 60 * 60 * 24 * 180,
  });
}

export function clearTokens(res: NextResponse) {
  res.cookies.set(TOKEN_COOKIE, '', { path: '/api/classroom', maxAge: 0 });
}

// ---------- OAuth token exchange ----------

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      ...body,
    }),
  });
  if (!res.ok) throw new Error(`Google token error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; refresh_token?: string; expires_in: number }>;
}

export async function exchangeCode(req: NextRequest, code: string): Promise<GoogleTokens> {
  const t = await tokenRequest({ code, grant_type: 'authorization_code', redirect_uri: redirectUri(req) });
  return { access_token: t.access_token, refresh_token: t.refresh_token, expires_at: Date.now() + t.expires_in * 1000 };
}

/** Returns valid tokens (refreshing if needed) and whether the cookie must be rewritten. */
export async function freshTokens(tokens: GoogleTokens): Promise<{ tokens: GoogleTokens; refreshed: boolean }> {
  if (tokens.expires_at - 60_000 > Date.now()) return { tokens, refreshed: false };
  if (!tokens.refresh_token) throw new NotConnectedError();
  try {
    const t = await tokenRequest({ refresh_token: tokens.refresh_token, grant_type: 'refresh_token' });
    return {
      tokens: { access_token: t.access_token, refresh_token: t.refresh_token || tokens.refresh_token, expires_at: Date.now() + t.expires_in * 1000 },
      refreshed: true,
    };
  } catch {
    throw new NotConnectedError();
  }
}

export async function revoke(tokens: GoogleTokens) {
  const token = tokens.refresh_token || tokens.access_token;
  await fetch(`${REVOKE_URL}?token=${encodeURIComponent(token)}`, { method: 'POST' }).catch(() => {});
}

export class NotConnectedError extends Error {
  constructor() { super('Google Classroom not connected'); }
}

// ---------- Classroom API ----------

async function get<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
  if (res.status === 401) throw new NotConnectedError();
  if (!res.ok) throw new Error(`Classroom API ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

interface GDate { year: number; month: number; day: number }
interface GTime { hours?: number; minutes?: number }
interface GMaterial {
  driveFile?: { driveFile: { title?: string; alternateLink?: string } };
  youtubeVideo?: { title?: string; alternateLink?: string };
  link?: { url: string; title?: string };
  form?: { title?: string; formUrl?: string };
}

export interface ClassroomMaterial { kind: 'drive' | 'youtube' | 'link' | 'form'; title: string; url?: string }

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  room?: string;
  descriptionHeading?: string;
  description?: string;
  alternateLink?: string;
  courseState?: string;
  updateTime?: string;
}

export interface ClassroomItem {
  id: string;
  kind: 'assignment' | 'material' | 'announcement';
  title: string;
  text?: string;
  workType?: string;
  maxPoints?: number;
  topic?: string;
  due?: string; // ISO date (UTC) when set
  created?: string;
  link?: string;
  materials: ClassroomMaterial[];
}

export interface ClassroomCourseDetails {
  course: ClassroomCourse;
  teachers: string[];
  topics: string[];
  assignments: ClassroomItem[];
  materials: ClassroomItem[];
  announcements: ClassroomItem[];
}

function mapMaterials(list?: GMaterial[]): ClassroomMaterial[] {
  return (list || []).flatMap<ClassroomMaterial>((m) => {
    if (m.driveFile) return [{ kind: 'drive', title: m.driveFile.driveFile.title || 'Drive file', url: m.driveFile.driveFile.alternateLink }];
    if (m.youtubeVideo) return [{ kind: 'youtube', title: m.youtubeVideo.title || 'Video', url: m.youtubeVideo.alternateLink }];
    if (m.link) return [{ kind: 'link', title: m.link.title || m.link.url, url: m.link.url }];
    if (m.form) return [{ kind: 'form', title: m.form.title || 'Form', url: m.form.formUrl }];
    return [];
  });
}

function dueIso(date?: GDate, time?: GTime) {
  if (!date) return undefined;
  return new Date(Date.UTC(date.year, date.month - 1, date.day, time?.hours ?? 23, time?.minutes ?? 59)).toISOString();
}

export async function listCourses(accessToken: string): Promise<ClassroomCourse[]> {
  const courses: ClassroomCourse[] = [];
  let pageToken = '';
  do {
    const q = new URLSearchParams({ courseStates: 'ACTIVE', pageSize: '50' });
    if (pageToken) q.set('pageToken', pageToken);
    const data = await get<{ courses?: ClassroomCourse[]; nextPageToken?: string }>(accessToken, `/courses?${q}`);
    courses.push(...(data.courses || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken && courses.length < 200);
  return courses.map(({ id, name, section, room, descriptionHeading, description, alternateLink, courseState, updateTime }) =>
    ({ id, name, section, room, descriptionHeading, description, alternateLink, courseState, updateTime }));
}

/** One course plus its teachers, topics, assignments, materials, and announcements.
 *  Sub-requests are independent so a school that blocks one scope still gets the rest. */
export async function getCourseDetails(accessToken: string, courseId: string): Promise<ClassroomCourseDetails> {
  const id = encodeURIComponent(courseId);
  const course = await get<ClassroomCourse>(accessToken, `/courses/${id}`);

  const [teachersR, topicsR, workR, materialsR, announcementsR] = await Promise.allSettled([
    get<{ teachers?: { profile?: { name?: { fullName?: string } } }[] }>(accessToken, `/courses/${id}/teachers?pageSize=20`),
    get<{ topic?: { topicId: string; name: string }[] }>(accessToken, `/courses/${id}/topics?pageSize=50`),
    get<{ courseWork?: Record<string, unknown>[] }>(accessToken, `/courses/${id}/courseWork?pageSize=30&orderBy=${encodeURIComponent('updateTime desc')}`),
    get<{ courseWorkMaterial?: Record<string, unknown>[] }>(accessToken, `/courses/${id}/courseWorkMaterials?pageSize=30`),
    get<{ announcements?: Record<string, unknown>[] }>(accessToken, `/courses/${id}/announcements?pageSize=20`),
  ]);

  // a revoked token shows up as 401 on every call; surface that instead of an empty class
  for (const r of [teachersR, topicsR, workR, materialsR, announcementsR]) {
    if (r.status === 'rejected' && r.reason instanceof NotConnectedError) throw r.reason;
  }

  const val = <T,>(r: PromiseSettledResult<T>): T | undefined => (r.status === 'fulfilled' ? r.value : undefined);
  const topicList = val(topicsR)?.topic || [];
  const topicName = (tid?: unknown) => topicList.find((t) => t.topicId === tid)?.name;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const assignments: ClassroomItem[] = (val(workR)?.courseWork || []).map((w: any) => ({
    id: w.id,
    kind: 'assignment',
    title: w.title || 'Untitled',
    text: w.description,
    workType: w.workType,
    maxPoints: w.maxPoints,
    topic: topicName(w.topicId),
    due: dueIso(w.dueDate, w.dueTime),
    created: w.creationTime,
    link: w.alternateLink,
    materials: mapMaterials(w.materials),
  }));

  const materials: ClassroomItem[] = (val(materialsR)?.courseWorkMaterial || []).map((m: any) => ({
    id: m.id,
    kind: 'material',
    title: m.title || 'Untitled',
    text: m.description,
    topic: topicName(m.topicId),
    created: m.creationTime,
    link: m.alternateLink,
    materials: mapMaterials(m.materials),
  }));

  const announcements: ClassroomItem[] = (val(announcementsR)?.announcements || []).map((a: any) => ({
    id: a.id,
    kind: 'announcement',
    title: String(a.text || '').split('\n')[0].slice(0, 90) || 'Announcement',
    text: a.text,
    created: a.creationTime,
    link: a.alternateLink,
    materials: mapMaterials(a.materials),
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return {
    course: {
      id: course.id, name: course.name, section: course.section, room: course.room,
      descriptionHeading: course.descriptionHeading, description: course.description,
      alternateLink: course.alternateLink, courseState: course.courseState, updateTime: course.updateTime,
    },
    teachers: (val(teachersR)?.teachers || []).map((t) => t.profile?.name?.fullName).filter((n): n is string => Boolean(n)),
    topics: topicList.map((t) => t.name),
    assignments,
    materials,
    announcements,
  };
}
