import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Schema } from "mongoose";
import type { Model, Types } from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  RESERVATION_TTL_MS,
  releaseExpiredReservations,
  releaseStock,
  reserveStock,
} from "@/lib/stock";
import type { IOrder } from "@/models/Order";
import type { IProduct } from "@/models/Product";

// Schemas mínimos con los campos que usa lib/stock.ts, bindeados a una
// conexión propia contra mongod en memoria (mismo binde que hace getModels
// con la conexión del tenant). Sin timestamps para poder fijar createdAt.
let mongod: MongoMemoryServer;
let conn: mongoose.Connection;
let Product: Model<IProduct>;
let Order: Model<IOrder>;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  conn = await mongoose.createConnection(mongod.getUri()).asPromise();
  Product = conn.model(
    "Product",
    new Schema({
      name: String,
      stock: Number,
      isActive: Boolean,
      sizes: { type: [{ _id: false, value: String, stock: Number }], default: undefined },
    })
  ) as unknown as Model<IProduct>;
  Order = conn.model(
    "Order",
    new Schema({
      payment: { method: String, status: String },
      stockReserved: Boolean,
      status: String,
      createdAt: Date,
      items: [{
        productId: Schema.Types.ObjectId,
        name: String,
        quantity: Number,
        variant: { type: { _id: false, name: String, value: String }, default: undefined },
      }],
    })
  ) as unknown as Model<IOrder>;
});

afterAll(async () => {
  await conn.close();
  await mongod.stop();
});

beforeEach(async () => {
  await Product.deleteMany({});
  await Order.deleteMany({});
});

const line = (productId: Types.ObjectId, name: string, quantity: number, size?: string) => ({
  productId,
  name,
  quantity,
  ...(size ? { size } : {}),
});

describe("reserveStock", () => {
  it("descuenta stock cuando alcanza", async () => {
    const p = await Product.create({ name: "Mouse", stock: 5, isActive: true });

    const result = await reserveStock(Product, [line(p._id as Types.ObjectId, "Mouse", 2)]);

    expect(result.ok).toBe(true);
    expect((await Product.findById(p._id))!.stock).toBe(3);
  });

  it("si una línea no alcanza, revierte las anteriores y reporta la fallida", async () => {
    const p1 = await Product.create({ name: "Mouse", stock: 5, isActive: true });
    const p2 = await Product.create({ name: "Teclado", stock: 1, isActive: true });

    const result = await reserveStock(Product, [
      line(p1._id as Types.ObjectId, "Mouse", 2),
      line(p2._id as Types.ObjectId, "Teclado", 3),
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failed.name).toBe("Teclado");
    expect((await Product.findById(p1._id))!.stock).toBe(5); // rollback
    expect((await Product.findById(p2._id))!.stock).toBe(1);
  });

  it("rechaza productos desactivados aunque tengan stock", async () => {
    const p = await Product.create({ name: "Mouse", stock: 5, isActive: false });

    const result = await reserveStock(Product, [line(p._id as Types.ObjectId, "Mouse", 1)]);

    expect(result.ok).toBe(false);
    expect((await Product.findById(p._id))!.stock).toBe(5);
  });

  it("dos compras concurrentes de la última unidad: exactamente una gana", async () => {
    const p = await Product.create({ name: "Última unidad", stock: 1, isActive: true });
    const items = [line(p._id as Types.ObjectId, "Última unidad", 1)];

    const [a, b] = await Promise.all([
      reserveStock(Product, items),
      reserveStock(Product, items),
    ]);

    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    expect((await Product.findById(p._id))!.stock).toBe(0);
  });
});

describe("reserveStock con talles", () => {
  const shirt = () =>
    Product.create({
      name: "Remera",
      stock: 5,
      isActive: true,
      sizes: [{ value: "S", stock: 2 }, { value: "M", stock: 3 }],
    });

  it("descuenta el talle Y el total derivado en la misma operación", async () => {
    const p = await shirt();

    const result = await reserveStock(Product, [line(p._id as Types.ObjectId, "Remera", 2, "M")]);

    expect(result.ok).toBe(true);
    const after = (await Product.findById(p._id))!;
    expect(after.stock).toBe(3);
    expect(after.sizes!.find((s) => s.value === "M")!.stock).toBe(1);
    expect(after.sizes!.find((s) => s.value === "S")!.stock).toBe(2);
  });

  it("falla si el talle no tiene stock aunque otro talle sí tenga", async () => {
    const p = await shirt();

    const result = await reserveStock(Product, [line(p._id as Types.ObjectId, "Remera", 3, "S")]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failed.size).toBe("S");
    const after = (await Product.findById(p._id))!;
    expect(after.stock).toBe(5);
    expect(after.sizes!.find((s) => s.value === "S")!.stock).toBe(2);
  });

  it("falla con un talle inexistente", async () => {
    const p = await shirt();

    const result = await reserveStock(Product, [line(p._id as Types.ObjectId, "Remera", 1, "XL")]);

    expect(result.ok).toBe(false);
    expect((await Product.findById(p._id))!.stock).toBe(5);
  });

  it("dos compras concurrentes de la última unidad de un talle: exactamente una gana", async () => {
    const p = await Product.create({
      name: "Remera",
      stock: 4,
      isActive: true,
      sizes: [{ value: "S", stock: 1 }, { value: "M", stock: 3 }],
    });
    const items = [line(p._id as Types.ObjectId, "Remera", 1, "S")];

    const [a, b] = await Promise.all([
      reserveStock(Product, items),
      reserveStock(Product, items),
    ]);

    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);
    const after = (await Product.findById(p._id))!;
    expect(after.stock).toBe(3);
    expect(after.sizes!.find((s) => s.value === "S")!.stock).toBe(0);
  });

  it("rollback mixto: línea simple reservada se revierte si falla la línea con talle", async () => {
    const simple = await Product.create({ name: "Gorra", stock: 5, isActive: true });
    const sized = await shirt();

    const result = await reserveStock(Product, [
      line(simple._id as Types.ObjectId, "Gorra", 2),
      line(sized._id as Types.ObjectId, "Remera", 9, "M"),
    ]);

    expect(result.ok).toBe(false);
    expect((await Product.findById(simple._id))!.stock).toBe(5); // rollback
    expect((await Product.findById(sized._id))!.stock).toBe(5);
  });
});

