import mongoose, { Schema, Document } from "mongoose";

export interface IDescriptionBlock {
  type: "text" | "heading" | "image";
  content?: string;
  imageUrl?: string;
  caption?: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  images: string[];
  category: { _id: string; name: string } | string;
  brand?: string;
  stock?: number;
  sku?: string;
  condition?: "new" | "used";
  shippingTypes?: Array<"flex" | "standard" | "national">;
  freeShipping?: boolean;
  isActive?: boolean;
  avgRating?: number;
  reviewCount?: number;
  unitsSold?: number;
  homeDelivery?: boolean;
  featured?: boolean;
  descriptionBlocks?: IDescriptionBlock[];
}

const ProductSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    compareAtPrice: { type: Number },
    description: { type: String, required: true },

    images: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length > 0;
        },
        message: "At least one image is required",
      },
    },

    category: { type: Schema.Types.ObjectId, ref: "Category" },
    brand: { type: String },
    sku: { type: String },
    stock: { type: Number, default: 0 },
    condition:     { type: String, enum: ["new", "used"], default: "new" },
    shippingTypes:  { type: [String], default: ["flex", "standard"] },
    freeShipping:   { type: Boolean, default: false },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    unitsSold: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    homeDelivery: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    descriptionBlocks: {
      type: [new Schema(
        {
          type:     { type: String, enum: ["text", "heading", "image"], required: true },
          content:  { type: String },
          imageUrl: { type: String },
          caption:  { type: String },
        },
        { _id: false }
      )],
      default: [],
    },
  },
  { timestamps: true },
);

// Text index for full-text search with relevance scoring
ProductSchema.index(
  { name: "text", description: "text", brand: "text" },
  { weights: { name: 10, brand: 5, description: 1 }, name: "product_text_idx" }
);

ProductSchema.pre<IProduct>("validate", function (next) {
  this.slug = this.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  next();
});

// In development, clear the cached model so schema changes take effect on hot reload
if (process.env.NODE_ENV !== "production" && mongoose.models["Product"]) {
  delete (mongoose.models as Record<string, unknown>)["Product"];
}

export default (mongoose.models["Product"] as mongoose.Model<IProduct>) ||
  mongoose.model<IProduct>("Product", ProductSchema);
