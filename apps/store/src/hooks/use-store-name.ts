"use client";

export function useStoreName(): string {
  if (typeof document === "undefined") return "";
  return document.documentElement.getAttribute("data-store-name") ?? "";
}
