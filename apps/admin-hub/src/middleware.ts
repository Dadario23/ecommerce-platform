import { NextRequest, NextResponse } from "next/server";

// Basic auth para todas las páginas (las rutas /api validan su propio bearer).
// En dev local no se exige — el panel sigue siendo localhost:3100 directo.

function unauthorized() {
  return new NextResponse("Autenticación requerida", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="admin-hub"' },
  });
}

// Comparación vía SHA-256 (edge runtime no tiene timingSafeEqual);
// comparar digests hace inviable un timing attack sobre el secreto.
async function digestsMatch(a: string, b: string) {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const ua = new Uint8Array(da);
  const ub = new Uint8Array(db);
  return ua.every((v, i) => v === ub[i]);
}

export async function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === "development") return NextResponse.next();

  const secret = process.env.ADMIN_HUB_SECRET;
  if (!secret) return unauthorized();

  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Basic ")) return unauthorized();

  let pass: string;
  try {
    pass = atob(auth.slice(6)).split(":").slice(1).join(":");
  } catch {
    return unauthorized();
  }

  return (await digestsMatch(pass, secret)) ? NextResponse.next() : unauthorized();
}

export const config = {
  matcher: ["/((?!api/|_next/|favicon.ico).*)"],
};
