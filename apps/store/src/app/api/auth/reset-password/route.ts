// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { getModels } from "@/lib/tenant-models";
import { getClientIp, hitRateLimit } from "@/lib/rate-limit";
import { passwordSchema, PASSWORD_POLICY_MESSAGE } from "@/lib/password-policy";

const ResetSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  newPassword: passwordSchema,
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rl = await hitRateLimit(`reset:${ip}`, 10, 60 * 60 * 1000);
    if (rl.limited) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const parsed = ResetSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: PASSWORD_POLICY_MESSAGE },
        { status: 400 }
      );
    }
    const { token, email, newPassword } = parsed.data;

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

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Actualizar usuario
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordAttempts = 0;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Contraseña restablecida correctamente",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
