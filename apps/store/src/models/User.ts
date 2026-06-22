import mongoose, { Schema, models, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: string;
  image?: string;
  emailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  resetPasswordAttempts: number; // ← Nuevo campo
  lastResetRequest?: Date; // ← Nuevo campo
  phone?: string;
  addresses: IAddress[];
  favorites: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  _id?: mongoose.Types.ObjectId;
  title: string;
  firstName: string;
  lastName: string;
  street: string;
  betweenStreets?: string;
  city: string;
  lat?: number;
  lng?: number;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

const AddressSchema = new Schema({
  title: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  street: { type: String, required: true },
  betweenStreets: { type: String, default: "" },
  lat: { type: Number },
  lng: { type: Number },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: "Argentina" },
  phone: { type: String },
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // vacío si viene de Google
    role: { type: String, default: "user" },
    image: { type: String },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    resetPasswordAttempts: { type: Number, default: 0 }, // ← NUEVO: Contador de intentos
    lastResetRequest: { type: Date }, // ← NUEVO: Último intento
    phone: { type: String },
    addresses: [AddressSchema],
    favorites: { type: [String], default: [] },
  },
  { timestamps: true }
);

UserSchema.index({ resetPasswordToken: 1 });
UserSchema.index({ resetPasswordExpires: 1 }); // ← Útil para limpieza automática

const User = models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
