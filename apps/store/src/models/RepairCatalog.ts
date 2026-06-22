import mongoose, { Schema } from "mongoose";

export interface IRepairItem {
  type: string;
  price: number; // 0 = "a consultar"
}

export interface IRepairCatalog {
  deviceType: "celular" | "laptop" | "pc";
  brand: string;
  model: string;
  active: boolean;
  repairs: IRepairItem[];
}

const RepairCatalogSchema = new Schema<IRepairCatalog>(
  {
    deviceType: {
      type: String,
      enum: ["celular", "laptop", "pc"],
      required: true,
    },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    active: { type: Boolean, default: true },
    repairs: [
      {
        type: { type: String, required: true },
        price: { type: Number, default: 0 },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

RepairCatalogSchema.index({ deviceType: 1, brand: 1, model: 1 }, { unique: true });
RepairCatalogSchema.index({ deviceType: 1, active: 1 });

export default mongoose.models.RepairCatalog ||
  mongoose.model<IRepairCatalog>("RepairCatalog", RepairCatalogSchema);
