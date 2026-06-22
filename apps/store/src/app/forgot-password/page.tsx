"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2, Mail, CheckCircle, AlertCircle, ArrowLeft, Copy, Check,
} from "lucide-react";

const INPUT =
  "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 placeholder:text-gray-300 transition-colors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Ingresá tu email"); return; }
    setLoading(true);
    setError("");
    setMessage("");
    setResetUrl("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al enviar el email");
      } else {
        setMessage(data.message);
        if (data.resetUrl) setResetUrl(data.resetUrl);
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 md:pt-28 pb-10 px-4">
      <div className="max-w-4xl mx-auto flex rounded-2xl overflow-hidden shadow-xl border border-gray-100">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-5/12 bg-[#1E3A8A] flex-col justify-between p-10 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full bg-white/5" />

          <Link href="/" className="relative flex items-center gap-3">
            <div className="relative w-8 h-8 shrink-0">
              <Image src="/logo.svg" alt="Logo" fill className="object-contain brightness-0 invert" />
            </div>
            <span className="text-white font-bold text-lg">Compumobile</span>
          </Link>

          <div className="relative space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white leading-snug">
              Recuperá el acceso a tu cuenta
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              Te enviamos un email con un enlace seguro para restablecer tu contraseña.
            </p>
          </div>

          <p className="text-blue-400 text-xs relative">
            © {new Date().getFullYear()} Compumobile
          </p>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-white flex flex-col justify-center px-8 py-10">
          <div className="max-w-sm mx-auto w-full">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#1E3A8A] font-medium mb-6 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al inicio de sesión
            </Link>

            <div className="mb-7">
              <h1 className="text-xl font-bold text-gray-900">Recuperar contraseña</h1>
              <p className="text-sm text-gray-400 mt-1">
                Ingresá tu email y te enviamos el enlace
              </p>
            </div>

            {message ? (
              /* Success state */
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-800">{message}</p>
                </div>

                {/* Dev mode: show reset link */}
                {resetUrl && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                    <p className="text-xs font-semibold text-blue-700">Enlace de desarrollo:</p>
                    <p className="text-[11px] text-blue-600 break-all font-mono">{resetUrl}</p>
                    <button
                      onClick={copyUrl}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 mt-1"
                    >
                      {copied ? (
                        <><Check className="w-3.5 h-3.5" /> Copiado</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copiar enlace</>
                      )}
                    </button>
                  </div>
                )}

                <Link
                  href="/login"
                  className="block w-full text-center bg-[#1E3A8A] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-800 transition-colors"
                >
                  Volver al inicio de sesión
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@mail.com"
                      disabled={loading}
                      className={`${INPUT} pl-10`}
                    />
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
                  className="w-full bg-[#1E3A8A] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                  ) : "Enviar enlace de recuperación"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
