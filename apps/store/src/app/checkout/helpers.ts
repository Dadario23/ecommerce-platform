import type { SavedAddress, AddressData, ShippingZone } from "./types";

const MONTHS_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function normalizeLocality(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

export function addBusinessDays(date: Date, n: number): Date {
  let count = 0;
  const d = new Date(date);
  while (count < n) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) count++;
  }
  return d;
}

export function formatDateLong(date: Date): string {
  return `${date.getDate()} de ${MONTHS_ES[date.getMonth()]}`;
}

export function findZone(city: string, zones: ShippingZone[]): ShippingZone | null {
  if (!city.trim()) return null;
  const n = normalizeLocality(city);
  return zones.find((z) => z.localities.some((l) => normalizeLocality(l) === n)) ?? null;
}

export function findZoneByZip(zipCode: string, zones: ShippingZone[]): ShippingZone | null {
  const cp = parseInt(zipCode.replace(/\D/g, ""), 10);
  if (isNaN(cp)) return null;
  return zones.find((z) => z.zipRanges?.some((r) => cp >= r.min && cp <= r.max)) ?? null;
}

export function fromSaved(addr: SavedAddress, fallback: AddressData): AddressData {
  return {
    firstName: addr.firstName || fallback.firstName,
    lastName: addr.lastName || fallback.lastName,
    street: addr.street,
    city: addr.city,
    state: addr.state,
    postalCode: addr.zipCode,
    country: addr.country || "Argentina",
    phone: addr.phone || "",
  };
}
