import mongoose, { Schema, Document } from "mongoose";

export interface IZipRange {
  min: number;
  max: number;
}

export interface IShippingZone {
  id: string;
  name: string;
  localities: string[];
  zipRanges: IZipRange[];
  flex: number;
  standard: number;
}

export interface IShippingConfig extends Document {
  zones: IShippingZone[];
}

const ZipRangeSchema = new Schema<IZipRange>(
  { min: { type: Number, required: true }, max: { type: Number, required: true } },
  { _id: false },
);

const ZoneSchema = new Schema<IShippingZone>(
  {
    id:           { type: String, required: true },
    name:         { type: String, required: true },
    localities:   [{ type: String }],
    zipRanges:    { type: [ZipRangeSchema], default: [] },
    flex:         { type: Number, required: true },
    standard:     { type: Number, required: true },
  },
  { _id: false },
);

const ShippingConfigSchema = new Schema<IShippingConfig>(
  { zones: [ZoneSchema] },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production" && mongoose.models["ShippingConfig"]) {
  delete (mongoose.models as Record<string, unknown>)["ShippingConfig"];
}

export default (mongoose.models["ShippingConfig"] as mongoose.Model<IShippingConfig>) ||
  mongoose.model<IShippingConfig>("ShippingConfig", ShippingConfigSchema);
