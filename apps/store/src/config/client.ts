import { headers } from "next/headers";
import { getModels } from "@/lib/tenant-models";
import { getTenantTheme } from "@/config/tenant-themes";

export interface ClientConfig {
  slug: string;
  storeName: string;
  modules: {
    repairs: boolean;
    budgets: boolean;
    shipping: boolean;
    coupons: boolean;
    analytics: boolean;
  };
  theme: {
    primaryColor: string;
    accentColor: string;
  };
}

const DEFAULT_MODULES: ClientConfig["modules"] = {
  repairs: false,
  budgets: false,
  shipping: true,
  coupons: true,
  analytics: true,
};

export async function getClientConfig(): Promise<ClientConfig> {
  const h = await headers();
  const slug = h.get("x-tenant-slug") ?? process.env.TENANT_SLUG ?? "store";

  try {
    const { Setting } = await getModels();
    const setting = await Setting.findOne().lean<Record<string, unknown>>();

    return {
      slug,
      storeName: getTenantTheme(slug).storeName || (setting?.storeName as string | undefined) || slug,
      modules: {
        repairs: Boolean(setting?.modules_repairs ?? DEFAULT_MODULES.repairs),
        budgets: Boolean(setting?.modules_budgets ?? DEFAULT_MODULES.budgets),
        shipping: Boolean(setting?.modules_shipping ?? DEFAULT_MODULES.shipping),
        coupons: Boolean(setting?.modules_coupons ?? DEFAULT_MODULES.coupons),
        analytics: Boolean(setting?.modules_analytics ?? DEFAULT_MODULES.analytics),
      },
      theme: getTenantTheme(slug),
    };
  } catch {
    return { slug, storeName: slug, modules: DEFAULT_MODULES, theme: getTenantTheme(slug) };
  }
}
