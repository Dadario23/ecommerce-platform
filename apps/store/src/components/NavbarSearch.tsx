"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Star } from "lucide-react";
import Image from "next/image";

interface SuggestProduct {
  _id: string;
  slug: string;
  name: string;
  price: number;
  images: string[];
  avgRating?: number;
  reviewCount?: number;
}

export default function NavbarSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SuggestProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShow(false);
      return;
    }

    setLoading(true);
    const delay = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products/search?query=${encodeURIComponent(query)}&mode=suggest`
        );
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setResults(list);
        setShow(list.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (query.trim().length > 0) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setShow(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (slug: string) => {
    router.push(`/products/${slug}`);
    setQuery("");
    setShow(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Input */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar productos, marcas..."
          className="w-full rounded-full bg-white border-0 pl-4 pr-12 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
            if (e.key === "Escape") setShow(false);
          }}
          onFocus={() => results.length > 0 && setShow(true)}
        />
        <button
          type="button"
          onClick={handleSearch}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1E3A8A] hover:bg-blue-700 rounded-full flex items-center justify-center text-white transition-colors shrink-0"
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Dropdown */}
      {show && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full rounded-xl border bg-white shadow-xl z-50 overflow-hidden">
          <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {results.map((p) => (
              <li
                key={p._id}
                onClick={() => handleSelect(p.slug)}
                className="flex items-center gap-3 cursor-pointer px-3 py-2.5 hover:bg-blue-50 transition-colors"
              >
                {/* Imagen */}
                <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border bg-gray-100">
                  {p.images?.[0] ? (
                    <Image
                      src={p.images[0]}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-blue-700">
                      ${p.price.toLocaleString("es-AR")}
                    </span>
                    {p.avgRating && p.avgRating > 0 ? (
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {p.avgRating.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <span className="text-xs text-gray-300 shrink-0">→</span>
              </li>
            ))}
          </ul>

          {/* Footer: ir a resultados completos */}
          <button
            onClick={handleSearch}
            className="w-full px-4 py-2.5 text-xs text-blue-600 hover:bg-blue-50 text-left border-t font-medium transition-colors"
          >
            Ver todos los resultados para &ldquo;{query}&rdquo;
          </button>
        </div>
      )}
    </div>
  );
}
