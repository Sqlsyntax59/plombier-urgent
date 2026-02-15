import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Routes publiques (pas besoin d'auth)
  const publicRoutes = [
    "/",
    "/login",
    "/auth",
    "/artisan/inscription",
    "/artisan/login",
    "/artisan/lead-accepted",
    "/artisan/lead-error",
    "/demande",
    "/cgv",
    "/api/n8n",
    "/api/leads/accept", // Redirect vers /api/lead/accept
    "/api/lead/accept", // Route canonique accept (token JWT)
  ];

  // Routes artisan protégées (dashboard)
  const artisanProtectedPaths = [
    "/artisan/dashboard",
    "/artisan/leads",
    "/artisan/credits",
    "/artisan/profil",
  ];

  const isPublicRoute = publicRoutes.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(route + "/")
  );

  // Page profil artisan public /artisan/[slug] (ex: /artisan/jean-paris-a3b8)
  const isArtisanPublicProfile =
    request.nextUrl.pathname.startsWith("/artisan/") &&
    !artisanProtectedPaths.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    ) &&
    !isPublicRoute;

  if (!user && !isPublicRoute && !isArtisanPublicProfile) {
    // no user, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
