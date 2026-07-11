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
    // autoIndex/autoCreate: false — los modelos del store se registran en la
    // conexión global; sin esto, mongoose crea colecciones e índices contra la
    // DB default del cluster ("test") y la llena de colecciones vacías.
    // Se re-habilitan por tenant en connectTenantDB.
    global.__tenantClusterPromise = mongoose.connect(uri, {
      bufferCommands: false,
      autoIndex: false,
      autoCreate: false,
    });
  }

  global.__tenantCluster = await global.__tenantClusterPromise;
  return global.__tenantCluster;
}

export async function connectTenantDB(slug: string) {
  const m = await getClusterConnection();
  const conn = m.connection.useDb(slug, { useCache: true });
  // useDb hereda el config de la base — acá sí queremos colecciones e índices
  conn.config.autoIndex = true;
  conn.config.autoCreate = true;
  return conn;
}
