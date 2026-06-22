import mongoose, { Schema, Document } from "mongoose";
import {
  EstadoReparacion,
  ESTADOS,
} from "@/lib/reparacion-config";

export type { EstadoReparacion };
export { ESTADOS } from "@/lib/reparacion-config";
export { FLOW_ORDER, ESTADO_LABEL, ESTADO_COLOR } from "@/lib/reparacion-config";

export interface IHistorialItem {
  estado: EstadoReparacion;
  fecha: Date;
  nota?: string;
}

export interface IPago {
  estado: "pendiente" | "aprobado" | "rechazado";
  mpId?: string;
  fecha?: Date;
}

export interface IReparacion extends Document {
  codigo: string;
  cliente: {
    nombre: string;
    telefono: string;
    email?: string;
  };
  userId?: mongoose.Types.ObjectId;
  equipo: {
    tipo: "celular" | "laptop" | "pc";
    marca: string;
    modelo: string;
  };
  fallas: string[];
  presupuesto?: number;
  pago?: IPago;
  assignedTo?: mongoose.Types.ObjectId;
  estado: EstadoReparacion;
  historial: IHistorialItem[];
  notaInterna?: string;
  notaCliente?: string;
  tipoAcceso?: "pin" | "patron" | "contrasena" | "sin_acceso";
  codigoAcceso?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HistorialSchema = new Schema(
  {
    estado: { type: String, required: true },
    fecha: { type: Date, default: Date.now },
    nota: { type: String },
  },
  { _id: false },
);

const ReparacionSchema = new Schema(
  {
    codigo: { type: String, unique: true },
    cliente: {
      nombre: { type: String, required: true },
      telefono: { type: String, required: true },
      email: { type: String },
    },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    equipo: {
      tipo: {
        type: String,
        required: true,
        enum: ["celular", "laptop", "pc"],
      },
      marca: { type: String, required: true },
      modelo: { type: String, required: true },
    },
    fallas: [{ type: String }],
    presupuesto: { type: Number },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    pago: {
      estado: { type: String, enum: ["pendiente", "aprobado", "rechazado"] },
      mpId:   { type: String },
      fecha:  { type: Date },
    },
    estado: {
      type: String,
      required: true,
      enum: ESTADOS,
      default: "recibido",
    },
    historial: [HistorialSchema],
    notaInterna:  { type: String },
    notaCliente:  { type: String },
    tipoAcceso:   { type: String, enum: ["pin", "patron", "contrasena", "sin_acceso"] },
    codigoAcceso: { type: String },
  },
  { timestamps: true },
);

ReparacionSchema.index({ userId: 1 });
ReparacionSchema.index({ estado: 1 });
ReparacionSchema.index({ createdAt: -1 });
ReparacionSchema.index({ "cliente.email": 1 });

ReparacionSchema.pre<IReparacion>("save", async function (next) {
  if (this.isNew && !this.codigo) {
    const count = await mongoose
      .model<IReparacion>("Reparacion")
      .countDocuments();
    this.codigo = `CM-${String(count + 1).padStart(4, "0")}`;
    this.historial = [{ estado: "recibido", fecha: new Date() }];
  }
  next();
});

export default mongoose.models.Reparacion ||
  mongoose.model<IReparacion>("Reparacion", ReparacionSchema);
