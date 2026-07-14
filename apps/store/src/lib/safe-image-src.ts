// Debe reflejar images.remotePatterns de next.config.ts — next/image tira
// abajo toda la página (Runtime Error) si src viene de un host no
// configurado ahí, algo que puede pasar con pedidos u otros datos viejos
// que guardaron una URL de imagen externa suelta.
const ALLOWED_IMAGE_HOSTS = [
  "res.cloudinary.com",
  "lh3.googleusercontent.com",
  "ui-avatars.com",
  "www.perozzi.com.ar",
];

export function safeImageSrc(src: string | undefined | null, fallback: string): string {
  if (!src) return fallback;
  if (src.startsWith("/")) return src;
  try {
    return ALLOWED_IMAGE_HOSTS.includes(new URL(src).hostname) ? src : fallback;
  } catch {
    return fallback;
  }
}
