import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // ❌ ยังไม่ได้ล็อกอิน → แยกฝั่ง
    if (!token) {
      if (pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/admin-login", req.url));
      }
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // ✅ ROLE: USER
    if (token.role === "USER") {
      // ❌ ไม่ให้เข้า /admin/*
      if (pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/", req.url));
      }

      // ✅ ตรวจโปรไฟล์ไม่ครบ → บังคับให้ไป /complete-profile
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
    }

    // ✅ ROLE: ADMIN / STAFF / MARKETING / CRM → ผ่านทุกหน้า
    const role = token.role as string | undefined;
    if (role && ["ADMIN", "ADMINMARKETING", "CRMMANAGEMENT", "STAFF"].includes(role)) {
      return NextResponse.next();
    }

    // ❌ ไม่มี role หรือ role แปลก
    return NextResponse.redirect(new URL("/auth/login", req.url));
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // ต้องมี token ถึงจะเข้าได้
    },
  }
);

// ✅ เส้นทางที่ middleware จะจับ (แต่ admin ไม่โดน block อยู่ดี)
export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/((?!api|_next|static|favicon.ico|admin-login).*)",
  ],
};
