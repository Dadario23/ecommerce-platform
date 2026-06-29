import {
  Smartphone,
  Building2,
  Shield,
  Clock,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import TrackingSearch from "../TrackingSearch";

export const revalidate = 300;

const WA_NUMBER = "5491150610043";
const WA_EMPRESA = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
  "Hola! Soy de una empresa y quiero consultar sobre soporte técnico para nuestros equipos."
)}`;

const PERSONAL_SERVICES = [
  "Cambio de módulo / pantalla",
  "Cambio de batería",
  "Reparación de pin de carga",
  "Reparación de computadoras",
  "Formateo y optimización",
  "Limpieza y mantenimiento",
];

const ENTERPRISE_SERVICES = [
  "Mantenimiento preventivo de equipos",
  "Soporte técnico en sitio",
  "Formateo y configuración en escala",
  "Instalación de redes y cableado",
  "Asesoría en compra de hardware",
  "Contratos de soporte mensual",
];

export default function SoporteTecnicoPage() {
  return (
    <main className="pb-20 bg-gray-50 min-h-screen">

      {/* ── HERO ── */}
      <section className="bg-(--tenant-primary) text-white pt-20 pb-12 md:pt-24 md:pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-3">
            Compumobile · Soporte Técnico
          </p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-3">
            Tu equipo en buenas manos
          </h1>
          <p className="text-blue-200 text-sm md:text-base max-w-lg mx-auto">
            Reparamos celulares y computadoras con repuestos de calidad.
            También brindamos soporte técnico a empresas y pymes.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4">

        {/* ── SERVICE CARDS ── */}
        <div className="grid md:grid-cols-2 gap-4 -mt-6">
          {/* Particulares */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Smartphone className="w-4.5 h-4.5 text-(--tenant-primary)" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Clientes Particulares</p>
                <p className="text-xs text-gray-400">Celulares y computadoras</p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {PERSONAL_SERVICES.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-(--tenant-primary) shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Empresas */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Building2 className="w-4.5 h-4.5 text-(--tenant-primary)" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Empresas y Pymes</p>
                <p className="text-xs text-gray-400">Soporte empresarial</p>
              </div>
            </div>
            <ul className="space-y-1.5 mb-4">
              {ENTERPRISE_SERVICES.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-(--tenant-primary) shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
            <a
              href={WA_EMPRESA}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-(--tenant-primary) hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Consultar para mi empresa
            </a>
          </div>
        </div>

        {/* ── CHATBOT CTA ── */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-(--tenant-primary) flex items-center justify-center shrink-0 shadow-md">
            <MessageCircle className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900">Autopresupuesto instantáneo</p>
            <p className="text-sm text-gray-500 mt-0.5">
              Tocá el botón azul en la esquina inferior derecha para obtener el precio de tu reparación en segundos.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { icon: Clock,        text: "Respuesta en el día" },
                { icon: Shield,       text: "Repuestos de calidad" },
                { icon: CheckCircle2, text: "Garantía incluida" },
              ].map(({ icon: Icon, text }) => (
                <span
                  key={text}
                  className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100"
                >
                  <Icon className="w-3.5 h-3.5 text-(--tenant-primary)" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── TRACKING ── */}
        <div className="mt-4 rounded-2xl border-2 border-(--tenant-primary) bg-linear-to-br from-blue-50 to-white shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-2 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-(--tenant-primary) flex items-center justify-center shrink-0 shadow-md">
              <span className="text-lg">🔍</span>
            </div>
            <div>
              <p className="font-bold text-gray-900">Seguí tu reparación</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Ingresá el código que te dio el técnico y consultá el estado de tu equipo en tiempo real.
              </p>
            </div>
          </div>

          <div className="px-5 pb-5">
            <TrackingSearch />
            <p className="text-xs text-gray-400 mt-2">
              El código tiene el formato <span className="font-mono font-semibold text-gray-500">CM-0001</span>. Si no lo tenés,{" "}
              <Link href="/soporte-tecnico/seguimiento" className="text-(--tenant-primary) hover:underline font-medium">
                ingresá con tu cuenta
              </Link>{" "}
              para ver todos tus equipos.
            </p>
          </div>
        </div>

        {/* ── ENTERPRISE CTA ── */}
        <div className="mt-5 bg-gray-900 text-white rounded-2xl p-5 md:p-7 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Para empresas</p>
            <h3 className="text-lg font-bold mb-1">¿Necesitás soporte técnico continuo?</h3>
            <p className="text-sm text-gray-400 max-w-sm">
              Contratos de mantenimiento mensual para mantener tus equipos funcionando sin interrupciones.
            </p>
          </div>
          <a
            href={WA_EMPRESA}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            <MessageCircle className="w-4 h-4" />
            Hablar con un asesor
          </a>
        </div>

      </div>
    </main>
  );
}
