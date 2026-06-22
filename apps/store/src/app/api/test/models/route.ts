// Solo disponible en desarrollo
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getModels } from "@/lib/tenant-models";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    // 1. Conectar a la base de datos
    const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

    // 2. Obtener nombres de modelos registrados
    const modelNames = Object.keys({ Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User });
    // 3. Verificar conexión y modelos de forma más detallada
    const connectionState = mongoose.connection.readyState;
    const connectionStates = [
      "disconnected",
      "connected",
      "connecting",
      "disconnecting",
    ];

    // 4. Intentar contar documentos en cada modelo (para verificar que funcionan)
    const modelStats: any = {};

    for (const modelName of modelNames) {
      try {
        const Model = mongoose.models[modelName];
        const count = await Model.countDocuments();
        modelStats[modelName] = {
          registered: true,
          documentCount: count,
          canQuery: true,
        };
      } catch (error) {
        modelStats[modelName] = {
          registered: true,
          documentCount: 0,
          canQuery: false,
          error: (error as Error).message,
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: "Test de modelos completado",
      database: {
        connection: connectionStates[connectionState],
        readyState: connectionState,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
      },
      models: {
        count: modelNames.length,
        names: modelNames,
        details: modelStats,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error en test de modelos:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        stack:
          process.env.NODE_ENV === "development"
            ? (error as Error).stack
            : undefined,
      },
      { status: 500 }
    );
  }
}
