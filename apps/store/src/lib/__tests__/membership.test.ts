import { describe, expect, it } from "vitest";
import { evaluateMembership } from "@/lib/membership";

// Fechas fijas a mediodía LOCAL (sin Z): el criterio del "día 15" usa
// getDate() local y un ISO date-only se parsearía como UTC (corre un día en UTC-3)
const d = (iso: string) => new Date(`${iso}T12:00:00`);

describe("evaluateMembership", () => {
  it("sin documento de membresía → active (default benevolente)", () => {
    expect(evaluateMembership(null, d("2026-07-08"))).toBe("active");
  });

  it("status suspended manda, sin importar las fechas", () => {
    expect(
      evaluateMembership(
        { status: "suspended", paidUntil: d("2099-01-01"), gracePeriodEnd: d("2099-01-15") },
        d("2026-07-08")
      )
    ).toBe("suspended");
  });

  it("active con paidUntil vigente → active", () => {
    expect(
      evaluateMembership(
        { status: "active", paidUntil: d("2026-07-31"), gracePeriodEnd: d("2026-08-15") },
        d("2026-07-08")
      )
    ).toBe("active");
  });

  it("el último día pago cuenta como vigente (límite inclusive)", () => {
    expect(
      evaluateMembership(
        { status: "active", paidUntil: d("2026-07-31"), gracePeriodEnd: d("2026-08-15") },
        d("2026-07-31")
      )
    ).toBe("active");
  });

  it("vencido dentro de gracePeriodEnd → grace", () => {
    expect(
      evaluateMembership(
        { status: "active", paidUntil: d("2026-06-30"), gracePeriodEnd: d("2026-07-15") },
        d("2026-07-10")
      )
    ).toBe("grace");
  });

  it("vencido pasado gracePeriodEnd → suspended", () => {
    expect(
      evaluateMembership(
        { status: "active", paidUntil: d("2026-06-30"), gracePeriodEnd: d("2026-07-15") },
        d("2026-07-16")
      )
    ).toBe("suspended");
  });

  it("sin gracePeriodEnd: hasta el día 15 del mes → grace", () => {
    expect(
      evaluateMembership(
        { status: "active", paidUntil: d("2026-06-30") },
        d("2026-07-15")
      )
    ).toBe("grace");
  });

  it("sin gracePeriodEnd: después del día 15 → suspended", () => {
    expect(
      evaluateMembership(
        { status: "active", paidUntil: d("2026-06-30") },
        d("2026-07-16")
      )
    ).toBe("suspended");
  });

  it("active sin paidUntil cae al criterio de gracia (doc incompleto)", () => {
    expect(
      evaluateMembership({ status: "active" }, d("2026-07-20"))
    ).toBe("suspended");
    expect(
      evaluateMembership({ status: "active" }, d("2026-07-05"))
    ).toBe("grace");
  });
});
