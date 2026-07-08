import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // geolocation queda permitida: la tienda usa mapas/geocodificación y podría
  // sumar un botón "usar mi ubicación". Solo se bloquean cámara y micrófono.
  { key: "Permissions-Policy", value: "camera=(), microphone=()" },
  // CSP acotada: bloquea clickjacking, plugins e inyección de <base> sin
  // restringir scripts/estilos/imágenes (evita romper Next, MP, Cloudinary, etc.)
  { key: "Content-Security-Policy", value: "object-src 'none'; base-uri 'self'; frame-ancestors 'self'" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ["@repo/tenant"],

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  images: {
    remotePatterns: [
      // Infraestructura de la plataforma
      { protocol: "https", hostname: "res.cloudinary.com" },      // uploads
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // avatares Google OAuth
      { protocol: "https", hostname: "ui-avatars.com" },          // avatares generados
      // Referenciado en el código (CatalogBanner)
      { protocol: "https", hostname: "www.perozzi.com.ar" },
    ],
  },
};

export default nextConfig;
