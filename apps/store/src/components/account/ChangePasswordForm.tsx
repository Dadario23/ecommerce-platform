"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Info } from "lucide-react";

function PasswordField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-medium text-gray-700 mb-1.5 block">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="pr-10 rounded-lg"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function ChangePasswordForm() {
  const { data: session } = useSession();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isGoogleUser = session?.user?.image?.includes("googleusercontent");

  if (isGoogleUser) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Cambiar contraseña</h2>
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-0.5">
              Cuenta vinculada con Google
            </p>
            <p className="text-xs text-blue-600">
              Tu acceso se gestiona a través de Google. Para cambiar tu contraseña
              usá la configuración de seguridad de tu cuenta de Google.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (next.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (next !== confirm) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }
    if (current === next) {
      setError("La nueva contraseña debe ser diferente a la actual");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al cambiar la contraseña");
      } else {
        setSuccess(true);
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    } catch {
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-md">
      <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-gray-400" />
        <h2 className="text-lg font-bold text-gray-900">Cambiar contraseña</h2>
      </div>

      {success && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
          <p className="text-sm text-green-700 font-medium">
            Contraseña actualizada correctamente
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField
          id="current"
          label="Contraseña actual"
          value={current}
          onChange={setCurrent}
        />
        <PasswordField
          id="new"
          label="Nueva contraseña"
          value={next}
          onChange={setNext}
          hint="Mínimo 6 caracteres"
        />
        <PasswordField
          id="confirm"
          label="Confirmar nueva contraseña"
          value={confirm}
          onChange={setConfirm}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-(--tenant-primary) hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-70 text-sm mt-2"
        >
          {loading ? "Guardando..." : "Actualizar contraseña"}
        </button>
      </form>
    </div>
  );
}
