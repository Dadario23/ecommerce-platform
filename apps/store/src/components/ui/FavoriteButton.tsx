"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useToast } from "@/hooks/use-toast";

interface Props {
  productId: string;
  variant?: "icon" | "full";
  className?: string;
}

export default function FavoriteButton({ productId, variant = "icon", className = "" }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const { isFavorited, toggle } = useFavoritesStore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const favorited = mounted && isFavorited(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      router.push("/login");
      return;
    }

    const wasAdding = !favorited;

    // Optimistic update
    toggle(productId);

    try {
      const res = await fetch("/api/user/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        await res.json().catch(() => {});
        toggle(productId); // revertir
        toast({
          title: "Error",
          description: "No se pudo guardar el favorito. Intentá de nuevo.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: wasAdding ? "Agregado a favoritos" : "Quitado de favoritos",
        description: wasAdding
          ? "Podés verlo en Mi cuenta → Mis favoritos."
          : "El producto fue removido de tus favoritos.",
      });
    } catch {
      toggle(productId); // revertir si hay error de red
      toast({
        title: "Error de conexión",
        description: "Verificá tu conexión e intentá de nuevo.",
        variant: "destructive",
      });
    }
  };

  if (variant === "full") {
    return (
      <button
        onClick={handleClick}
        aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
          favorited
            ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
            : "border-gray-200 bg-white text-gray-600 hover:border-red-200 hover:text-red-400 hover:bg-red-50"
        } ${className}`}
      >
        <Heart className="w-4 h-4" fill={favorited ? "currentColor" : "none"} strokeWidth={2} />
        {favorited ? "Guardado en favoritos" : "Agregar a favoritos"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
      className={`p-1.5 rounded-full transition-all ${
        favorited
          ? "bg-red-50 text-red-500"
          : "bg-white/80 text-gray-400 hover:text-red-400 hover:bg-red-50"
      } ${className}`}
    >
      <Heart className="w-4 h-4" fill={favorited ? "currentColor" : "none"} strokeWidth={2} />
    </button>
  );
}
