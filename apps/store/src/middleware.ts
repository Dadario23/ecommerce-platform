import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { resolveTenant } from "@repo/tenant/edge";

export async function middleware(req: NextRequest) {
  // 1. Resolver tenant desde el hostname
  const host = req.headers.get("host") ?? "";
  const slug = resolveTenant(host);

  if (!slug) {
    return new NextResponse("Tenant no encontrado", { status: 404 });
  }

  // 2. Propagar slug a routes y Server Components via header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant-slug", slug);

  // 3. Control de acceso a rutas protegidas
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/soporte-tecnico/admin");

  if (!isProtectedRoute) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = token.role as string | undefined;
  const adminOnly = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const allowedRoles = adminOnly
    ? ["admin", "superadmin"]
    : ["admin", "superadmin", "receptionist", "technician"];

  if (!role || !allowedRoles.includes(role)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
