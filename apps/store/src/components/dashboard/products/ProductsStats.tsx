import { StatCard } from "../shared/StatCard";
import { Package, Eye, AlertCircle, BarChart2 } from "lucide-react";

interface ProductsStatsProps {
  total: number;
  active: number;
  outOfStock: number;
  lowStock: number;
}

export function ProductsStats({ total, active, outOfStock, lowStock }: ProductsStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total productos"
        value={total}
        icon={<Package className="w-5 h-5 text-blue-600" />}
        iconBg="bg-blue-50"
      />
      <StatCard
        title="Publicados"
        value={active}
        icon={<Eye className="w-5 h-5 text-emerald-600" />}
        iconBg="bg-emerald-50"
      />
      <StatCard
        title="Sin stock"
        value={outOfStock}
        icon={<AlertCircle className="w-5 h-5 text-red-500" />}
        iconBg="bg-red-50"
      />
      <StatCard
        title="Stock bajo"
        value={lowStock}
        icon={<BarChart2 className="w-5 h-5 text-orange-500" />}
        iconBg="bg-orange-50"
      />
    </div>
  );
}
