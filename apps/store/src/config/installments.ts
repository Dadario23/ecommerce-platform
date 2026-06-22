// Central installments config — change sinInteres to true after activating
// "Cuotas sin interés" in the MP panel (Costos y cuotas → Por ofrecer cuotas).
export const INSTALLMENTS = {
  max: 12,
  sinInteres: false,
  plans: [3, 6, 12] as const,
} as const;
