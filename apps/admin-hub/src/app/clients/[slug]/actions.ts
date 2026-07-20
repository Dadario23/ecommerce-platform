"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isRegisteredClient, getTenantDb } from "@/lib/tenants";
import { activateMembership, suspendMembership, setMonthlyPrice } from "@/lib/memberships";

// El slug llega bindeado desde el server component pero viaja al cliente y
// vuelve: es input no confiable y cada action lo revalida.
function assertClient(slug: string) {
  if (!isRegisteredClient(slug)) throw new Error("Cliente no registrado");
}

export async function saveModules(slug: string, formData: FormData) {
  assertClient(slug);
  const db = await getTenantDb(slug);
  await db.collection("settings").updateOne(
    {},
    {
      $set: {
        modules_repairs:   formData.get("modules_repairs") === "on",
        modules_budgets:   formData.get("modules_budgets") === "on",
        modules_shipping:  formData.get("modules_shipping") === "on",
        modules_coupons:   formData.get("modules_coupons") === "on",
        modules_analytics: formData.get("modules_analytics") === "on",
        modules_sizes:             formData.get("modules_sizes") === "on",
        modules_sizeGuide:         formData.get("modules_sizeGuide") === "on",
        modules_quantityDiscounts: formData.get("modules_quantityDiscounts") === "on",
        modules_reels:             formData.get("modules_reels") === "on",
        modules_faq:               formData.get("modules_faq") === "on",
      },
    },
    { upsert: true }
  );
  revalidatePath(`/clients/${slug}`);
  redirect(`/clients/${slug}?saved=modules`);
}

const CREDENTIAL_KEYS = [
  "mpAccessToken",
  "mpWebhookSecret",
  "fromEmail",
  "transferAlias",
  "transferCvu",
  "whatsappNumber",
] as const;

// Misma semántica que scripts/seed-tenant-secrets.mjs: vacío = conservar,
// "-" = vaciar (vuelve al fallback de env vars). Solo actualiza, nunca crea.
export async function saveCredentials(slug: string, formData: FormData) {
  assertClient(slug);
  const db = await getTenantDb(slug);
  const existing = await db.collection("settings").findOne({}, { projection: { _id: 1 } });
  if (!existing) {
    redirect(`/clients/${slug}?err=no-setting`);
  }

  const updates: Record<string, string> = {};
  for (const key of CREDENTIAL_KEYS) {
    const raw = formData.get(key);
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (value === "") continue;
    updates[key] = value === "-" ? "" : value;
  }

  if (Object.keys(updates).length > 0) {
    await db.collection("settings").updateOne({ _id: existing._id }, { $set: updates });
  }
  revalidatePath(`/clients/${slug}`);
  redirect(`/clients/${slug}?saved=creds`);
}

export async function saveMonthlyPrice(slug: string, formData: FormData) {
  assertClient(slug);
  const raw = formData.get("monthlyPrice");
  const value = typeof raw === "string" ? raw.trim() : "";
  const price = Number(value);
  if (value === "" || !Number.isFinite(price) || price < 0 || price > 10_000_000) {
    redirect(`/clients/${slug}?err=price`);
  }

  const db = await getTenantDb(slug);
  await setMonthlyPrice(db, Math.round(price));
  revalidatePath(`/clients/${slug}`);
  revalidatePath("/");
  redirect(`/clients/${slug}?saved=price`);
}

export async function registerPayment(slug: string) {
  assertClient(slug);
  const db = await getTenantDb(slug);
  await activateMembership(db);
  revalidatePath(`/clients/${slug}`);
  revalidatePath("/");
  redirect(`/clients/${slug}?saved=payment`);
}

export async function suspendClient(slug: string) {
  assertClient(slug);
  const db = await getTenantDb(slug);
  await suspendMembership(db);
  revalidatePath(`/clients/${slug}`);
  revalidatePath("/");
  redirect(`/clients/${slug}?saved=suspend`);
}
