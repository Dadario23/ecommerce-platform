// models/Order.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: {
    name: string;
    value: string;
  };
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  customerEmail: string;
  items: IOrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  couponCode?: string;
  total: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  payment: {
    method: string;
    status: "pending" | "completed" | "failed" | "refunded";
    transactionId?: string;
    paymentDate?: Date;
  };
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  shippingMethod?: string;
  trackingNumber?: string;
  notes?: string;
  mpPaymentLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: {
    name: String,
    value: String,
  },
});

const OrderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true, // ← QUITA required: true, el middleware lo genera
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    couponCode: { type: String },
    total: { type: Number, required: true },
    shippingAddress: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true, default: "Argentina" },
      phone: { type: String },
    },
    billingAddress: {
      firstName: { type: String },
      lastName: { type: String },
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String, default: "Argentina" },
      phone: { type: String },
    },
    payment: {
      method: {
        type: String, // ← Cambié a String en lugar de enum
        required: true,
      },
      status: {
        type: String,
        required: true,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      transactionId: { type: String },
      paymentDate: { type: Date },
    },
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    shippingMethod:  { type: String },
    trackingNumber:  { type: String },
    notes:           { type: String },
    mpPaymentLink:   { type: String },
  },
  { timestamps: true }
);

// Índices para búsquedas eficientes
OrderSchema.index({ userId: 1 });

OrderSchema.index({ "payment.status": 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

// Middleware para generar número de orden único
OrderSchema.pre<IOrder>("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model<IOrder>("Order").countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${(count + 1)
      .toString()
      .padStart(4, "0")}`;
  }
  next();
});

export default mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema);
