"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";

const registerSchema = z
  .object({
    name: z.string().min(2, "El nombre es demasiado corto"),
    email: z.string().email("Correo inválido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
    newsletter: z.boolean().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const INPUT =
  "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 placeholder:text-gray-300 transition-colors";

export default function RegisterForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMsg("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          newsletter: data.newsletter ?? false,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "Error al registrarse");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setErrorMsg("Error de conexión. Intentá de nuevo.");
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-emerald-500" />
        </div>
        <p className="font-semibold text-gray-800">¡Cuenta creada!</p>
        <p className="text-sm text-gray-400">Redirigiendo al inicio de sesión...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1.5 block">
          Nombre completo
        </label>
        <input
          type="text"
          placeholder="Juan Pérez"
          {...register("name")}
          className={INPUT}
        />
        {errors.name && (
          <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1.5 block">
          Correo electrónico
        </label>
        <input
          type="email"
          placeholder="ejemplo@mail.com"
          {...register("email")}
          className={INPUT}
        />
        {errors.email && (
          <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1.5 block">
          Contraseña
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 6 caracteres"
            {...register("password")}
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
        {errors.password && (
          <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1.5 block">
          Confirmar contraseña
        </label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Repetí tu contraseña"
            {...register("confirmPassword")}
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
        {errors.confirmPassword && (
          <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Newsletter */}
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          {...register("newsletter")}
          className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-(--tenant-primary)"
        />
        <span className="text-xs text-gray-500 leading-relaxed">
          Quiero recibir ofertas y novedades por email
        </span>
      </label>

      {/* Error */}
      {errorMsg && (
        <p className="text-xs text-red-500 text-center bg-red-50 border border-red-100 rounded-xl py-2 px-3">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-(--tenant-primary) text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</>
        ) : "Crear cuenta"}
      </button>

      <p className="text-xs text-center text-gray-500">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="text-(--tenant-primary) font-semibold hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </form>
  );
}
