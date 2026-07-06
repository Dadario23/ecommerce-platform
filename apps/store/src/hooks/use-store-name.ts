"use client";

import { useEffect, useState } from "react";

export function useStoreName(): string {
  // Se lee en un efecto para que el primer render del cliente coincida
  // con el SSR ("") y no haya hydration mismatch.
  const [storeName, setStoreName] = useState("");
  useEffect(() => {
    setStoreName(document.documentElement.getAttribute("data-store-name") ?? "");
  }, []);
  return storeName;
}
