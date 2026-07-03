// app/api/auth/verify-reset-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import crypto from "crypto";
import { z } from "zod";
import { getModels } from "@/lib/tenant-models";
import { getClientIp, hitRateLimit } from "@/lib/rate-limit";

const VerifySchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rl = await hitRateLimit(`verify-reset:${ip}`, 20, 60 * 60 * 1000);
    if (rl.limited) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const parsed = VerifySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Token y email son requeridos" },
        { status: 400 }
      );
    }
    const { token, email } = parsed.data;

    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Enlace inválido o expirado" },
        { status: 400 }
      );
    }

    // Verificar token
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    if (user.resetPasswordToken !== resetTokenHash) {
      return NextResponse.json(
        { error: "Enlace inválido o expirado" },
        { status: 400 }
      );
    }

    // Verificar expiración
    if (
      !user.resetPasswordExpires ||
      Date.now() > user.resetPasswordExpires.getTime()
    ) {
      return NextResponse.json(
        { error: "El enlace ha expirado" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Token válido",
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
