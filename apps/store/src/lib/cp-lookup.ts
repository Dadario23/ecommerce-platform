// Mapeo estático CP → barrio para CABA (rangos aproximados, 4 dígitos numéricos)
const CABA_NEIGHBORHOODS: { min: number; max: number; name: string }[] = [
  { min: 1000, max: 1099, name: "Microcentro / Retiro" },
  { min: 1100, max: 1199, name: "San Telmo / La Boca" },
  { min: 1200, max: 1299, name: "Once / Congreso" },
  { min: 1300, max: 1399, name: "Almagro / Boedo" },
  { min: 1400, max: 1413, name: "Caballito" },
  { min: 1414, max: 1416, name: "Palermo" },
  { min: 1417, max: 1421, name: "Flores / Villa del Parque" },
  { min: 1422, max: 1425, name: "Villa Crespo / Palermo" },
  { min: 1426, max: 1428, name: "Belgrano / Colegiales" },
  { min: 1429, max: 1433, name: "Villa Urquiza / Saavedra" },
  { min: 1434, max: 1441, name: "Devoto / Floresta" },
  { min: 1442, max: 1449, name: "Liniers / Mataderos" },
  { min: 1450, max: 1499, name: "Villa Lugano / Soldati" },
];

/** Extrae el número de un CP argentino (soporta formato viejo 1425 y nuevo C1425ABC) */
function parseCp(zipCode: string): number {
  return parseInt(zipCode.replace(/\D/g, ""), 10);
}

/** Devuelve el barrio de CABA basado en el CP, o null si no es CABA o no se reconoce */
export function getNeighborhoodFromCp(zipCode: string): string | null {
  const cp = parseCp(zipCode);
  if (isNaN(cp)) return null;
  return CABA_NEIGHBORHOODS.find((r) => cp >= r.min && cp <= r.max)?.name ?? null;
}

type Zone = { id: string; name: string; zipRanges?: { min: number; max: number }[] };

/** Devuelve la zona que contiene el CP dado, o null */
export function matchZoneByZip(zipCode: string, zones: Zone[]): Zone | null {
  const cp = parseCp(zipCode);
  if (isNaN(cp)) return null;
  return zones.find((z) => z.zipRanges?.some((r) => cp >= r.min && cp <= r.max)) ?? null;
}

/**
 * Resuelve zona y sub-localidad para mostrar en la etiqueta.
 * - CABA: neighborhood = barrio derivado del CP
 * - GBA:  neighborhood = nombre de ciudad/municipio
 */
export function resolveShippingLocation(
  zipCode: string,
  city: string,
  zones: Zone[]
): { zoneName: string; neighborhood: string } | null {
  const zone = matchZoneByZip(zipCode, zones);
  if (!zone) return null;

  const neighborhood =
    zone.id === "caba"
      ? (getNeighborhoodFromCp(zipCode) ?? city)
      : city;

  return { zoneName: zone.name, neighborhood };
}
