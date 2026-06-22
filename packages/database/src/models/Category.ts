// src/models/Category.ts
import { Schema, model, models } from "mongoose";
import { slugify } from "@/lib/slugify";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, sparse: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "published",
    },
    template: { type: String, default: "default" },

    // SEO
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: { type: String },

    // Imágenes
    thumbnail: { type: String }, // miniatura (grilla de categorías)
    bannerImage: { type: String }, // banner ancho (homepage)
  },
  { timestamps: true }
);

// Auto-generate slug from name on save
categorySchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name as string);
  }
  next();
});

const Category = models.Category || model("Category", categorySchema);

export default Category;
