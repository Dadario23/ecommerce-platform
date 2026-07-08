import { getModels } from "@/lib/tenant-models";
import type { IMembership, MembershipStatus } from "@/models/Membership";

type MembershipDoc = Pick<IMembership, "status" | "paidUntil" | "gracePeriodEnd"> | null;

// Estado efectivo calculado en lectura — el store nunca escribe en
// memberships (admin-hub es el dueño del dato). Reglas: sin registro =
// activo; con paidUntil vencido corre la gracia hasta gracePeriodEnd
// (o hasta el día 15 del mes si el doc no lo tiene); después, suspendido.
export function evaluateMembership(m: MembershipDoc, now = new Date()): MembershipStatus {
  if (!m) return "active";
  if (m.status === "suspended") return "suspended";
  if (m.status === "active" && m.paidUntil && now <= m.paidUntil) return "active";

  const inGrace = m.gracePeriodEnd ? now <= m.gracePeriodEnd : now.getDate() <= 15;
  return inGrace ? "grace" : "suspended";
}

// Ante error de lectura la tienda sigue operando: nunca cortar el
// servicio de un tenant por una falla nuestra.
export async function getEffectiveMembershipStatus(): Promise<MembershipStatus> {
  try {
    const { Membership } = await getModels();
    const m = await Membership.findOne()
      .sort({ createdAt: -1 })
      .lean<IMembership | null>();
    return evaluateMembership(m);
  } catch {
    return "active";
  }
}
