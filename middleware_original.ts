// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // ❌ ยังไม่ได้ล็อกอิน → ส่งไปหน้า login
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // ✅ Role-based redirect หลัง login
    if (pathname === "/auth/login") {
      if (token.role === "USER") return NextResponse.redirect(new URL("/", req.url));
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // ✅ Role-based access สำหรับ admin route
    if (pathname.startsWith("/admin") && token.role === "USER") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // ✅ เช็ค profile ไม่ครบ → redirect ไป complete-profile
    const isIncomplete =
      !token?.dateOfBirth ||
      !token?.gender ||
      !token?.phone ||
      !token?.branchId ||
      !token?.occupation;

    if (isIncomplete && pathname !== "/complete-profile") {
      return NextResponse.redirect(new URL("/complete-profile", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/auth/login",
    "/profile/:path*",
    "/((?!api|_next|static|favicon.ico).*)",
  ],
};
