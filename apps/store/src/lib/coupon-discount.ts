// Fórmula única del descuento de cupón (checkout y validación comparten esto).
// Redondeo a peso entero en porcentaje; el monto fijo nunca supera el subtotal.
export function computeCouponDiscount(
  coupon: { type: string; value: number },
  subtotal: number
): number {
  return coupon.type === "percentage"
    ? Math.round((subtotal * coupon.value) / 100)
    : Math.min(coupon.value, subtotal);
}
