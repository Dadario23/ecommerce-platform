"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isRegisteredClient, getTenantDb } from "@/lib/tenants";

const CREDENTIAL_KEYS = [
  "mpAccessToken",
  "mpWebhookSecret",
  "fromEmail",
  "transferAlias",
  "transferCvu",
  "whatsappNumber",
] as const;

export async function createTenantSetting(formData: FormData) {
  const rawSlug = formData.get("slug");
  const slug = typeof rawSlug === "string" ? rawSlug.trim() : "";
  if (slug === "" || slug === "new" || !isRegisteredClient(slug)) {
    redirect("/clients/new?err=slug");
  }

  const rawName = formData.get("storeName");
  const storeName = typeof rawName === "string" ? rawName.trim() : "";
  if (storeName === "" || storeName.length > 100) {
    redirect("/clients/new?err=name");
  }

  const db = await getTenantDb(slug);
  // Guard contra doble submit o carrera: este flujo solo crea, nunca pisa.
  const existing = await db.collection("settings").findOne({}, { projection: { _id: 1 } });
  if (existing) {
    redirect("/clients/new?err=exists");
  }

  const credentials: Record<string, string> = {};
  for (const key of CREDENTIAL_KEYS) {
    const raw = formData.get(key);
    credentials[key] = typeof raw === "string" ? raw.trim() : "";
  }

  const now = new Date();
  // insertOne crudo: los defaults del schema Setting del store van explícitos
  // porque acá no hay modelo mongoose que los aplique.
  await db.collection("settings").insertOne({
    storeName,
    storeEmail: "",
    storePhone: "",
    storeDescription: "",
    shippingCost: 0,
    freeShippingThreshold: 0,
    instagramUrl: "",
    facebookUrl: "",
    whatsappNumber: credentials.whatsappNumber,
    mpAccessToken: credentials.mpAccessToken,
    mpWebhookSecret: credentials.mpWebhookSecret,
    fromEmail: credentials.fromEmail,
    transferAlias: credentials.transferAlias,
    transferCvu: credentials.transferCvu,
    carouselImages: [],
    homeFeaturedMode: "products",
    shippingEnabled: true,
    modules_repairs:   formData.get("modules_repairs") === "on",
    modules_budgets:   formData.get("modules_budgets") === "on",
    modules_shipping:  formData.get("modules_shipping") === "on",
    modules_coupons:   formData.get("modules_coupons") === "on",
    modules_analytics: formData.get("modules_analytics") === "on",
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/clients/new");
  revalidatePath("/");
  redirect(`/clients/new?created=${slug}`);
}
