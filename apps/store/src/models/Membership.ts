import mongoose, { Schema, Document, models } from "mongoose";

export type MembershipStatus = "active" | "grace" | "suspended";

// La colección "memberships" la escribe admin-hub (activar/suspender/pagos).
// El store solo la lee. paidUntil/gracePeriodEnd son opcionales porque el
// upsert de suspensión de admin-hub puede crear el doc sin esos campos.
export interface IMembership extends Document {
  status: MembershipStatus;
  paidUntil?: Date;
  gracePeriodEnd?: Date;
  lastPaymentDate?: Date | null;
  lastNotifiedAt?: Date | null;
  monthlyPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema(
  {
    status: { type: String, enum: ["active", "grace", "suspended"], default: "active" },
    paidUntil: { type: Date },
    gracePeriodEnd: { type: Date },
    lastPaymentDate: { type: Date, default: null },
    lastNotifiedAt: { type: Date, default: null },
    monthlyPrice: { type: Number },
  },
  { timestamps: true }
);

export default models.Membership ||
  mongoose.model<IMembership>("Membership", MembershipSchema);
