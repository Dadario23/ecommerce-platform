export type TenantTheme = {
  primaryColor: string;
  accentColor: string;
};

const DEFAULT_THEME: TenantTheme = {
  primaryColor: "#1E3A8A",
  accentColor: "#3B82F6",
};

const THEMES: Record<string, TenantTheme> = {
  "bitm-cel": {
    primaryColor: "#1E3A8A",
    accentColor: "#3B82F6",
  },
  "kameleba": {
    primaryColor: "#9333EA",
    accentColor: "#EC4899",
  },
};

export function getTenantTheme(slug: string): TenantTheme {
  return THEMES[slug] ?? DEFAULT_THEME;
}
