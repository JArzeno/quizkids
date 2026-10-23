import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { DEMO_COOKIE } from '@/lib/demo';
import { LANG_COOKIE, detectLocale, isBot, localePath, splitLocale } from '@/lib/site';

const APP_PATHS = /^\/(dashboard|kids|profile)(\/|$)/;

export async function middleware(request: NextRequest) {
  return APP_PATHS.test(request.nextUrl.pathname) ? guardApp(request) : routeSite(request);
}

/** Supabase client that refreshes the session cookie on both the request and the response */
function supabaseFor(request: NextRequest) {
  const out = { response: NextResponse.next({ request }) };
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        // Keeps the session fresh: a refreshed token has to reach both this request and the browser
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          out.response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => out.response.cookies.set(name, value, options));
        },
      },
    }
  );
  return { supabase, out };
}

/**
 * Parent and kid screens need a signed-in account. Without one, send the visitor to the login page
 * (and back to the page they asked for afterwards). The only way past is the "See a demo" button,
 * which sets a session cookie; a demo flag left over in localStorage is not enough.
 */
async function guardApp(request: NextRequest) {
  const { supabase, out } = supabaseFor(request);
  // getUser() checks the token with Supabase; getSession() would trust whatever the cookie says
  const { data: { user } } = await supabase.auth.getUser();
  if (user || request.cookies.has(DEMO_COOKIE)) return out.response;

  const login = request.nextUrl.clone();
  login.pathname = '/auth';
  login.search = '';
  login.searchParams.set('tab', 'signin');
  login.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

/**
 * Public pages. English lives at the root and Spanish under /es.
 * - Signed-in parents opening the homepage go straight to their dashboard.
 * - A language picked in the footer (cookie) sends English URLs to their Spanish twin.
 * - First-time visitors whose browser (or, as a tie-breaker, location) says Spanish get the Spanish site.
 * Explicit /es URLs are always served as asked, and crawlers are never redirected.
 */
async function routeSite(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { locale, page } = splitLocale(pathname);

  if (page === '/' && hasSupabaseSession(request)) {
    const { supabase, out } = supabaseFor(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return NextResponse.redirect(new URL('/dashboard', request.url));
    return out.response;
  }

  if (locale !== 'en') return NextResponse.next();

  const saved = request.cookies.get(LANG_COOKIE)?.value;
  const wanted = saved === 'en' || saved === 'es'
    ? saved
    : isBot(request.headers.get('user-agent'))
      ? 'en'
      : detectLocale(request.headers.get('accept-language'), request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry'));

  if (wanted === 'en') return NextResponse.next();
  return NextResponse.redirect(new URL(localePath(wanted, page) + search, request.url));
}

/** Only parents with a Supabase auth cookie pay for a session check on the homepage */
function hasSupabaseSession(request: NextRequest) {
  return request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
}

export const config = {
  matcher: [
    '/dashboard/:path*', '/kids/:path*', '/profile/:path*',
    '/', '/(features|how-it-works|pricing|faq|about|privacy|terms)', '/es/:path*',
  ],
};
