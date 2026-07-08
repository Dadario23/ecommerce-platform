import { NextRequest, NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { getMpClient } from "@/lib/mercadopago";
import { z } from "zod";
import { getModels } from "@/lib/tenant-models";
import { getBaseUrl } from "@/lib/base-url";

const PAYABLE_ESTADOS = ["diagnosticado", "en_reparacion", "esperando_repuestos", "listo"];

const PreferenceSchema = z.object({ codigo: z.string().trim().min(1) });

export async function POST(req: NextRequest) {
  try {
    const parsed = PreferenceSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 });
    }
    const { codigo } = parsed.data;

    const { Reparacion } = await getModels();

    const rep = await Reparacion.findOne({ codigo: codigo.toUpperCase() }).lean<{
      _id: { toString(): string };
      codigo: string;
      equipo: { tipo: string; marca: string; modelo: string };
      presupuesto?: number;
      pago?: { estado: string };
      estado: string;
    }>();

    if (!rep) {
      return NextResponse.json({ error: "Reparación no encontrada" }, { status: 404 });
    }
    if (!rep.presupuesto || rep.presupuesto <= 0) {
      return NextResponse.json({ error: "La reparación no tiene presupuesto asignado" }, { status: 400 });
    }
    if (!PAYABLE_ESTADOS.includes(rep.estado)) {
      return NextResponse.json({ error: "La reparación no está en estado pagable" }, { status: 400 });
    }
    if (rep.pago?.estado === "aprobado") {
      return NextResponse.json({ error: "Esta reparación ya fue pagada" }, { status: 400 });
    }

    const baseUrl = await getBaseUrl();
    const isProd  = process.env.NODE_ENV === "production";
    const returnUrl = `${baseUrl}/soporte-tecnico/seguimiento/${rep.codigo}`;

    const equipoLabel = [rep.equipo.marca, rep.equipo.modelo].filter(Boolean).join(" ") || rep.equipo.tipo;

    const preference = new Preference(await getMpClient());
    const response = await preference.create({
      body: {
        items: [
          {
            id: rep._id.toString(),
            title: `Reparación ${equipoLabel}`,
            quantity: 1,
            unit_price: rep.presupuesto,
            currency_id: "ARS",
          },
        ],
        external_reference: `REP-${rep._id.toString()}`,
        back_urls: {
          success: `${returnUrl}?pago=ok`,
          failure: `${returnUrl}?pago=error`,
          pending: `${returnUrl}?pago=pendiente`,
        },
        ...(isProd && { auto_return: "approved" }),
        notification_url: `${baseUrl}/api/payments/webhook`,
      },
    });

    // Marcar como pago iniciado
    await Reparacion.findByIdAndUpdate(rep._id, {
      pago: { estado: "pendiente" },
    });

    return NextResponse.json({ initPoint: response.init_point });
  } catch (error) {
    console.error("[REPARACION_PREFERENCE]", error);
    return NextResponse.json({ error: "Error creando preferencia de pago" }, { status: 500 });
  }
}
