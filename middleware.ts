import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Next.js Edge Middleware for Role-Based Access Control (RBAC)
 * Enforces server-level authentication and authorization before page rendering or API execution.
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // For API routes, if no token, respond with 401 JSON instead of redirecting to login page
    if (pathname.startsWith("/api/")) {
      if (!token) {
        return NextResponse.json(
          { error: "Unauthorized: Authentication required" },
          { status: 401 }
        );
      }
    }

    // Admin routes require ADMIN role
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      if (token?.role !== "ADMIN") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Forbidden: Admin role required" },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL("/login?error=Unauthorized", req.url));
      }
    }

    // Upload API requires staff or admin role
    if (pathname.startsWith("/api/upload")) {
      if (
        token?.role !== "ADMIN" &&
        token?.role !== "BRANCH_MANAGER" &&
        token?.role !== "WAREHOUSE_STAFF"
      ) {
        return NextResponse.json(
          { error: "Forbidden: Staff or Admin privileges required" },
          { status: 403 }
        );
      }
    }

    // Branch portal routes require BRANCH_MANAGER or ADMIN role
    if (pathname.startsWith("/branch")) {
      if (token?.role !== "ADMIN" && token?.role !== "BRANCH_MANAGER") {
        return NextResponse.redirect(new URL("/login?error=Unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Let API routes through to the middleware function so it returns 401 JSON instead of HTML redirect
        if (req.nextUrl.pathname.startsWith("/api/")) {
          return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/branch/:path*",
    "/account/:path*",
    "/api/admin/:path*",
    "/api/upload",
    "/api/upload/:path*",
  ],
};
