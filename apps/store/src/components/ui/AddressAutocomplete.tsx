"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2 } from "lucide-react";

export interface PlaceComponents {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lat?: number;
  lng?: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (components: PlaceComponents) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

function parseResult(result: NominatimResult): PlaceComponents {
  const a = result.address;
  const road = a.road ?? "";
  const number = a.house_number ?? "";
  const street = road
    ? number ? `${road} ${number}` : road
    : result.display_name.split(",")[0].trim();

  return {
    street,
    // Prefer municipality/county (partido) over suburb (barrio) so GBA addresses
    // resolve to "Florencio Varela" rather than "Villa Vatteone".
    city: a.city ?? a.town ?? a.municipality ?? a.county ?? a.village ?? a.suburb ?? "",
    state: a.state ?? "",
    postalCode: a.postcode ?? "",
    country: a.country ?? "Argentina",
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
  };
}

export default function AddressAutocomplete({
  id,
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  className,
  required,
}: Props) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (query: string) => {
    if (query.length < 4) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(query)}` +
        `&format=json&addressdetails=1&limit=5&countrycodes=ar&accept-language=es`;
      const res = await fetch(url);
      const data: NominatimResult[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 350);
  };

  const handleSelect = (result: NominatimResult) => {
    const components = parseResult(result);
    onChange(components.street);
    onPlaceSelect(components);
    setSuggestions([]);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder ?? "Calle y número..."}
          required={required}
          autoComplete="off"
          className={`flex h-9 w-full rounded-lg border border-input bg-transparent pl-9 pr-8 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className ?? ""}`}
        />
      </div>

      {open && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((result) => (
            <li
              key={result.place_id}
              onMouseDown={() => handleSelect(result)}
              className="flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700 leading-snug line-clamp-2">
                {result.display_name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
