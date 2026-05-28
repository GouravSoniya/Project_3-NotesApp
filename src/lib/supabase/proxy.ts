import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase session refresh helper — called from root proxy.ts.
 *
 * What this does (and why each step matters):
 *
 * 1. Creates a Supabase client that can read/write cookies on the request/response.
 * 2. Calls getClaims() to refresh the JWT if it's expired.
 *    - Without this, Server Components get a stale/null session on every page load
 *      after the access token expires (~1 hour by default).
 * 3. Passes the refreshed token back to the browser via response cookies.
 * 4. Redirects unauthenticated users away from protected routes.
 * 5. Redirects authenticated users away from auth routes (login/signup).
 *
 * CRITICAL: Always return `supabaseResponse`, never a new NextResponse.next().
 * The response object carries the updated Set-Cookie headers. Creating a new
 * response drops those cookies and breaks the session for Server Components.
 */
export async function updateSession(request: NextRequest) {
  // Start with a passthrough response — we'll mutate it as needed.
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write refreshed cookies back onto the *request* so downstream
          // Server Components see the updated token in the same request cycle.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // Re-create the response so it picks up the mutated request cookies,
          // then also write the cookies onto the *response* so the browser
          // receives the updated tokens via Set-Cookie.
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not write any logic between createServerClient and getClaims.
  // A subtle bug: if you await anything else first, the session refresh can race
  // and you'll get inconsistent auth state between the proxy and Server Components.

  // getClaims() silently refreshes the access token if expired.
  // It does NOT throw on unauthenticated — it returns null claims.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ─── Route Protection ────────────────────────────────────────────────────────

  // Auth routes: redirect already-authenticated users away (e.g. /login, /signup)
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/auth"); // covers /auth/callback, /auth/confirm, etc.

  // Protected routes: require authentication
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/api/protected"); // protect internal API routes too

  if (user && isAuthRoute) {
    // Authenticated user hitting a login/signup page → send to dashboard
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  if (!user && isProtectedRoute) {
    // Unauthenticated user hitting a protected page → send to login
    // Preserve the original URL so we can redirect back after login
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // ─── Pass Through ────────────────────────────────────────────────────────────
  // Must return supabaseResponse (not a new NextResponse) to preserve
  // the refreshed session cookies.
  return supabaseResponse;
}