import type mongoose from "mongoose";

// Mismo criterio que evaluateMembership en el store: pago cubre hasta fin del
// mes actual, con gracia hasta el 15 del mes siguiente.
export async function activateMembership(db: mongoose.Connection): Promise<void> {
  const now = new Date();
  const paidUntil = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const gracePeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  await db.collection("memberships").updateOne(
    {},
    {
      $set: { status: "active", paidUntil, gracePeriodEnd, lastPaymentDate: now, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );
}

export async function suspendMembership(db: mongoose.Connection): Promise<void> {
  const now = new Date();
  await db.collection("memberships").updateOne(
    {},
    { $set: { status: "suspended", updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
}

export async function setMonthlyPrice(db: mongoose.Connection, price: number): Promise<void> {
  const now = new Date();
  await db.collection("memberships").updateOne(
    {},
    {
      $set: { monthlyPrice: price, updatedAt: now },
      // Un doc creado solo por cargar el precio no puede quedar sin status:
      // el dashboard lo usa como clave de STATUS_CONFIG.
      $setOnInsert: { status: "active", createdAt: now },
    },
    { upsert: true }
  );
}
