import mongoose from "mongoose";

// Importar todos los modelos
import "@/models/Category";
import "@/models/Product";
import "@/models/RepairCatalog";

/**
 * Inicializa y verifica que todos los modelos estén registrados
 */
export function initModels() {
  const modelNames = Object.keys(mongoose.models);

  const requiredModels = ["Category", "Product", "RepairCatalog"];
  const missingModels = requiredModels.filter(
    (model) => !modelNames.includes(model)
  );

  if (missingModels.length > 0) {
    console.error("❌ Modelos faltantes:", missingModels);
    throw new Error(`Modelos no registrados: ${missingModels.join(", ")}`);
  }

  return modelNames;
}

export default initModels;
