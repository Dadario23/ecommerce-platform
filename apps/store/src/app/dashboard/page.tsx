import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import { type IOrder } from "@/models/Order";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  FolderOpen,
  Tag,
} from "lucide-react";

export const revalidate = 60;

const STATUS_CONFIG: Record<string, { label: string; pill: string }> = {
  pending:    { label: "Pendiente",   pill: "bg-yellow-100 text-yellow-700" },
  confirmed:  { label: "Confirmada",  pill: "bg-blue-100 text-blue-700" },
  processing: { label: "Procesando",  pill: "bg-violet-100 text-violet-700" },
  shipped:    { label: "Enviada",     pill: "bg-indigo-100 text-indigo-700" },
  delivered:  { label: "Entregada",   pill: "bg-green-100 text-green-700" },
  cancelled:  { label: "Cancelada",   pill: "bg-red-100 text-red-700" },
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") redirect("/");

  const { Order, User, Product } = await getModels();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalSalesResult,
    thisMonthSalesResult,
    lastMonthSalesResult,
    totalOrders,
    thisMonthOrders,
    lastMonthOrders,
    totalCustomers,
    thisMonthCustomers,
    lastMonthCustomers,
    totalProducts,
    recentOrders,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { "payment.status": "completed" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      { $match: { "payment.status": "completed", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      { $match: { "payment.status": "completed", createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Order.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    User.countDocuments({ role: { $ne: "admin" } }),
    User.countDocuments({ role: { $ne: "admin" }, createdAt: { $gte: startOfMonth } }),
    User.countDocuments({ role: { $ne: "admin" }, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
    Product.countDocuments(),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select("orderNumber customerEmail total status createdAt")
      .lean<IOrder[]>(),
  ]);

  const totalSales = totalSalesResult[0]?.total ?? 0;
  const thisMonthSales = thisMonthSalesResult[0]?.total ?? 0;
  const lastMonthSales = lastMonthSalesResult[0]?.total ?? 0;

  function trend(current: number, last: number) {
    if (last === 0) return null;
    return ((current - last) / last) * 100;
  }

  const salesTrend = trend(thisMonthSales, lastMonthSales);
  const ordersTrend = trend(thisMonthOrders, lastMonthOrders);
  const customersTrend = trend(thisMonthCustomers, lastMonthCustomers);

  const monthLabel = now.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bienvenido, {session.user?.name?.split(" ")[0]} 👋</h2>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{monthLabel}</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 bg-[#1E3A8A] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo producto
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventas totales"
          value={`$${totalSales.toLocaleString("es-AR")}`}
          icon={DollarSign}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          sub={`$${thisMonthSales.toLocaleString("es-AR")} este mes`}
          trend={salesTrend}
        />
        <StatCard
          title="Órdenes"
          value={totalOrders.toLocaleString("es-AR")}
          icon={ShoppingCart}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          sub={`${thisMonthOrders} este mes`}
          trend={ordersTrend}
        />
        <StatCard
          title="Clientes"
          value={totalCustomers.toLocaleString("es-AR")}
          icon={Users}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sub={`+${thisMonthCustomers} este mes`}
          trend={customersTrend}
        />
        <StatCard
          title="Productos"
          value={totalProducts.toLocaleString("es-AR")}
          icon={Package}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          sub="en catálogo"
        />
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <p className="font-semibold text-gray-900 text-sm">Órdenes recientes</p>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-1 text-xs text-[#1E3A8A] font-semibold hover:underline"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              No hay órdenes todavía
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                return (
                  <Link
                    key={String(order._id)}
                    href={`/dashboard/orders`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 font-mono">
                        #{order.orderNumber}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {order.customerEmail}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.pill}`}>
                        {cfg.label}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        ${order.total.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="font-semibold text-gray-900 text-sm">Acciones rápidas</p>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { href: "/dashboard/orders", icon: ShoppingCart, label: "Órdenes", bg: "bg-violet-50", color: "text-violet-600" },
              { href: "/dashboard/products/new", icon: Plus, label: "Nuevo producto", bg: "bg-blue-50", color: "text-blue-600" },
              { href: "/dashboard/categories", icon: FolderOpen, label: "Categorías", bg: "bg-orange-50", color: "text-orange-600" },
              { href: "/dashboard/coupons", icon: Tag, label: "Cupones", bg: "bg-emerald-50", color: "text-emerald-600" },
            ].map(({ href, icon: Icon, label, bg, color }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all text-center"
              >
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className="text-xs font-semibold text-gray-700 leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  sub,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  sub?: string;
  trend?: number | null;
}) {
  const up = trend !== null && trend !== undefined && trend >= 0;
  const pct = trend !== null && trend !== undefined ? Math.abs(Math.round(trend * 10) / 10) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {pct !== null && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
          }`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {pct}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs font-medium text-gray-500">{title}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
