import mongoose from "mongoose";

export const REGISTERED_CLIENTS = (process.env.PLATFORM_CLIENTS ?? "bitm-cel")
  .split(",")
  .map((s) => s.trim());

export function isRegisteredClient(slug: string): boolean {
  return REGISTERED_CLIENTS.includes(slug);
}

// La promesa se cachea para que llamadas concurrentes (Promise.all sobre
// varios tenants) no disparen mongoose.connect() en paralelo.
let clusterPromise: Promise<typeof mongoose> | null = null;

export async function getTenantDb(slug: string): Promise<mongoose.Connection> {
  if (mongoose.connection.readyState !== 1) {
    clusterPromise ??= mongoose.connect(process.env.MONGODB_CLUSTER_URI!).catch((err) => {
      clusterPromise = null;
      throw err;
    });
    await clusterPromise;
  }
  return mongoose.connection.useDb(slug, { useCache: true });
}
