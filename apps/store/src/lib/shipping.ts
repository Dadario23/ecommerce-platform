import type { Model } from "mongoose";
import type { IShippingConfig, IShippingZone } from "@/models/ShippingConfig";

export const DEFAULT_SHIPPING_ZONES: IShippingZone[] = [
  {
    id: "caba",
    name: "CABA",
    localities: ["Buenos Aires","Ciudad Autónoma de Buenos Aires","CABA","Palermo","Belgrano","Caballito","Flores","Villa Urquiza","Almagro","Balvanera","San Telmo","La Boca","Recoleta","Barracas","Villa del Parque","Mataderos","Liniers","Parque Patricios"],
    // CPs de CABA: 1000–1499 (formato nuevo: C1000–C1499)
    zipRanges: [{ min: 1000, max: 1499 }],
    flex: 3200,
    standard: 2500,
  },
  {
    id: "gba1",
    name: "GBA 1",
    localities: ["Lomas de Zamora","Lanús","Avellaneda","Morón","Ituzaingó","Hurlingham","Tres de Febrero","San Martín","San Isidro","Vicente López","San Fernando","Haedo","Ramos Mejía","San Justo","Ciudadela","Castelar","El Palomar","Martínez","Olivos","Florida","Munro","Villa Adelina","Boulogne"],
    // Primer cordón: San Isidro/Vicente López 1636–1648, San Martín/Tres de Febrero 1650–1688,
    // Morón/Ituzaingó 1700–1714, Lomas/Lanús 1820–1836, Avellaneda 1870–1876
    zipRanges: [{ min: 1636, max: 1688 }, { min: 1700, max: 1714 }, { min: 1820, max: 1836 }, { min: 1870, max: 1876 }],
    flex: 4500,
    standard: 3800,
  },
  {
    id: "gba2",
    name: "GBA 2",
    localities: ["Quilmes","Almirante Brown","Florencio Varela","Berazategui","Tigre","San Miguel","Malvinas Argentinas","José C. Paz","Moreno","Merlo","La Matanza","Ezeiza","Esteban Echeverría","Don Torcuato","General Pacheco","Temperley","Adrogué","Longchamps","Monte Grande","Villa Domínico","Wilde","Bernal","Quilmes Oeste"],
    // Segundo cordón: Tigre/San Fernando 1648–1660, San Miguel/Malvinas 1663–1670,
    // Merlo/Moreno 1715–1750, La Matanza 1752–1784, Almirante Brown 1840–1865, Quilmes/Berazategui 1878–1896
    zipRanges: [{ min: 1648, max: 1670 }, { min: 1715, max: 1784 }, { min: 1837, max: 1869 }, { min: 1877, max: 1896 }],
    flex: 5300,
    standard: 4600,
  },
  {
    id: "gba3",
    name: "GBA 3",
    localities: ["La Plata","Guernica","Cañuelas","Marcos Paz","General Rodríguez","Pilar","Escobar","Berisso","Ensenada","City Bell","Gonnet","Ringuelet","Manuel B. Gonnet","Del Viso","Maquinista Savio","Garín","Campana","Zárate"],
    // Tercer cordón: Pilar/Escobar 1620–1635, La Plata/Berisso 1900–1940,
    // Guernica/Cañuelas 1897–1899, Campana/Zárate 2800–2820
    zipRanges: [{ min: 1620, max: 1635 }, { min: 1785, max: 1819 }, { min: 1897, max: 1899 }, { min: 1900, max: 1940 }, { min: 2800, max: 2820 }],
    flex: 5800,
    standard: 5100,
  },
];

function normalizeLocality(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

// Misma lógica de fallback que expone GET /api/shipping/zones: si el tenant
// todavía no configuró tarifas, se usan (y persisten) las de por defecto.
export async function getShippingZones(
  ShippingConfig: Model<IShippingConfig>
): Promise<IShippingZone[]> {
  const config = await ShippingConfig.findOne().lean();
  if (!config) {
    const created = await ShippingConfig.create({ zones: DEFAULT_SHIPPING_ZONES });
    return created.zones;
  }
  return config.zones;
}

export function findShippingZone(
  city: string,
  zipCode: string,
  zones: IShippingZone[]
): IShippingZone | null {
  const normalizedCity = normalizeLocality(city ?? "");
  const byCity = normalizedCity
    ? zones.find((z) => z.localities.some((l) => normalizeLocality(l) === normalizedCity))
    : undefined;
  if (byCity) return byCity;

  const cp = parseInt((zipCode ?? "").replace(/\D/g, ""), 10);
  if (isNaN(cp)) return null;
  return zones.find((z) => z.zipRanges?.some((r) => cp >= r.min && cp <= r.max)) ?? null;
}
