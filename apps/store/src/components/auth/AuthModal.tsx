// components/auth/AuthModal.tsx (versión actualizada)
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromCart?: boolean;
}

export default function AuthModal({
  open,
  onOpenChange,
  fromCart = false,
}: AuthModalProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ✅ Redirigir a /order después de login exitoso desde el carrito
  useEffect(() => {
    if (open && status === "authenticated" && fromCart) {
      onOpenChange(false);
      router.push("/order");
    }
  }, [open, status, fromCart, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            {fromCart ? "Inicia sesión para finalizar tu compra" : "Bienvenido"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Registro</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <LoginForm fromCart={fromCart} />
          </TabsContent>

          <TabsContent value="register" className="mt-4">
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
