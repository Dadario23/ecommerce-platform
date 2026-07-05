import { BENEFIT_ICONS } from "@/config/benefit-icons";
import type { TenantTheme } from "@/config/tenant-themes";

export default function PromoBar({ items }: { items: TenantTheme["promoItems"] }) {
  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-6 py-2 overflow-x-auto scrollbar-none">
          {items.map(({ icon, text }, i) => {
            const Icon = BENEFIT_ICONS[icon];
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-gray-700 shrink-0"
              >
                <Icon className="w-4 h-4 text-(--tenant-primary) shrink-0" />
                {text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
