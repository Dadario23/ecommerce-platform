import {
  Truck,
  CreditCard,
  Banknote,
  ShieldCheck,
  Headphones,
  RefreshCw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { BenefitIcon } from "@/config/tenant-themes";

export const BENEFIT_ICONS: Record<BenefitIcon, LucideIcon> = {
  truck: Truck,
  creditCard: CreditCard,
  banknote: Banknote,
  shieldCheck: ShieldCheck,
  headphones: Headphones,
  refresh: RefreshCw,
  sparkles: Sparkles,
};
