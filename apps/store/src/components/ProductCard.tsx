"use client";

import { Button } from "@/components/ui/button";
import { IProduct } from "@/models/Product";
import { useCartUI } from "@/store/useCartUI";
import { useCartStore } from "@/store/useCartStore";

interface ProductBuyActionsProps {
  product: IProduct;
}

export default function ProductBuyActions({ product }: ProductBuyActionsProps) {
  const addToCart = useCartStore((state) => state.addToCart);
  const openCart = useCartUI((state) => state.open);

  const handleBuy = () => {
    // ✅ usamos la primera imagen como imagen principal
    const mainImage = product.images?.[0] || "";

    addToCart({
      id: String(product._id),
      name: product.name,
      price: product.price,
      image: mainImage,
      quantity: 1,
    });

    openCart();
  };

  return (
    <div className="flex flex-col gap-3 mt-4">
      <Button
        onClick={handleBuy}
        className="w-full bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-lg py-6 rounded-lg shadow-md transition-all"
      >
        Comprar
      </Button>
    </div>
  );
}
