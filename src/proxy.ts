import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login")
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth")
  const isSuperAdminRoute = req.nextUrl.pathname.startsWith("/superadmin")
  const isPublicRoute =
    req.nextUrl.pathname === "/" ||
    req.nextUrl.pathname.startsWith("/cadastro") ||
    req.nextUrl.pathname.startsWith("/api/cadastro")

  if (isApiAuth) return NextResponse.next()

  if (!isLoggedIn && !isAuthRoute && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (isSuperAdminRoute) {
    const role = req.auth?.user?.role
    if (role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}