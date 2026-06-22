import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Reparacion, { EstadoReparacion } from "@/models/Reparacion";
import { isAdmin, isStaff } from "@/lib/roles";
import { notifyRepairStatusChange } from "@/lib/notify";
import { getModels } from "@/lib/tenant-models";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!isStaff(session?.user?.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const rep = await Reparacion.findById(id).populate("assignedTo", "name email").lean<any>();
  if (!rep) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Technician can only access their assigned repairs
  if (
    session!.user.role === "technician" &&
    String(rep.assignedTo?._id ?? rep.assignedTo) !== session!.user.id
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return NextResponse.json(rep);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!isStaff(session?.user?.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { id } = await params;
  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
  const body = await request.json();
  const role = session!.user.role;

  const rep = await Reparacion.findById(id);
  if (!rep) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Technician: only their assigned repairs, only estado + notaInterna
  if (role === "technician") {
    if (String(rep.assignedTo) !== session!.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const { estado, nota, notaInterna } = body;
    const prevEstado = rep.estado;
    if (estado && estado !== prevEstado) {
      rep.historial.push({ estado: estado as EstadoReparacion, fecha: new Date(), nota: nota || undefined });
      rep.estado = estado;
    }
    if (notaInterna !== undefined) rep.notaInterna = notaInterna;
    await rep.save();
    if (estado && estado !== prevEstado) {
      await notifyRepairStatusChange(rep, estado);
    }
    return NextResponse.json(rep);
  }

  // Receptionist + admin: full edit
  const { estado, nota, notaInterna, notaCliente, presupuesto, cliente, equipo, fallas, tipoAcceso, codigoAcceso } = body;

  const prevEstado = rep.estado;
  if (estado && estado !== prevEstado) {
    rep.historial.push({ estado: estado as EstadoReparacion, fecha: new Date(), nota: nota || undefined });
    rep.estado = estado;
  }
  if (notaInterna  !== undefined) rep.notaInterna  = notaInterna;
  if (notaCliente  !== undefined) rep.notaCliente  = notaCliente;
  if (presupuesto  !== undefined) rep.presupuesto  = presupuesto === "" ? undefined : Number(presupuesto);
  if (cliente) Object.assign(rep.cliente, cliente);
  if (equipo)  Object.assign(rep.equipo,  equipo);
  if (fallas)       rep.fallas = fallas;
  if (tipoAcceso   !== undefined) rep.tipoAcceso   = tipoAcceso   || undefined;
  if (codigoAcceso !== undefined) rep.codigoAcceso = codigoAcceso || undefined;

  // Admin only: assign technician
  if (isAdmin(role) && "assignedTo" in body) {
    rep.assignedTo = body.assignedTo || undefined;
  }

  await rep.save();
  if (estado && estado !== prevEstado) {
    await notifyRepairStatusChange(rep, estado);
  }
  return NextResponse.json(rep);
}
