"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";

export default function DeleteAccountSection({ hasPassword }: { hasPassword: boolean }) {
  const isGoogleUser = !hasPassword;

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = confirmed && (isGoogleUser || password.length > 0);

  function resetState() {
    setPassword("");
    setConfirmed(false);
    setError("");
  }

  async function handleDelete() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm: true,
          ...(isGoogleUser ? {} : { password }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al eliminar la cuenta");
        setLoading(false);
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Ocurrió un error inesperado");
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 pt-6 border-t border-gray-100">
      <h3 className="text-sm font-bold text-red-600 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        Zona de peligro
      </h3>
      <p className="text-xs text-gray-500 mt-1 mb-3 leading-relaxed">
        Eliminar tu cuenta es permanente. Perdés el acceso a tu perfil, direcciones
        guardadas y carrito. Tu historial de pedidos se conserva por razones contables.
      </p>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetState();
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-semibold text-red-600 border border-red-200 rounded-xl px-4 py-2 hover:bg-red-50 transition-colors"
        >
          Eliminar mi cuenta
        </button>

        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">¿Eliminar tu cuenta?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Tu cuenta y tu carrito se van a
              eliminar definitivamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!isGoogleUser && (
              <div>
                <Label htmlFor="delete-password" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Confirmá tu contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="delete-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-red-600"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                Entiendo que esta acción es permanente y no se puede deshacer.
              </span>
            </label>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canSubmit || loading}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Eliminar cuenta definitivamente
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
