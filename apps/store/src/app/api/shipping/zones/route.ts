import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { getModels } from "@/lib/tenant-models";
import { getShippingZones } from "@/lib/shipping";
import { z } from "zod";

const ZonesSchema = z.object({
  zones: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      localities: z.array(z.string()).default([]),
      zipRanges: z
        .array(z.object({ min: z.number(), max: z.number() }))
        .default([]),
      flex: z.number().nonnegative(),
      standard: z.number().nonnegative(),
    })
  ),
});

// GET — público: devuelve zonas y tarifas
export async function GET() {
  try {
    const { ShippingConfig } = await getModels();
    const zones = await getShippingZones(ShippingConfig);
    return NextResponse.json(zones);
  } catch (error) {
    console.error("[SHIPPING_GET]", error);
    return NextResponse.json({ error: "Error obteniendo tarifas" }, { status: 500 });
  }
}

// PUT — admin: actualiza tarifas
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !isAdmin(session.user?.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const parsed = ZonesSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }
    const { zones } = parsed.data;

    const { ShippingConfig } = await getModels();
    const config = await ShippingConfig.findOneAndUpdate(
      {},
      { zones },
      { new: true, upsert: true },
    );

    return NextResponse.json(config.zones);
  } catch (error) {
    console.error("[SHIPPING_PUT]", error);
    return NextResponse.json({ error: "Error actualizando tarifas" }, { status: 500 });
  }
}
