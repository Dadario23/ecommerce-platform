"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { safeImageSrc } from "@/lib/safe-image-src";
import { useCartStore } from "@/store/useCartStore";
import { useSession } from "next-auth/react";
import Spinner from "@/components/ui/Spinner";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function OrderPage() {
  const router = useRouter();
  const { status } = useSession();
  const items = useCartStore((state) => state.items);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status !== "loading") setReady(true);
  }, [status, router]);

  const subtotal = items.reduce(
    (sum: number, item: CartItem) => sum + item.price * item.quantity,
    0
  );
  const installment = Math.ceil(subtotal / 12);

  if (!ready || status === "loading") {
    return (
      <div className="pt-20 md:pt-32 flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Spinner />
        <p className="mt-4 text-gray-500 text-sm">Cargando tu pedido...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pt-20 md:pt-32 min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
          <ShoppingBag className="w-9 h-9 text-blue-200" />
        </div>
        <p className="text-lg font-semibold text-gray-700 mb-1">Tu carrito está vacío</p>
        <p className="text-sm text-gray-400 mb-6">Agregá productos para continuar</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-(--tenant-primary) text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-800 transition-colors"
        >
          Ver productos
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <main className="pt-20 md:pt-32 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Tu pedido</h1>
        <p className="text-sm text-gray-500 mb-6">Revisá los productos antes de continuar</p>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <ul className="divide-y divide-gray-50">
            {items.map((item: CartItem) => (
              <li key={item.id} className="flex gap-4 p-4">
                <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                  <Image
                    src={safeImageSrc(item.image, "/placeholder.png")}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-contain p-1.5"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ${item.price.toLocaleString("es-AR")} c/u
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    {/* Stepper */}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          item.quantity > 1
                            ? updateQuantity(item.id, item.quantity - 1)
                            : removeFromCart(item.id)
                        }
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors font-semibold"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          "−"
                        )}
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-gray-800 select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors font-semibold"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-sm font-bold text-gray-900">
                      ${(item.price * item.quantity).toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="self-start text-gray-300 hover:text-red-400 transition-colors mt-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{items.reduce((a: number, i: CartItem) => a + i.quantity, 0)} artículo{items.reduce((a: number, i: CartItem) => a + i.quantity, 0) !== 1 ? "s" : ""}</span>
            <span>${subtotal.toLocaleString("es-AR")}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-lg pt-1 border-t border-gray-100 mt-1">
            <span>Total</span>
            <span>${subtotal.toLocaleString("es-AR")}</span>
          </div>
          <p className="text-xs text-blue-600 font-medium text-right">
            12x ${installment.toLocaleString("es-AR")} sin interés
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push("/checkout")}
          className="w-full bg-(--tenant-primary) hover:bg-blue-800 text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          Continuar
          <ArrowRight className="w-4 h-4" />
        </button>

        <Link
          href="/"
          className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors mt-3 py-1"
        >
          Seguir comprando
        </Link>
      </div>
    </main>
  );
}
