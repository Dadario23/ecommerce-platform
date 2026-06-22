import mongoose from "mongoose";

import "../models/Category";
import "../models/Product";
import "../models/RepairCatalog";

export function initModels() {
  const modelNames = Object.keys(mongoose.models);
  const requiredModels = ["Category", "Product", "RepairCatalog"];
  const missing = requiredModels.filter((m) => !modelNames.includes(m));
  if (missing.length > 0) throw new Error(`Modelos no registrados: ${missing.join(", ")}`);
  return modelNames;
}

export default initModels;
