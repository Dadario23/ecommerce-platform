import { describe, expect, it } from "vitest";
import { SizesSchema, computeTotalStock } from "@/lib/product-extras";

describe("SizesSchema", () => {
  it("acepta talles válidos", () => {
    const result = SizesSchema.safeParse([
      { value: "S", stock: 3 },
      { value: "M", stock: 0 },
    ]);
    expect(result.success).toBe(true);
  });

  it("recorta espacios en el value", () => {
    const result = SizesSchema.safeParse([{ value: " M ", stock: 1 }]);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data[0].value).toBe("M");
  });

  it.each([
    [[{ value: "M", stock: 1 }, { value: "M", stock: 2 }], "talles duplicados"],
    [[{ value: "", stock: 1 }], "value vacío"],
    [[{ value: "M", stock: -1 }], "stock negativo"],
    [[{ value: "M", stock: 1.5 }], "stock no entero"],
    [[{ value: "X".repeat(21), stock: 1 }], "value demasiado largo"],
    [Array.from({ length: 21 }, (_, i) => ({ value: `T${i}`, stock: 1 })), "más de 20 talles"],
    [[{ value: { $ne: null }, stock: 1 }], "inyección de operadores"],
  ])("rechaza %j (%s)", (input, _desc) => {
    expect(SizesSchema.safeParse(input).success).toBe(false);
  });
});

describe("computeTotalStock", () => {
  it("suma el stock de todos los talles", () => {
    expect(computeTotalStock([{ stock: 2 }, { stock: 3 }, { stock: 0 }])).toBe(5);
  });

  it("array vacío es 0", () => {
    expect(computeTotalStock([])).toBe(0);
  });
});
