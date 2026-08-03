import { describe, expect, it } from "vitest";
import { SizesSchema, computeTotalStock, DescriptionImagesSchema, sanitizeDescriptionText } from "@/lib/product-extras";

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

describe("DescriptionImagesSchema", () => {
  it("acepta hasta 5 imágenes", () => {
    const urls = Array.from({ length: 5 }, (_, i) => `https://example.com/${i}.jpg`);
    expect(DescriptionImagesSchema.safeParse(urls).success).toBe(true);
  });

  it("rechaza más de 5 imágenes", () => {
    const urls = Array.from({ length: 6 }, (_, i) => `https://example.com/${i}.jpg`);
    expect(DescriptionImagesSchema.safeParse(urls).success).toBe(false);
  });
});

describe("sanitizeDescriptionText", () => {
  it("conserva el formato básico permitido", () => {
    const html = "<p><strong>Hola</strong> <em>mundo</em></p><h2>Título</h2><ul><li>Item</li></ul>";
    expect(sanitizeDescriptionText(html)).toBe(html);
  });

  it("elimina scripts y handlers inline", () => {
    const html = '<p onclick="alert(1)">Hola</p><script>alert(1)</script><img src=x onerror="alert(1)">';
    const out = sanitizeDescriptionText(html);
    expect(out).not.toContain("<script");
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("<img");
  });

  it("bloquea esquemas javascript: en links y fuerza rel/target seguros", () => {
    const safe = sanitizeDescriptionText('<a href="https://example.com">link</a>');
    expect(safe).toContain('target="_blank"');
    expect(safe).toContain("noopener");

    const unsafe = sanitizeDescriptionText('<a href="javascript:alert(1)">link</a>');
    expect(unsafe).not.toContain("javascript:");
  });

  it("elimina tags no permitidos como iframe/form", () => {
    const html = '<iframe src="https://evil.com"></iframe><form action="/x"><input></form><p>ok</p>';
    const out = sanitizeDescriptionText(html);
    expect(out).not.toContain("<iframe");
    expect(out).not.toContain("<form");
    expect(out).toContain("<p>ok</p>");
  });
});
