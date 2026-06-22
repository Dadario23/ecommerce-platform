// Shared constants and types — safe to import in client components (no mongoose)

export type EstadoReparacion =
  | "recibido"
  | "diagnosticado"
  | "en_reparacion"
  | "esperando_repuestos"
  | "listo"
  | "entregado"
  | "cancelado"
  | "sin_reparacion";

export const ESTADOS: EstadoReparacion[] = [
  "recibido",
  "diagnosticado",
  "en_reparacion",
  "esperando_repuestos",
  "listo",
  "entregado",
  "cancelado",
  "sin_reparacion",
];

export const FLOW_ORDER: EstadoReparacion[] = [
  "recibido",
  "diagnosticado",
  "en_reparacion",
  "esperando_repuestos",
  "listo",
  "entregado",
];

export const ESTADO_LABEL: Record<EstadoReparacion, string> = {
  recibido: "Recibido",
  diagnosticado: "Diagnosticado",
  en_reparacion: "En reparación",
  esperando_repuestos: "Esperando repuestos",
  listo: "Listo para retirar",
  entregado: "Entregado",
  cancelado: "Cancelado",
  sin_reparacion: "Sin reparación posible",
};

export const ESTADO_COLOR: Record<EstadoReparacion, string> = {
  recibido: "bg-slate-100 text-slate-700",
  diagnosticado: "bg-blue-100 text-blue-700",
  en_reparacion: "bg-amber-100 text-amber-700",
  esperando_repuestos: "bg-orange-100 text-orange-700",
  listo: "bg-green-100 text-green-700",
  entregado: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-red-100 text-red-700",
  sin_reparacion: "bg-red-100 text-red-700",
};
