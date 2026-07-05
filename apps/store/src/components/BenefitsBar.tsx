import { BENEFIT_ICONS } from "@/config/benefit-icons";
import type { TenantTheme } from "@/config/tenant-themes";

type BenefitsBarProps = {
  items: TenantTheme["benefits"];
  variant?: "solid" | "light";
};

export default function BenefitsBar({ items, variant = "solid" }: BenefitsBarProps) {
  const solid = variant === "solid";
  return (
    <div className={solid ? "bg-(--tenant-primary) mt-4" : "bg-(--tenant-tint) mt-4"}>
      <div
        className={`max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 divide-x ${
          solid ? "divide-(--tenant-on-primary)/15" : "divide-black/5"
        }`}
      >
        {items.map(({ icon, title, subtitle }, i) => {
          const Icon = BENEFIT_ICONS[icon];
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-4 md:py-5">
              <Icon
                className={`w-6 h-6 shrink-0 ${
                  solid ? "text-(--tenant-on-primary)/80" : "text-(--tenant-primary)"
                }`}
              />
              <div>
                <p
                  className={`font-semibold text-sm leading-tight ${
                    solid ? "text-(--tenant-on-primary)" : "text-gray-900"
                  }`}
                >
                  {title}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    solid ? "text-(--tenant-on-primary)/70" : "text-gray-500"
                  }`}
                >
                  {subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
