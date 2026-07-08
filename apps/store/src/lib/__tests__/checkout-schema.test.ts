import { describe, expect, it } from "vitest";
import { CheckoutPayloadSchema } from "@/lib/checkout";
import { computeCouponDiscount } from "@/lib/coupon-discount";

const validAddress = {
  firstName: "Juan",
  lastName: "Pérez",
  street: "Av. Siempre Viva 742",
  city: "CABA",
  state: "Buenos Aires",
  zipCode: "1000",
  country: "AR",
  phone: "1122334455",
};

const validPayload = {
  items: [{ id: "665f1c2e8b3e4a0012345678", quantity: 2 }],
  shippingAddress: validAddress,
};

describe("CheckoutPayloadSchema", () => {
  it("acepta un payload válido y aplica defaults", () => {
    const parsed = CheckoutPayloadSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.items[0].name).toBe("");
      expect(parsed.data.items[0].image).toBe("");
    }
  });

  it("rechaza carrito vacío", () => {
    expect(
      CheckoutPayloadSchema.safeParse({ ...validPayload, items: [] }).success
    ).toBe(false);
  });

  it.each([0, -1, 1.5])("rechaza quantity inválida (%s)", (quantity) => {
    expect(
      CheckoutPayloadSchema.safeParse({
        ...validPayload,
        items: [{ id: "abc", quantity }],
      }).success
    ).toBe(false);
  });

  it("rechaza inyección de operadores en el id (objeto en vez de string)", () => {
    expect(
      CheckoutPayloadSchema.safeParse({
        ...validPayload,
        items: [{ id: { $ne: null }, quantity: 1 }],
      }).success
    ).toBe(false);
  });

  it("rechaza payload sin dirección de envío", () => {
    expect(
      CheckoutPayloadSchema.safeParse({ items: validPayload.items }).success
    ).toBe(false);
  });
});

describe("computeCouponDiscount", () => {
  it("porcentaje: redondea a peso entero", () => {
    expect(computeCouponDiscount({ type: "percentage", value: 10 }, 15355)).toBe(1536); // 1535.5 → redondeo
    expect(computeCouponDiscount({ type: "percentage", value: 50 }, 1000)).toBe(500);
    expect(computeCouponDiscount({ type: "percentage", value: 100 }, 999)).toBe(999);
  });

  it("monto fijo: nunca supera el subtotal (sin totales negativos)", () => {
    expect(computeCouponDiscount({ type: "fixed", value: 500 }, 1000)).toBe(500);
    expect(computeCouponDiscount({ type: "fixed", value: 5000 }, 1000)).toBe(1000);
  });

  it("subtotal cero → descuento cero", () => {
    expect(computeCouponDiscount({ type: "percentage", value: 10 }, 0)).toBe(0);
    expect(computeCouponDiscount({ type: "fixed", value: 500 }, 0)).toBe(0);
  });
});
