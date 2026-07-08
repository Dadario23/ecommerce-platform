/**
 * Carga las credenciales de un tenant en su documento Setting.
 *
 * Uso:
 *   node scripts/seed-tenant-secrets.mjs <slug>
 *
 * Pide cada campo por consola (Enter sin valor = conservar el actual).
 * El Setting debe existir (se crea en el onboarding del tenant); este
 * script solo actualiza, nunca crea, para no pisar el seed inicial.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline/promises";
import mongoose from "mongoose";

// ── Cargar .env.local ──────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "../.env.local");

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    if (key?.trim() && !key.startsWith("#")) {
      process.env[key.trim()] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

const CLUSTER_URI = process.env.MONGODB_CLUSTER_URI;
if (!CLUSTER_URI) { console.error("❌ MONGODB_CLUSTER_URI no encontrado"); process.exit(1); }

const slug = process.argv[2];
if (!slug) {
  console.error("❌ Falta el slug del tenant.\n   Uso: node scripts/seed-tenant-secrets.mjs <slug>");
  process.exit(1);
}

const platformClients = process.env.PLATFORM_CLIENTS?.split(",").map((s) => s.trim());
if (platformClients?.length && !platformClients.includes(slug)) {
  console.error(`❌ "${slug}" no está en PLATFORM_CLIENTS (${platformClients.join(", ")})`);
  process.exit(1);
}

// ── Campos a cargar (mismos nombres que el schema Setting de store) ────
const FIELDS = [
  { key: "mpAccessToken",   label: "MP Access Token",        secret: true },
  { key: "mpWebhookSecret", label: "MP Webhook Secret",      secret: true },
  { key: "fromEmail",       label: "Remitente de emails",    secret: false },
  { key: "transferAlias",   label: "Alias de transferencia", secret: false },
  { key: "transferCvu",     label: "CVU de transferencia",   secret: false },
  { key: "whatsappNumber",  label: "WhatsApp de contacto",   secret: false },
];

const mask = (v) => (v ? `${v.slice(0, 4)}…(${v.length})` : "(vacío → fallback env)");

async function seed() {
  console.log(`Conectando al cluster (DB: ${slug})…`);
  await mongoose.connect(CLUSTER_URI);
  const db = mongoose.connection.useDb(slug, { useCache: true });

  const Setting = db.model(
    "Setting",
    new mongoose.Schema({}, { strict: false, timestamps: true })
  );

  const current = await Setting.findOne();
  if (!current) {
    console.error(`❌ No existe Setting en la DB "${slug}". Corré primero el onboarding del tenant.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`✅ Setting encontrado: ${current.get("storeName") || "(sin storeName)"}\n`);
  console.log("Enter sin valor = conservar el actual. Escribí '-' para vaciar un campo (vuelve al fallback env).\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  // Con EOF (Ctrl-D / stdin no interactivo) la pregunta pendiente de readline
  // nunca resuelve: se corre contra 'close' y lo que quede sin responder se conserva.
  const eof = new Promise((resolve) => rl.once("close", () => resolve(null)));
  const updates = {};

  for (const { key, label, secret } of FIELDS) {
    const currentValue = current.get(key) || "";
    const shown = secret ? mask(currentValue) : currentValue || "(vacío → fallback env)";
    const answer = await Promise.race([rl.question(`${label} [actual: ${shown}]: `), eof]);

    if (answer === null) {
      console.log("\n(EOF: los campos restantes se conservan)");
      break;
    }
    if (answer.trim() === "-") updates[key] = "";
    else if (answer.trim()) updates[key] = answer.trim();
  }
  rl.close();

  if (Object.keys(updates).length === 0) {
    console.log("\nSin cambios.");
  } else {
    await Setting.updateOne({ _id: current._id }, { $set: updates });
    console.log(`\n✅ Actualizado Setting de "${slug}":`);
    for (const [key, value] of Object.entries(updates)) {
      const field = FIELDS.find((f) => f.key === key);
      console.log(`   ${key} = ${value === "" ? "(vaciado → fallback env)" : field.secret ? mask(value) : value}`);
    }
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
