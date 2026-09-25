import { NextRequest } from 'next/server';
import { listCourses } from '@/lib/google-classroom';
import { withClassroom } from '../handler';

/** Active classes for the signed-in Google account. */
export async function GET(req: NextRequest) {
  return withClassroom(req, async (accessToken) => ({ courses: await listCourses(accessToken) }));
}
