import { Truck, CreditCard, Headphones, ShieldCheck } from "lucide-react";

const benefits = [
  {
    icon: Truck,
    title: "Envío gratis",
    subtitle: "A todo el país",
  },
  {
    icon: CreditCard,
    title: "12 cuotas sin interés",
    subtitle: "Con todas las tarjetas",
  },
  {
    icon: ShieldCheck,
    title: "Compra protegida",
    subtitle: "Garantía oficial 12 meses",
  },
  {
    icon: Headphones,
    title: "Soporte 24/7",
    subtitle: "Estamos para ayudarte",
  },
];

export default function BenefitsBar() {
  return (
    <div className="bg-[#1E3A8A] mt-4">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 divide-x divide-blue-700">
        {benefits.map(({ icon: Icon, title, subtitle }, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-4 md:py-5"
          >
            <Icon className="w-6 h-6 text-blue-300 shrink-0" />
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{title}</p>
              <p className="text-blue-200 text-xs mt-0.5">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
