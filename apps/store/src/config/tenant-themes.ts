export type HomeVariant = "tech" | "editorial";
export type FontKey = "geist" | "manrope" | "editorial" | "urban";
export type NavStyle = "solid" | "light";
export type CardStyle = "boxed" | "minimal";
export type BenefitIcon =
  | "truck"
  | "creditCard"
  | "banknote"
  | "shieldCheck"
  | "headphones"
  | "refresh"
  | "sparkles";

export type TenantTheme = {
  storeName: string;
  colors: {
    primary: string;      // superficie de marca (barras, botones)
    primaryHover: string; // hover de superficies primary
    onPrimary: string;    // texto/íconos sobre primary
    tint: string;         // fondo suave (hovers claros, gradientes)
    accent: string;       // avatar, badges, detalles
  };
  radius: string;
  font: FontKey;
  logo: { src: string; invert?: boolean } | null; // null → wordmark storeName en font-brand
  favicon: string | null; // null → /favicon.ico genérico
  navStyle: NavStyle; // solid → barra en primary; light → barra blanca con texto oscuro
  cardStyle: CardStyle; // boxed → card con borde y foto contain; minimal → sin borde, foto 3/4 cover (variante CSS `minimal:`)
  homeVariant: HomeVariant;
  benefits: { icon: BenefitIcon; title: string; subtitle: string }[];
  promoItems: { icon: BenefitIcon; text: string }[];
};

const DEFAULT_THEME: TenantTheme = {
  storeName: "",
  colors: {
    primary: "#1E3A8A",
    primaryHover: "#1E40AF",
    onPrimary: "#FFFFFF",
    tint: "#EFF6FF",
    accent: "#3B82F6",
  },
  radius: "0.625rem",
  font: "geist",
  logo: null,
  favicon: null,
  navStyle: "solid",
  cardStyle: "boxed",
  homeVariant: "tech",
  benefits: [
    { icon: "truck", title: "Envío gratis", subtitle: "A todo el país" },
    { icon: "creditCard", title: "12 cuotas sin interés", subtitle: "Con todas las tarjetas" },
    { icon: "shieldCheck", title: "Compra protegida", subtitle: "Garantía oficial 12 meses" },
    { icon: "headphones", title: "Soporte 24/7", subtitle: "Estamos para ayudarte" },
  ],
  promoItems: [
    { icon: "truck", text: "Envíos gratis" },
    { icon: "creditCard", text: "Cuotas sin interés" },
    { icon: "banknote", text: "20% OFF pagando con transferencia" },
    { icon: "shieldCheck", text: "Garantía oficial" },
  ],
};

const THEMES: Record<string, TenantTheme> = {
  "bitm-cel": {
    ...DEFAULT_THEME,
    storeName: "Bitm-Cel",
    logo: { src: "/logo.svg", invert: true },
  },
  "compumobile": {
    storeName: "Compumobile",
    colors: {
      primary: "#0F172A",
      primaryHover: "#1E293B",
      onPrimary: "#FFFFFF",
      tint: "#ECFEFF",
      accent: "#06B6D4",
    },
    radius: "0.375rem",
    font: "manrope",
    logo: { src: "/logo.svg", invert: true },
    favicon: null,
    navStyle: "solid",
    cardStyle: "boxed",
    homeVariant: "tech",
    benefits: [
      { icon: "truck", title: "Envíos a todo el país", subtitle: "Rápidos y seguros" },
      { icon: "creditCard", title: "Cuotas sin interés", subtitle: "Con todas las tarjetas" },
      { icon: "shieldCheck", title: "Garantía oficial", subtitle: "12 meses en todos los equipos" },
      { icon: "headphones", title: "Soporte técnico propio", subtitle: "Reparamos tu equipo" },
    ],
    promoItems: [
      { icon: "banknote", text: "20% OFF pagando con transferencia" },
      { icon: "truck", text: "Envíos gratis" },
      { icon: "creditCard", text: "Cuotas sin interés" },
      { icon: "shieldCheck", text: "Garantía oficial" },
    ],
  },
  "kameleba": {
    storeName: "Kameleba",
    colors: {
      primary: "#0A0A0A",
      primaryHover: "#262626",
      onPrimary: "#FFFFFF",
      tint: "#F5F5F5",
      accent: "#DB2777",
    },
    radius: "0.125rem",
    font: "urban",
    logo: { src: "/logo-kameleba.png" },
    favicon: "/favicon-kameleba.png",
    navStyle: "light",
    cardStyle: "minimal",
    homeVariant: "editorial",
    benefits: [
      { icon: "refresh", title: "Cambios sin cargo", subtitle: "Hasta 30 días" },
      { icon: "truck", title: "Envío gratis", subtitle: "En compras seleccionadas" },
      { icon: "creditCard", title: "3 y 6 cuotas sin interés", subtitle: "Con todas las tarjetas" },
      { icon: "shieldCheck", title: "Compra protegida", subtitle: "Devolución garantizada" },
    ],
    promoItems: [
      { icon: "sparkles", text: "Nueva colección" },
      { icon: "refresh", text: "Cambios sin cargo" },
      { icon: "truck", text: "Envíos a todo el país" },
      { icon: "creditCard", text: "Cuotas sin interés" },
    ],
  },
};

export function getTenantTheme(slug: string): TenantTheme {
  return THEMES[slug] ?? DEFAULT_THEME;
}
