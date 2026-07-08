import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getModels } from "@/lib/tenant-models";
import { getClientIp, hitRateLimit } from "@/lib/rate-limit";

const RegisterSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const rl = await hitRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (rl.limited) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo más tarde." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const parsed = RegisterSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const { name, email, password } = parsed.data;

    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    return NextResponse.json(
      {
        message: "Usuario registrado correctamente",
        userId: newUser._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error en /api/register:", error);
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}
