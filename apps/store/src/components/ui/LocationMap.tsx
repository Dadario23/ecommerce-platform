"use client";

import { useEffect, useRef } from "react";

// Singleton: carga Leaflet desde CDN una sola vez
let leafletReady = false;
let leafletLoading = false;
const leafletCallbacks: (() => void)[] = [];

function loadLeaflet(cb: () => void) {
  if (leafletReady) { cb(); return; }
  leafletCallbacks.push(cb);
  if (leafletLoading) return;
  leafletLoading = true;

  if (!document.querySelector('link[href*="leaflet"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }

  const script = document.createElement("script");
  script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  script.async = true;
  script.onload = () => {
    leafletReady = true;
    leafletCallbacks.forEach((f) => f());
    leafletCallbacks.length = 0;
  };
  document.head.appendChild(script);
}

interface Props {
  center: [number, number];
  onPositionChange?: (lat: number, lng: number) => void;
}

export default function LocationMap({ center, onPositionChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  useEffect(() => {
    loadLeaflet(initMap);
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualiza el mapa cuando cambian las coordenadas
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    mapRef.current.setView(center, 16, { animate: true });
    markerRef.current.setLatLng(center);
  }, [center]);

  function initMap() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!L || !containerRef.current || mapRef.current) return;

    // Fix íconos por defecto (problema conocido con bundlers)
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView(center, 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(center, { draggable: true }).addTo(map);

    if (onPositionChange) {
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onPositionChange(pos.lat, pos.lng);
      });
    }

    mapRef.current = map;
    markerRef.current = marker;
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-52 rounded-xl overflow-hidden border border-gray-200"
      style={{ zIndex: 0 }}
    />
  );
}