describe("releaseStock", () => {
  it("devuelve las cantidades reservadas", async () => {
    const p = await Product.create({ name: "Mouse", stock: 3, isActive: true });

    await releaseStock(Product, [line(p._id as Types.ObjectId, "Mouse", 2)]);

    expect((await Product.findById(p._id))!.stock).toBe(5);
  });

  it("con talle devuelve al talle Y al total", async () => {
    const p = await Product.create({
      name: "Remera",
      stock: 3,
      isActive: true,
      sizes: [{ value: "S", stock: 1 }, { value: "M", stock: 2 }],
    });

    await releaseStock(Product, [line(p._id as Types.ObjectId, "Remera", 2, "M")]);

    const after = (await Product.findById(p._id))!;
    expect(after.stock).toBe(5);
    expect(after.sizes!.find((s) => s.value === "M")!.stock).toBe(4);
  });

  it("talle inexistente (borrado por el admin): no-op, no toca el total", async () => {
    const p = await Product.create({
      name: "Remera",
      stock: 3,
      isActive: true,
      sizes: [{ value: "S", stock: 3 }],
    });

    await releaseStock(Product, [line(p._id as Types.ObjectId, "Remera", 2, "M")]);

    const after = (await Product.findById(p._id))!;
    expect(after.stock).toBe(3);
    expect(after.sizes!.find((s) => s.value === "S")!.stock).toBe(3);
  });
});

describe("releaseExpiredReservations", () => {
  const staleDate = () => new Date(Date.now() - RESERVATION_TTL_MS - 60_000);

  it("libera stock y cancela órdenes MP pendientes vencidas; no toca las frescas", async () => {
    const p = await Product.create({ name: "Mouse", stock: 0, isActive: true });
    const itemLine = line(p._id as Types.ObjectId, "Mouse", 2);

    const stale = await Order.create({
      payment: { method: "mercadopago", status: "pending" },
      stockReserved: true,
      status: "pending",
      createdAt: staleDate(),
      items: [itemLine],
    });
    const fresh = await Order.create({
      payment: { method: "mercadopago", status: "pending" },
      stockReserved: true,
      status: "pending",
      createdAt: new Date(),
      items: [itemLine],
    });

    await releaseExpiredReservations(Order, Product);

    expect((await Product.findById(p._id))!.stock).toBe(2); // solo la vencida
    const staleAfter = (await Order.findById(stale._id))!;
    expect(staleAfter.stockReserved).toBe(false);
    expect(staleAfter.status).toBe("cancelled");
    expect(staleAfter.payment.status).toBe("failed");
    expect((await Order.findById(fresh._id))!.stockReserved).toBe(true);
  });

  it("ignora órdenes vencidas que no son MP-pendiente o no tienen reserva", async () => {
    const p = await Product.create({ name: "Mouse", stock: 0, isActive: true });
    const itemLine = line(p._id as Types.ObjectId, "Mouse", 1);

    await Order.create({
      payment: { method: "mercadopago", status: "completed" },
      stockReserved: true,
      status: "confirmed",
      createdAt: staleDate(),
      items: [itemLine],
    });
    await Order.create({
      payment: { method: "transferencia", status: "pending" },
      stockReserved: true,
      status: "pending",
      createdAt: staleDate(),
      items: [itemLine],
    });

    await releaseExpiredReservations(Order, Product);

    expect((await Product.findById(p._id))!.stock).toBe(0);
  });

  it("devuelve el stock al talle correcto en órdenes con variante", async () => {
    const p = await Product.create({
      name: "Remera",
      stock: 0,
      isActive: true,
      sizes: [{ value: "S", stock: 0 }, { value: "M", stock: 0 }],
    });
    await Order.create({
      payment: { method: "mercadopago", status: "pending" },
      stockReserved: true,
      status: "pending",
      createdAt: staleDate(),
      items: [{
        productId: p._id as Types.ObjectId,
        name: "Remera",
        quantity: 2,
        variant: { name: "Talle", value: "M" },
      }],
    });

    await releaseExpiredReservations(Order, Product);

    const after = (await Product.findById(p._id))!;
    expect(after.stock).toBe(2);
    expect(after.sizes!.find((s) => s.value === "M")!.stock).toBe(2);
    expect(after.sizes!.find((s) => s.value === "S")!.stock).toBe(0);
  });

  it("es segura ante doble ejecución (claim atómico): no duplica la devolución", async () => {
    const p = await Product.create({ name: "Mouse", stock: 0, isActive: true });
    await Order.create({
      payment: { method: "mercadopago", status: "pending" },
      stockReserved: true,
      status: "pending",
      createdAt: staleDate(),
      items: [line(p._id as Types.ObjectId, "Mouse", 2)],
    });

    await Promise.all([
      releaseExpiredReservations(Order, Product),
      releaseExpiredReservations(Order, Product),
    ]);

    expect((await Product.findById(p._id))!.stock).toBe(2);
  });
});
