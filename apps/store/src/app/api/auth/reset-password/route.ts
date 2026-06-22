// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getModels } from "@/lib/tenant-models";

export async function POST(request: NextRequest) {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();
    const { token, email, newPassword } = await request.json();

    // Validaciones
    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

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
