import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModels } from "@/lib/tenant-models";

interface IpApiResponse {
  status: string;
  city?: string;
  regionName?: string;
}

type Zone = { id: string; name: string; localities: string[]; zipRanges?: { min: number; max: number }[]; flex: number; standard: number };

function normalizeLocality(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function matchZoneByZip(zipCode: string, zones: Zone[]) {
  const cp = parseInt(zipCode.replace(/\D/g, ""), 10);
  if (isNaN(cp)) return null;
  return zones.find((z) => z.zipRanges?.some((r) => cp >= r.min && cp <= r.max)) ?? null;
}

function matchZoneByCity(city: string, zones: Zone[]) {
  const normalized = normalizeLocality(city);
  return zones.find((z) =>
    z.localities.some((l) => normalizeLocality(l) === normalized),
  ) ?? null;
}

async function detectZoneByIp(ip: string, zones: Zone[]) {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168") || ip.startsWith("10.")) {
    return null; // localhost / LAN — no detectar
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName&lang=es`, {
      next: { revalidate: 0 },
    });
    const data: IpApiResponse = await res.json();
    if (data.status !== "success" || !data.city) return null;
    return matchZoneByCity(data.city, zones);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

    const configDoc = await ShippingConfig.findOne().lean();
    const zones = configDoc?.zones ?? [];

    const session = await getServerSession(authOptions);

    // 1. Usuario logueado → usar dirección del perfil
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email })
        .select("addresses")
        .lean<{ addresses: { city: string; zipCode: string; isDefault: boolean }[] }>();

      const addresses = user?.addresses ?? [];
      // Usar solo el domicilio principal (o el primero si ninguno es default)
      const selected = addresses.find((a) => a.isDefault) ?? addresses[0];

      if (selected) {
        // 1. Intentar por CP (más confiable)
        if (selected.zipCode) {
          const zone = matchZoneByZip(selected.zipCode, zones);
          if (zone) return NextResponse.json({ zone, source: "profile" });
        }
        // 2. Fallback por nombre de ciudad
        if (selected.city) {
          const zone = matchZoneByCity(selected.city, zones);
          if (zone) return NextResponse.json({ zone, source: "profile" });
        }
      }

      // Tiene sesión pero el domicilio principal no matchea zona → pedir que confirme
      return NextResponse.json({ zone: null, source: "no-address" });
    }

    // 2. No logueado → intentar por IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const zone = await detectZoneByIp(ip, zones);

    return NextResponse.json({ zone, source: zone ? "ip" : "unknown" });
  } catch (error) {
    console.error("[MY_ZONE]", error);
    return NextResponse.json({ zone: null, source: "error" });
  }
}
