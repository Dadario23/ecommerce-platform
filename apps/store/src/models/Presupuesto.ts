import mongoose, { Schema, Document } from "mongoose";

export interface IPresupuestoItem {
  repair: string;
  price: string; // numeric string or "a consultar"
}

export interface IPresupuesto extends Document {
  userId?: mongoose.Types.ObjectId;
  cliente: {
    nombre: string;
    email?: string;
  };
  equipo: {
    tipo: "celular" | "laptop" | "pc";
    marca: string;
    modelo: string;
  };
  items: IPresupuestoItem[];
  totalEstimado?: number;
  esGenerico: boolean;
  estado: "pendiente" | "convertido" | "descartado";
  reparacionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PresupuestoSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    cliente: {
      nombre: { type: String, required: true },
      email: { type: String },
    },
    equipo: {
      tipo: { type: String, required: true, enum: ["celular", "laptop", "pc"] },
      marca: { type: String, default: "" },
      modelo: { type: String, default: "" },
    },
    items: [
      {
        repair: { type: String, required: true },
        price: { type: String, required: true },
        _id: false,
      },
    ],
    totalEstimado: { type: Number },
    esGenerico: { type: Boolean, default: false },
    estado: {
      type: String,
      enum: ["pendiente", "convertido", "descartado"],
      default: "pendiente",
    },
    reparacionId: { type: Schema.Types.ObjectId, ref: "Reparacion" },
  },
  { timestamps: true },
);

PresupuestoSchema.index({ estado: 1 });
PresupuestoSchema.index({ userId: 1 });
PresupuestoSchema.index({ createdAt: -1 });

export default mongoose.models.Presupuesto ||
  mongoose.model<IPresupuesto>("Presupuesto", PresupuestoSchema);
