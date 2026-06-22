import { getModels } from "@/lib/tenant-models";

export async function getShippingEnabled(): Promise<boolean> {
  const { Setting } = await getModels();
  const doc = await Setting.findOne({}, "shippingEnabled").lean<{ shippingEnabled?: boolean }>();
  return doc?.shippingEnabled ?? true;
}
