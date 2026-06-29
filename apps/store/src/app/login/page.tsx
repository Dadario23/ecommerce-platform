import LoginForm from "@/components/auth/LoginForm";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

const BENEFITS = [
  "Envíos a todo el país",
  "12 cuotas sin interés",
  "Garantía oficial en todos los productos",
];

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 md:pt-28 pb-10 px-4">
      <div className="max-w-4xl mx-auto flex rounded-2xl overflow-hidden shadow-xl border border-gray-100">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-5/12 bg-(--tenant-primary) flex-col justify-between p-10 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full bg-white/5" />

          <Link href="/" className="relative flex items-center gap-3">
            <div className="relative w-8 h-8 shrink-0">
              <Image src="/logo.svg" alt="Logo" fill className="object-contain brightness-0 invert" />
            </div>
            <span className="text-white font-bold text-lg">Compumobile</span>
          </Link>

          <div className="relative space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white leading-snug">
                Todo lo que necesitás para tu tecnología
              </h2>
              <p className="text-blue-200 text-sm mt-2 leading-relaxed">
                Celulares, accesorios y más al mejor precio.
              </p>
            </div>
            <ul className="space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-blue-100 text-sm">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-blue-400 text-xs relative">
            © {new Date().getFullYear()} Compumobile
          </p>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-white flex flex-col justify-center px-8 py-10">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-7">
              <h1 className="text-xl font-bold text-gray-900">Iniciá sesión</h1>
              <p className="text-sm text-gray-400 mt-1">Ingresá a tu cuenta para continuar</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
