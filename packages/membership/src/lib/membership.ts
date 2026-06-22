import Membership, { type MembershipStatus, type IMembership } from "../models/Membership";

export async function getMembership(): Promise<IMembership | null> {
  return Membership.findOne().sort({ createdAt: -1 }).lean() as Promise<IMembership | null>;
}

export function isSuspended(status: MembershipStatus): boolean {
  return status === "suspended";
}

export function isGrace(status: MembershipStatus): boolean {
  return status === "grace";
}

export async function registerPayment(): Promise<IMembership> {
  const now = new Date();
  const paidUntil = new Date(now.getFullYear(), now.getMonth() + 1, 0); // fin del mes actual
  const gracePeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 15); // día 15 del próximo mes

  const existing = await Membership.findOne();
  if (existing) {
    existing.status = "active";
    existing.paidUntil = paidUntil;
    existing.gracePeriodEnd = gracePeriodEnd;
    existing.lastPaymentDate = now;
    return existing.save();
  }

  return Membership.create({ status: "active", paidUntil, gracePeriodEnd, lastPaymentDate: now });
}

export async function evaluateMembershipStatus(): Promise<MembershipStatus> {
  const membership = await Membership.findOne();
  if (!membership) return "active"; // sin registro = activo (primera vez)

  const now = new Date();
  const day = now.getDate();

  if (membership.status === "active") {
    // Verificar si entró en período de gracia (nuevo mes sin pago)
    if (now > membership.paidUntil) {
      membership.status = day <= 15 ? "grace" : "suspended";
      await membership.save();
    }
  } else if (membership.status === "grace") {
    if (day > 15 || now > membership.gracePeriodEnd) {
      membership.status = "suspended";
      await membership.save();
    }
  }

  return membership.status;
}
