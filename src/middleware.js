import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role?.toLowerCase();

    const rolePrefixes = ["admin", "staff", "student"];
    const matchedPrefix = rolePrefixes.find((p) => pathname.startsWith(`/${p}`));

    if (matchedPrefix && role !== matchedPrefix) {
      return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/student/:path*"],
};
