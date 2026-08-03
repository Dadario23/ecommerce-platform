import { z } from "zod";
import sanitizeHtml from "sanitize-html";

export const SizesSchema = z
  .array(
    z.object({
      value: z.string().trim().min(1).max(20),
      stock: z.number().int().min(0),
    })
  )
  .max(20)
  .refine(
    (sizes) => new Set(sizes.map((s) => s.value)).size === sizes.length,
    { message: "Talles duplicados" }
  );

export type ProductSize = z.infer<typeof SizesSchema>[number];

export function computeTotalStock(sizes: { stock: number }[]): number {
  return sizes.reduce((sum, s) => sum + s.stock, 0);
}

export const ReelsSchema = z
  .array(
    z.object({
      url: z.string().url(),
      publicId: z.string().trim().min(1),
      thumbnailUrl: z.string().url().optional(),
      duration: z.number().positive().optional(),
      order: z.number().int().min(0),
    })
  )
  .max(8);

export type ProductReel = z.infer<typeof ReelsSchema>[number];

export const DescriptionImagesSchema = z.array(z.string()).max(5);

export const DescriptionTextSchema = z.string().max(20000);

const DESCRIPTION_TEXT_ALLOWED_TAGS = ["p", "strong", "em", "u", "a", "h2", "h3", "ul", "ol", "li", "br"];

export function sanitizeDescriptionText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: DESCRIPTION_TEXT_ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  });
}
