import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Recuperer session utilisateur
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ============================================
  // Routes publiques (pas besoin d'auth)
  // ============================================
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
  ];

  // Routes API publiques
  const publicApiRoutes = [
    "/api/n8n",
    "/api/leads/accept",
    "/api/leads/assign",
    "/api/lead/accept",
    "/api/lead/accept-simple",
    "/api/lead/cancel",
    "/api/notifications/prepare",
    "/api/notifications/send-whatsapp",
    "/api/webhooks",
    "/api/cron",
  ];

  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const isPublicApiRoute = publicApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Profil public artisan /artisan/[slug]
  const isArtisanPublicProfile =
    pathname.startsWith("/artisan/") &&
    !pathname.startsWith("/artisan/dashboard") &&
    !pathname.startsWith("/artisan/leads") &&
    !pathname.startsWith("/artisan/profil") &&
    !pathname.startsWith("/artisan/credits") &&
    !pathname.startsWith("/artisan/inscription") &&
    !pathname.startsWith("/artisan/login");

  // Routes publiques → laisser passer
  if (isPublicRoute || isPublicApiRoute || isArtisanPublicProfile) {
    return supabaseResponse;
  }

  // ============================================
  // Routes protegees: verifier authentification
  // ============================================
  if (!user) {
    // Determiner la page de login appropriee
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (pathname.startsWith("/artisan")) {
      return NextResponse.redirect(new URL("/artisan/login", request.url));
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // ============================================
  // Verifier le role pour les routes protegees
  // ============================================
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role;

  // Routes ADMIN: requiert role admin
  if (pathname.startsWith("/admin")) {
    if (userRole !== "admin") {
      console.warn(`Access denied: user ${user.id} (${userRole}) tried to access ${pathname}`);
      // Rediriger vers la page appropriee selon le role
      if (userRole === "artisan") {
        return NextResponse.redirect(new URL("/artisan/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Routes ARTISAN dashboard: requiert role artisan ou admin
  const artisanProtectedPaths = [
    "/artisan/dashboard",
    "/artisan/leads",
    "/artisan/profil",
    "/artisan/credits",
  ];

  const isArtisanProtectedRoute = artisanProtectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (isArtisanProtectedRoute) {
    if (userRole !== "artisan" && userRole !== "admin") {
      console.warn(`Access denied: user ${user.id} (${userRole}) tried to access ${pathname}`);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
