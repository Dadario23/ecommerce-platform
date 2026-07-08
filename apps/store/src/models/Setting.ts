import mongoose, { Schema, Document, models } from "mongoose";

export interface ISetting extends Document {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeDescription: string;
  shippingCost: number;
  freeShippingThreshold: number;
  instagramUrl: string;
  facebookUrl: string;
  whatsappNumber: string;
  // Credenciales/identidad por tenant (fallback a env vars si están vacías)
  mpAccessToken: string;
  mpWebhookSecret: string;
  fromEmail: string;
  transferAlias: string;
  transferCvu: string;
  carouselImages: string[];
  homeFeaturedMode: "products" | "categories";
  shippingEnabled: boolean;
  modules_repairs: boolean;
  modules_budgets: boolean;
  modules_shipping: boolean;
  modules_coupons: boolean;
  modules_analytics: boolean;
  updatedAt: Date;
}

const SettingSchema = new Schema(
  {
    storeName:             { type: String, default: "" },
    storeEmail:            { type: String, default: "" },
    storePhone:            { type: String, default: "" },
    storeDescription:      { type: String, default: "" },
    shippingCost:          { type: Number, default: 0 },
    freeShippingThreshold: { type: Number, default: 0 },
    instagramUrl:          { type: String, default: "" },
    facebookUrl:           { type: String, default: "" },
    whatsappNumber:        { type: String, default: "" },
    mpAccessToken:         { type: String, default: "" },
    mpWebhookSecret:       { type: String, default: "" },
    fromEmail:             { type: String, default: "" },
    transferAlias:         { type: String, default: "" },
    transferCvu:           { type: String, default: "" },
    carouselImages:        { type: [String], default: [] },
    homeFeaturedMode:      { type: String, enum: ["products", "categories"], default: "products" },
    shippingEnabled:       { type: Boolean, default: true },
    modules_repairs:       { type: Boolean, default: false },
    modules_budgets:       { type: Boolean, default: false },
    modules_shipping:      { type: Boolean, default: true },
    modules_coupons:       { type: Boolean, default: true },
    modules_analytics:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.Setting || mongoose.model<ISetting>("Setting", SettingSchema);
