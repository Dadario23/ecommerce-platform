/**
 * Migración: Google Sheets → MongoDB RepairCatalog
 *
 * Uso:
 *   node scripts/migrate-repair-catalog.mjs
 *
 * Lee los tabs de Google Sheets, agrupa modelos con sus precios
 * y los inserta en la colección RepairCatalog de MongoDB.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
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

const MONGO_URI = process.env.MONGODB_URI;
const SHEET_ID = process.env.GOOGLE_SHEETS_ID ?? process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID;

if (!MONGO_URI) { console.error("❌ MONGODB_URI no encontrado"); process.exit(1); }
if (!SHEET_ID) { console.error("❌ GOOGLE_SHEETS_ID no encontrado"); process.exit(1); }

// ── Tabs por tipo de equipo ────────────────────────────────────────────
const DEVICE_TABS = {
  celular: { models: "Modelos",      prices: "Precios" },
  laptop:  { models: "ModelosLaptop", prices: "PreciosLaptop" },
  pc:      { models: "ModelosPC",     prices: "PreciosPC" },
};

// ── Schema mínimo (sin importar el modelo de Next.js) ─────────────────
const RepairCatalogSchema = new mongoose.Schema({
  deviceType: String,
  brand: String,
  model: String,
  active: { type: Boolean, default: true },
  repairs: [{ type: { type: String }, price: { type: Number, default: 0 }, _id: false }],
}, { timestamps: true });
RepairCatalogSchema.index({ deviceType: 1, brand: 1, model: 1 }, { unique: true });
const RepairCatalog = mongoose.models.RepairCatalog || mongoose.model("RepairCatalog", RepairCatalogSchema);

// ── Fetch JSON de Google Sheets via opensheet proxy ───────────────────
async function fetchSheet(sheetName) {
  const url = `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error HTTP ${res.status} al obtener "${sheetName}"`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(`Respuesta inesperada en "${sheetName}"`);
  return data;
}

// ── Migración ─────────────────────────────────────────────────────────
async function migrate() {
  console.log("Conectando a MongoDB…");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Conectado\n");

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const [deviceType, tabs] of Object.entries(DEVICE_TABS)) {
    console.log(`── ${deviceType.toUpperCase()} ──`);

    let modelsRows, pricesRows;
    try {
      [modelsRows, pricesRows] = await Promise.all([
        fetchSheet(tabs.models),
        fetchSheet(tabs.prices),
      ]);
    } catch (err) {
      console.warn(`  ⚠️  No se pudo leer: ${err.message}`);
      continue;
    }

    console.log(`  Modelos: ${modelsRows.length} filas | Precios: ${pricesRows.length} filas`);

    // Filtrar modelos activos
    const models = modelsRows
      .filter((r) => {
        const a = r["Activo"]?.trim().toLowerCase();
        return r["Marca"] && r["Modelo"] && (!a || a === "sí" || a === "si");
      })
      .map((r) => ({ brand: r["Marca"].trim(), model: r["Modelo"].trim() }));

    // Agrupar precios por (brand, model)
    const priceMap = new Map();
    for (const row of pricesRows) {
      if (!row["Marca"] || !row["Modelo"] || !row["TipoReparacion"]) continue;
      const key = `${row["Marca"].trim()}||${row["Modelo"].trim()}`;
      const list = priceMap.get(key) ?? [];
      const rawPrice = row["PrecioFinal"]?.replace(/[^0-9]/g, "");
      list.push({ type: row["TipoReparacion"].trim(), price: rawPrice ? parseInt(rawPrice, 10) : 0 });
      priceMap.set(key, list);
    }

    for (const { brand, model } of models) {
      const key = `${brand}||${model}`;
      const repairs = priceMap.get(key) ?? [];

      try {
        await RepairCatalog.findOneAndUpdate(
          { deviceType, brand, model },
          { $setOnInsert: { deviceType, brand, model, active: true, repairs } },
          { upsert: true, new: false }
        );
        console.log(`  ✅ ${brand} ${model} (${repairs.length} reparaciones)`);
        totalInserted++;
      } catch (err) {
        if (err.code === 11000) {
          console.log(`  ⏭️  Ya existe: ${brand} ${model}`);
          totalSkipped++;
        } else {
          console.error(`  ❌ Error en ${brand} ${model}:`, err.message);
        }
      }
    }

    console.log();
  }

  console.log(`Migración completa: ${totalInserted} insertados, ${totalSkipped} ya existían.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
