"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const INPUT =
  "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 placeholder:text-gray-300 transition-colors";

interface LoginFormProps {
  fromCart?: boolean;
}

export default function LoginForm({ fromCart = false }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const [errorMessage, setErrorMessage] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const callbackUrl = fromCart ? "/order" : "/";

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage("");
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      callbackUrl,
    });
    if (res?.error) setErrorMessage("Email o contraseña incorrectos");
  };

  const handleGoogle = () => {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl }).catch(() => setIsGoogleLoading(false));
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder="••••••••"
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

        {/* Error */}
        {errorMessage && (
          <p className="text-xs text-red-500 text-center bg-red-50 border border-red-100 rounded-xl py-2 px-3">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#1E3A8A] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Ingresando...</>
          ) : "Ingresar"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400">o</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Google */}
      <button
        type="button"
        disabled={isGoogleLoading}
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-2.5 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60"
      >
        {isGoogleLoading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Conectando...</>
        ) : (
          <><FcGoogle className="text-xl" /> Continuar con Google</>
        )}
      </button>

      {/* Links */}
      <div className="text-center text-xs text-gray-500 space-y-1.5 pt-1">
        <p>
          <Link href="/forgot-password" className="text-[#1E3A8A] font-semibold hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
        <p>
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="text-[#1E3A8A] font-semibold hover:underline">
            Registrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
