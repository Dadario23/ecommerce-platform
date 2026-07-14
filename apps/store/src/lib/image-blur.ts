// Placeholder borroso para next/image a partir de una URL de Cloudinary.
// blurDataURL solo se usa como background-image con blur en CSS, así que
// una URL remota (en vez de un data: URI) funciona igual.
export function cloudinaryBlurDataUrl(src: string): string | undefined {
  if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) {
    return undefined;
  }
  return src.replace("/upload/", "/upload/w_16,e_blur:1000,q_1/");
}
