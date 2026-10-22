import { NextRequest } from 'next/server';
import { getCourseDetails } from '@/lib/google-classroom';
import { withClassroom } from '../../handler';

/** Full details for one class: teachers, topics, assignments, materials, announcements. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withClassroom(req, (accessToken) => getCourseDetails(accessToken, id));
}
