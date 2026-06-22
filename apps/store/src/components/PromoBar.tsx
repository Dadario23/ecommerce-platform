import { Truck, CreditCard, Banknote, Shield } from "lucide-react";

const items = [
  { icon: Truck, text: "Envíos gratis", color: "text-emerald-600" },
  { icon: CreditCard, text: "cuotas sin interés", color: "text-blue-500" },
  {
    icon: Banknote,
    text: "20% OFF pagando con transferencia",
    color: "text-green-700",
  },
  { icon: Shield, text: "Garantía oficial ", color: "text-emerald-800" },
];

export default function PromoBar() {
  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-6 py-2 overflow-x-auto scrollbar-none">
          {items.map(({ icon: Icon, text, color }, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-gray-700 shrink-0"
            >
              <Icon className={`w-4 h-4 ${color} shrink-0`} />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
