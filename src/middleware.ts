import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { DEMO_COOKIE } from '@/lib/demo';

/**
 * Parent and kid screens need a signed-in account. Without one, send the visitor to the login page
 * (and back to the page they asked for afterwards). The only way past is the "See a demo" button,
 * which sets a session cookie; a demo flag left over in localStorage is not enough.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        // Keeps the session fresh: a refreshed token has to reach both this request and the browser
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // getUser() checks the token with Supabase; getSession() would trust whatever the cookie says
  const { data: { user } } = await supabase.auth.getUser();
  if (user || request.cookies.has(DEMO_COOKIE)) return response;

  const login = request.nextUrl.clone();
  login.pathname = '/auth';
  login.search = '';
  login.searchParams.set('tab', 'signin');
  login.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/dashboard/:path*', '/kids/:path*', '/profile/:path*'],
};
