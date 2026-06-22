// models/Cart.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ICartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface ICart extends Document {
  userId: string; // Esto coincide con session.user.id
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const CartSchema = new Schema(
  {
    userId: {
      type: String, // ← Mantenemos como String para coincidir con session.user.id
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
  }
);

// Crear índice para userId para búsquedas más rápidas
//CartSchema.index({ userId: 1 });

export default mongoose.models.Cart ||
  mongoose.model<ICart>("Cart", CartSchema);
