// app/api/user/delete-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { getModels } from "@/lib/tenant-models";
import { verifyPassword } from "@/lib/auth-helpers";

const DeleteAccountSchema = z.object({
  password: z.string().optional(),
  confirm: z.literal(true),
});

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const parsed = DeleteAccountSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Confirmá la eliminación de la cuenta" }, { status: 400 });
    }
    const { password } = parsed.data;

    const { Cart, User } = await getModels();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Cuentas con contraseña (no Google) deben confirmarla antes de borrar.
    if (user.password) {
      if (!password) {
        return NextResponse.json(
          { error: "Ingresá tu contraseña para confirmar" },
          { status: 400 }
        );
      }
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 400 });
      }
    }

    // Pedidos, reparaciones y reseñas se conservan como registro histórico:
    // ya guardan su propio email/nombre y no dependen del User para mostrarse.
    await Cart.deleteOne({ userId: user._id.toString() });
    await User.deleteOne({ _id: user._id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando cuenta:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
