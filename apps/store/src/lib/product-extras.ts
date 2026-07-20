import { z } from "zod";

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
