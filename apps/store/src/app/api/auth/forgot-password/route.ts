// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { getModels } from "@/lib/tenant-models";
import { getClientIp, hitRateLimit } from "@/lib/rate-limit";
import { getBaseUrl } from "@/lib/base-url";
import { sendPasswordResetEmail } from "@/lib/email";

const ForgotSchema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rl = await hitRateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000);
    if (rl.limited) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const parsed = ForgotSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    const { email } = parsed.data;

    const { User } = await getModels();

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      // Por seguridad, no revelar si el email existe o no
      return NextResponse.json({
        message: "Si el email existe, recibirás un enlace de recuperación",
      });
    }

    // Verificar intentos recientes (prevenir spam)
    const now = new Date();
    if (user.lastResetRequest && user.resetPasswordAttempts >= 3) {
      const lastAttempt = new Date(user.lastResetRequest);
      const hoursDiff =
        (now.getTime() - lastAttempt.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 1) {
        return NextResponse.json(
          { error: "Demasiados intentos. Espera 1 hora." },
          { status: 429 }
        );
      }
    }

    // Generar token seguro
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Guardar token en usuario (1 hora de expiración)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    user.resetPasswordAttempts += 1;
    user.lastResetRequest = now;
    await user.save();

    // Crear URL de reset
    const resetUrl = `${await getBaseUrl()}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // 🎯 MODO DESARROLLO: Mostrar en consola y devolver en response
    if (process.env.NODE_ENV === "development") {
      console.log(" ");
      console.log(
        "🔐 ======= ENLACE DE RECUPERACIÓN (MODO DESARROLLO) ======="
      );
      console.log("📧 Destinatario:", email);
      console.log("🔗 Enlace:", resetUrl);
      console.log("⏰ Expira:", new Date(Date.now() + 60 * 60 * 1000));
      console.log("📝 Token:", resetToken);
      console.log("======================================================");
      console.log(" ");

      return NextResponse.json({
        message: "Enlace de recuperación generado (ver consola del servidor)",
        resetUrl: resetUrl, // ← Para que el frontend también lo vea
        debug: true,
      });
    }

    // 🎯 MODO PRODUCCIÓN
    await sendPasswordResetEmail(email, resetUrl);

    return NextResponse.json({
      message: "Si el email existe, recibirás un enlace de recuperación",
    });
  } catch (error) {
    console.error("Error en forgot password:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
