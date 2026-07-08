"use client";

import { useEffect, useState } from "react";

export function useWhatsAppNumber(): string {
  // Se lee en un efecto para que el primer render del cliente coincida
  // con el SSR ("") y no haya hydration mismatch.
  const [number, setNumber] = useState("");
  useEffect(() => {
    setNumber(
      document.documentElement.getAttribute("data-whatsapp") ||
        process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
        ""
    );
  }, []);
  return number;
}
