"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { useSession } from "next-auth/react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  isOpen: boolean;
  toggleCart: () => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isLoading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();

  // ✅ Cargar carrito desde la API cuando cambie la sesión
  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true);

      if (status === "authenticated") {
        try {
          // Cargar carrito del usuario desde la API
          const response = await fetch("/api/cart");
          if (response.ok) {
            const cartData = await response.json();
            setItems(cartData.items || []);
          }
        } catch (error) {
          console.error("Error loading cart from API:", error);
        }
      } else if (status === "unauthenticated") {
        // Usuario no autenticado - carrito vacío
        setItems([]);
      }

      setIsLoading(false);
    };

    loadCart();
  }, [status]);

  // ✅ Sincronizar carrito con la API cuando cambien los items Y el usuario esté autenticado
  useEffect(() => {
    if (status === "authenticated" && !isLoading) {
      const syncCart = async () => {
        try {
          await fetch("/api/cart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ items }),
          });
        } catch (error) {
          console.error("Error syncing cart with API:", error);
        }
      };

      // Debounce para evitar muchas llamadas API
      const timeoutId = setTimeout(syncCart, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [items, status, isLoading]);

  const toggleCart = () => setIsOpen((prev) => !prev);

  const addToCart = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + item.quantity } : p
        );
      }
      return [...prev, item];
    });
    setIsOpen(true);
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity } : p)));
  };

  const clearCart = () => {
    setItems([]);
    // También limpiar en el backend si el usuario está autenticado
    if (status === "authenticated") {
      fetch("/api/cart", {
        method: "DELETE",
      }).catch((error) => console.error("Error clearing cart:", error));
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
};
