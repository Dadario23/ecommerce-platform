export type TenantTheme = {
  storeName: string;
  primaryColor: string;
  accentColor: string;
};

const DEFAULT_THEME: TenantTheme = {
  storeName: "",
  primaryColor: "#1E3A8A",
  accentColor: "#3B82F6",
};

const THEMES: Record<string, TenantTheme> = {
  "bitm-cel": {
    storeName: "Bitm-Cel",
    primaryColor: "#1E3A8A",
    accentColor: "#3B82F6",
  },
  "kameleba": {
    storeName: "Kameleba",
    primaryColor: "#9333EA",
    accentColor: "#EC4899",
  },
};

export function getTenantTheme(slug: string): TenantTheme {
  return THEMES[slug] ?? DEFAULT_THEME;
}
