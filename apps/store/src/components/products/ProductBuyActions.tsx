"use client";

import { useState } from "react";
import { ShoppingCart, Zap, MessageCircle } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { IProduct } from "@/models/Product";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/utils";

export default function ProductBuyActions({ product }: { product: IProduct }) {
  const addToCart = useCartStore((s) => s.addToCart);
  const router = useRouter();
  const pathname = usePathname();

  const [added, setAdded] = useState(false);
  const isOutOfStock = (product.stock ?? 0) <= 0;

  const cartPayload = {
    id: String(product._id),
    name: product.name,
    price: product.price,
    image: product.images?.[0] ?? "",
    quantity: 1,
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(cartPayload);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(cartPayload);
    router.push("/checkout");
  };

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const productUrl = `${process.env.NEXT_PUBLIC_URL ?? ""}${pathname}`;
  const waMessage = encodeURIComponent(
    `Hola! Me interesa este producto: ${product.name}\n${productUrl}`
  );
  const whatsappHref = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <div className="flex flex-col gap-3">
      {/* Add to cart */}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={cn(
          "flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border-2 font-semibold text-base transition-all",
          isOutOfStock
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : added
            ? "border-green-500 bg-green-50 text-green-700"
            : "border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white"
        )}
      >
        <ShoppingCart className="w-5 h-5" />
        {added ? "¡Agregado!" : "Agregar al carrito"}
      </button>

      {/* Buy now */}
      <button
        onClick={handleBuyNow}
        disabled={isOutOfStock}
        className={cn(
          "flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-base transition-all",
          isOutOfStock
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-[#1E3A8A] hover:bg-[#1e40af] text-white shadow-md hover:shadow-lg"
        )}
      >
        <Zap className="w-5 h-5" />
        Comprar ahora
      </button>

      {/* WhatsApp */}
      {waNumber && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-base transition-all bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-md hover:shadow-lg"
        >
          <MessageCircle className="w-5 h-5" />
          Consultar por WhatsApp
        </a>
      )}

      {isOutOfStock && (
        <p className="text-center text-sm text-red-500">
          Este producto no tiene stock disponible
        </p>
      )}
    </div>
  );
}
