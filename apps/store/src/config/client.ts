import { headers } from "next/headers";
import { getModels } from "@/lib/tenant-models";

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
  };
}

const DEFAULT_CONFIG: Omit<ClientConfig, "slug" | "storeName"> = {
  modules: {
    repairs: false,
    budgets: false,
    shipping: true,
    coupons: true,
    analytics: true,
  },
  theme: {
    primaryColor: "#1E3A8A",
  },
};

export async function getClientConfig(): Promise<ClientConfig> {
  const h = await headers();
  const slug = h.get("x-tenant-slug") ?? process.env.TENANT_SLUG ?? "store";

  try {
    const { Setting } = await getModels();
    const setting = await Setting.findOne().lean<Record<string, unknown>>();

    return {
      slug,
      storeName: (setting?.storeName as string | undefined) ?? slug,
      modules: {
        repairs: Boolean(setting?.modules_repairs ?? DEFAULT_CONFIG.modules.repairs),
        budgets: Boolean(setting?.modules_budgets ?? DEFAULT_CONFIG.modules.budgets),
        shipping: Boolean(setting?.modules_shipping ?? DEFAULT_CONFIG.modules.shipping),
        coupons: Boolean(setting?.modules_coupons ?? DEFAULT_CONFIG.modules.coupons),
        analytics: Boolean(setting?.modules_analytics ?? DEFAULT_CONFIG.modules.analytics),
      },
      theme: {
        primaryColor: (setting?.primaryColor as string | undefined) ?? DEFAULT_CONFIG.theme.primaryColor,
      },
    };
  } catch {
    return { slug, storeName: slug, ...DEFAULT_CONFIG };
  }
}
