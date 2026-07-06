"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2, Eye, EyeOff, Key, CheckCircle, AlertCircle, ArrowLeft,
} from "lucide-react";
import { useStoreName } from "@/hooks/use-store-name";

const INPUT =
  "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 placeholder:text-gray-300 transition-colors";

export default function ResetPasswordClient() {
  const storeName = useStoreName();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState("");

  useEffect(() => {
    if (!token || !email) {
      setTokenError("Enlace inválido o incompleto");
      setTokenValid(false);
      return;
    }
    fetch("/api/auth/verify-reset-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json();
          setTokenError(d.error ?? "Enlace inválido o expirado");
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      })
      .catch(() => {
        setTokenError("Error al verificar el enlace");
        setTokenValid(false);
      });
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password || !confirm) { setError("Completá todos los campos"); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al restablecer la contraseña");
      } else {
        setSuccess(true);
        setTimeout(() => { window.location.href = "/login"; }, 3000);
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const LeftPanel = () => (
    <div className="hidden lg:flex lg:w-5/12 bg-(--tenant-primary) flex-col justify-between p-10 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full bg-white/5" />
      <Link href="/" className="relative flex items-center gap-3">
        <div className="relative w-8 h-8 shrink-0">
          <Image src="/logo.svg" alt="Logo" fill className="object-contain brightness-0 invert" />
        </div>
        <span className="text-white font-bold text-lg">{storeName}</span>
      </Link>
      <div className="relative space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
          <Key className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white leading-snug">
          Creá tu nueva contraseña
        </h2>
        <p className="text-blue-200 text-sm leading-relaxed">
          Elegí una contraseña segura de al menos 6 caracteres.
        </p>
      </div>
      <p className="text-blue-400 text-xs relative">
        © {new Date().getFullYear()} {storeName}
      </p>
    </div>
  );

  /* Loading token check */
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 minimal:bg-transparent pt-20 md:pt-28 pb-10 px-4">
        <div className="max-w-4xl mx-auto flex rounded-2xl overflow-hidden shadow-xl border border-gray-100">
          <LeftPanel />
          <div className="flex-1 bg-white flex items-center justify-center px-8 py-16">
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Verificando enlace...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* Invalid token */
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gray-50 minimal:bg-transparent pt-20 md:pt-28 pb-10 px-4">
        <div className="max-w-4xl mx-auto flex rounded-2xl overflow-hidden shadow-xl border border-gray-100">
          <LeftPanel />
          <div className="flex-1 bg-white flex flex-col justify-center px-8 py-10">
            <div className="max-w-sm mx-auto w-full text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Enlace inválido</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {tokenError || "El enlace ha expirado o ya fue usado"}
                </p>
              </div>
              <Link
                href="/forgot-password"
                className="block w-full bg-(--tenant-primary) text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-800 transition-colors"
              >
                Solicitar nuevo enlace
              </Link>
              <Link href="/login" className="block text-xs text-gray-400 hover:text-(--tenant-primary) transition-colors">
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 minimal:bg-transparent pt-20 md:pt-28 pb-10 px-4">
      <div className="max-w-4xl mx-auto flex rounded-2xl overflow-hidden shadow-xl border border-gray-100">
        <LeftPanel />

        {/* Right panel */}
        <div className="flex-1 bg-white flex flex-col justify-center px-8 py-10">
          <div className="max-w-sm mx-auto w-full">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-(--tenant-primary) font-medium mb-6 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al inicio de sesión
            </Link>

            {success ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-emerald-500" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">¡Contraseña restablecida!</h2>
                  <p className="text-sm text-gray-400 mt-1">Redirigiendo al inicio de sesión...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <h1 className="text-xl font-bold text-gray-900">Nueva contraseña</h1>
                  <p className="text-sm text-gray-400 mt-1">
                    Para: <span className="text-gray-600 font-medium">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className={`${INPUT} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Repetí tu contraseña"
                        className={`${INPUT} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-(--tenant-primary) text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Restableciendo...</>
                    ) : "Restablecer contraseña"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
