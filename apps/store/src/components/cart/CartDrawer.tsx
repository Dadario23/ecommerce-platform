"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useCartStore } from "@/store/useCartStore";
import { useCartUI } from "@/store/useCartUI";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import Image from "next/image";
import Link from "next/link";
import { INSTALLMENTS } from "@/config/installments";

export default function CartDrawer() {
  const router = useRouter();
  const { status } = useSession();
  const { isOpen, close } = useCartUI();

  const items = useCartStore((state) => state.items);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const [authModalOpen, setAuthModalOpen] = useState(false);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const installment = Math.ceil(subtotal / INSTALLMENTS.max);

  const handleCheckout = () => {
    if (status === "authenticated") {
      close();
      router.push("/order");
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleRemove = async (id: string) => {
    removeFromCart(id);
    if (status !== "authenticated") return;
    try {
      await fetch(`/api/cart/${id}`, { method: "DELETE", credentials: "include" });
    } catch {
      // silently ignore sync errors
    }
  };

  useEffect(() => {
    if (authModalOpen && status === "authenticated") {
      setAuthModalOpen(false);
      close();
      router.push("/order");
    }
  }, [authModalOpen, status, close, router]);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && close()}>
        <SheetContent side="right" className="w-full sm:w-105 p-0 flex flex-col">

          {/* Header */}
          <SheetHeader className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-(--tenant-primary)" />
              <SheetTitle className="text-base font-bold text-gray-900">
                Mi carrito
              </SheetTitle>
              {totalItems > 0 && (
                <span className="ml-1 bg-(--tenant-primary) text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </div>
            <SheetDescription className="text-xs text-gray-400 mt-0.5">
              Revisá tu selección antes de comprar
            </SheetDescription>
          </SheetHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full px-6 py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-9 h-9 text-blue-200" />
                </div>
                <p className="font-semibold text-gray-700 text-base mb-1">
                  Tu carrito está vacío
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  Agregá productos para empezar tu compra
                </p>
                <Link
                  href="/"
                  onClick={close}
                  className="inline-flex items-center gap-2 bg-(--tenant-primary) text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-800 transition-colors"
                >
                  Ver productos
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 px-5 py-3">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3 py-4">
                    {/* Image */}
                    <Link
                      href={`/products/${item.id}`}
                      onClick={close}
                      className="relative w-18 h-18 shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-gray-50"
                    >
                      <Image
                        src={item.image || "/placeholder.png"}
                        alt={item.name}
                        fill
                        sizes="72px"
                        className="object-contain p-1.5"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          ${item.price.toLocaleString("es-AR")} c/u
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity stepper */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() =>
                              item.quantity > 1
                                ? updateQuantity(item.id, item.quantity - 1)
                                : handleRemove(item.id)
                            }
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-base font-semibold"
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
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-base font-semibold"
                          >
                            +
                          </button>
                        </div>

                        {/* Line total */}
                        <span className="text-sm font-bold text-gray-900">
                          ${(item.price * item.quantity).toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="self-start text-gray-300 hover:text-red-400 transition-colors mt-0.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-5 space-y-4 bg-white">
              {/* Subtotal */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{totalItems} artículo{totalItems !== 1 ? "s" : ""}</span>
                  <span>${subtotal.toLocaleString("es-AR")}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-lg">${subtotal.toLocaleString("es-AR")}</span>
                </div>
                <p className="text-xs text-blue-600 font-medium text-right">
                  {INSTALLMENTS.max}x ${installment.toLocaleString("es-AR")}
                  {INSTALLMENTS.sinInteres ? " sin interés" : " con tarjeta"}
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={handleCheckout}
                className="w-full bg-(--tenant-primary) hover:bg-blue-800 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                Finalizar compra
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={close}
                className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                Seguir comprando
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        fromCart={true}
      />
    </>
  );
}
