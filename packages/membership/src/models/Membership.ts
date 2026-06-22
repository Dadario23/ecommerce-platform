import mongoose, { Schema, Document } from "mongoose";

export type MembershipStatus = "active" | "grace" | "suspended";

export interface IMembership extends Document {
  status: MembershipStatus;
  paidUntil: Date;
  gracePeriodEnd: Date;
  lastPaymentDate: Date | null;
  lastNotifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    status: { type: String, enum: ["active", "grace", "suspended"], default: "active" },
    paidUntil: { type: Date, required: true },
    gracePeriodEnd: { type: Date, required: true },
    lastPaymentDate: { type: Date, default: null },
    lastNotifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Membership ||
  mongoose.model<IMembership>("Membership", MembershipSchema);
