import mongoose from "mongoose";

declare global {
  var __tenantCluster: typeof mongoose | null;
  var __tenantClusterPromise: Promise<typeof mongoose> | null;
}

global.__tenantCluster ??= null;
global.__tenantClusterPromise ??= null;

async function getClusterConnection() {
  if (global.__tenantCluster) return global.__tenantCluster;

  if (!global.__tenantClusterPromise) {
    const uri = process.env.MONGODB_CLUSTER_URI;
    if (!uri) throw new Error("MONGODB_CLUSTER_URI no está definida");
    global.__tenantClusterPromise = mongoose.connect(uri, { bufferCommands: false });
  }

  global.__tenantCluster = await global.__tenantClusterPromise;
  return global.__tenantCluster;
}

export async function connectTenantDB(slug: string) {
  const m = await getClusterConnection();
  return m.connection.useDb(slug, { useCache: true });
}
