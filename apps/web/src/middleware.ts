import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { auth } from "~/auth/server";

export const runtime = "nodejs";

export async function middleware(request: NextRequest) {
  // Get the pathname
  const pathname = request.nextUrl.pathname;

  // Check if the route is a dashboard route
  if (pathname.startsWith("/dashboard")) {
    try {
      // Check for valid session
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      // If no session, redirect to landing page
      if (!session) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // If there's an error checking session, redirect to landing page
      console.error("Session check error:", error);
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Check if the route is an admin route
  if (pathname.startsWith("/admin")) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      // If no session, redirect to landing page
      if (!session) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }

      // Check if user is admin
      if (!(session.user as any).isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error("Admin session check error:", error);
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
