/**
 * One-time migration: populate slug field for existing categories.
 * Run with: npx tsx scripts/migrate-category-slugs.ts
 */
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Load .env.local without dotenv dependency
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const [k, ...v] = line.split("=");
    if (k?.trim() && v.length) process.env[k.trim()] = v.join("=").trim();
  }
}

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[\s-]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const db = mongoose.connection.db!;
  const categories = await db.collection("categories").find({ slug: { $exists: false } }).toArray();

  console.log(`Found ${categories.length} categories without slug`);

  for (const cat of categories) {
    const slug = slugify(cat.name);
    await db.collection("categories").updateOne(
      { _id: cat._id },
      { $set: { slug } },
    );
    console.log(`  ${cat.name} → ${slug}`);
  }

  console.log("Done.");
  await mongoose.disconnect();
}

run().catch(console.error);
