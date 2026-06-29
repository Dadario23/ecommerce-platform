import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import {
  DollarSign, ShoppingCart, Users, Package,
  TrendingUp, TrendingDown,
} from "lucide-react";

export const revalidate = 60;

const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: "Pendiente",   color: "bg-yellow-400" },
  confirmed:  { label: "Confirmada",  color: "bg-blue-400" },
  processing: { label: "Procesando",  color: "bg-violet-400" },
  shipped:    { label: "Enviada",     color: "bg-indigo-400" },
  delivered:  { label: "Entregada",   color: "bg-emerald-500" },
  cancelled:  { label: "Cancelada",   color: "bg-red-400" },
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") redirect("/");

  const { Order, User, Product } = await getModels();

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalSalesResult,
    thisMonthSalesResult,
    lastMonthSalesResult,
    totalOrders,
    thisMonthOrders,
    totalCustomers,
    thisMonthCustomers,
    totalProducts,
    monthlySales,
    ordersByStatus,
    ordersByPayment,
    topProducts,
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
    User.countDocuments({ role: { $ne: "admin" } }),
    User.countDocuments({ role: { $ne: "admin" }, createdAt: { $gte: startOfMonth } }),
    Product.countDocuments(),
    Order.aggregate([
      { $match: { "payment.status": "completed", createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Order.aggregate([
      { $group: { _id: "$payment.method", count: { $sum: 1 }, revenue: { $sum: "$total" } } },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([
      { $match: { "payment.status": "completed" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          units: { $sum: "$items.quantity" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const totalSales = totalSalesResult[0]?.total ?? 0;
  const thisMonthSales = thisMonthSalesResult[0]?.total ?? 0;
  const lastMonthSales = lastMonthSalesResult[0]?.total ?? 0;

  const salesTrend = lastMonthSales > 0
    ? ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100
    : null;

  // Fill last 6 months even if no sales
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const found = monthlySales.find(
      (m) => m._id.year === d.getFullYear() && m._id.month === d.getMonth() + 1
    );
    return {
      month: MONTH_NAMES[d.getMonth()],
      revenue: found?.revenue ?? 0,
      orders: found?.orders ?? 0,
    };
  });

  const maxRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1);
  const totalOrdersByStatus = ordersByStatus.reduce((a: number, s: { count: number }) => a + s.count, 0);

  const PAYMENT_LABELS: Record<string, string> = {
    mercadopago: "Mercado Pago",
    cash: "Contra entrega",
  };

  return (
    <div className="space-y-5 max-w-7xl">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Ventas totales",
            value: `$${totalSales.toLocaleString("es-AR")}`,
            sub: `$${thisMonthSales.toLocaleString("es-AR")} este mes`,
            icon: DollarSign,
            bg: "bg-blue-50",
            color: "text-blue-600",
            trend: salesTrend,
          },
          {
            title: "Órdenes",
            value: totalOrders.toLocaleString("es-AR"),
            sub: `${thisMonthOrders} este mes`,
            icon: ShoppingCart,
            bg: "bg-violet-50",
            color: "text-violet-600",
            trend: null,
          },
          {
            title: "Clientes",
            value: totalCustomers.toLocaleString("es-AR"),
            sub: `+${thisMonthCustomers} este mes`,
            icon: Users,
            bg: "bg-emerald-50",
            color: "text-emerald-600",
            trend: null,
          },
          {
            title: "Productos",
            value: totalProducts.toLocaleString("es-AR"),
            sub: "en catálogo",
            icon: Package,
            bg: "bg-orange-50",
            color: "text-orange-600",
            trend: null,
          },
        ].map(({ title, value, sub, icon: Icon, bg, color, trend }) => {
          const up = trend !== null && trend !== undefined && trend >= 0;
          const pct = trend !== null && trend !== undefined
            ? Math.abs(Math.round(trend * 10) / 10)
            : null;
          return (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
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
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly revenue bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-5">
            <p className="font-semibold text-gray-900 text-sm">Ingresos últimos 6 meses</p>
            <p className="text-xs text-gray-400 mt-0.5">Solo órdenes con pago completado</p>
          </div>
          <div className="flex items-end justify-between gap-2 h-44">
            {monthlyData.map(({ month, revenue, orders }) => {
              const pct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    ${revenue.toLocaleString("es-AR")}<br/>
                    <span className="text-gray-400">{orders} órdenes</span>
                  </div>
                  {/* Bar */}
                  <div className="w-full rounded-t-lg bg-(--tenant-primary) transition-all duration-500 min-h-1"
                    style={{ height: `${Math.max(pct, 2)}%` }}
                  />
                  {/* Label */}
                  <p className="text-[10px] font-medium text-gray-400">{month}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-semibold text-gray-900 text-sm mb-4">Estado de órdenes</p>
          {ordersByStatus.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {ordersByStatus.map((s: { _id: string; count: number }) => {
                const cfg = STATUS_CONFIG[s._id];
                const pct = totalOrdersByStatus > 0
                  ? Math.round((s.count / totalOrdersByStatus) * 100)
                  : 0;
                return (
                  <div key={s._id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        {cfg?.label ?? s._id}
                      </span>
                      <span className="text-xs font-semibold text-gray-900">
                        {s.count} <span className="text-gray-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${cfg?.color ?? "bg-gray-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="font-semibold text-gray-900 text-sm">Top 5 productos</p>
            <p className="text-xs text-gray-400 mt-0.5">Por ingresos generados</p>
          </div>
          {topProducts.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">Sin datos</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topProducts.map((p: { _id: string; name: string; revenue: number; units: number }, i: number) => {
                const maxRev = topProducts[0]?.revenue ?? 1;
                const pct = (p.revenue / maxRev) * 100;
                return (
                  <div key={String(p._id)} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-bold text-gray-300 w-4 shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm font-medium text-gray-700 truncate">{p.name}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-bold text-gray-900">
                          ${p.revenue.toLocaleString("es-AR")}
                        </p>
                        <p className="text-[10px] text-gray-400">{p.units} uds</p>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden ml-6">
                      <div
                        className="h-full bg-(--tenant-primary) rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment methods */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="font-semibold text-gray-900 text-sm">Métodos de pago</p>
            <p className="text-xs text-gray-400 mt-0.5">Distribución de órdenes</p>
          </div>
          {ordersByPayment.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">Sin datos</div>
          ) : (
            <div className="p-5 space-y-4">
              {ordersByPayment.map((p: { _id: string; count: number; revenue: number }) => {
                const totalCount = ordersByPayment.reduce((a: number, x: { count: number }) => a + x.count, 0);
                const pct = totalCount > 0 ? Math.round((p.count / totalCount) * 100) : 0;
                const colors: Record<string, string> = {
                  mercadopago: "bg-[#009ee3]",
                  cash: "bg-emerald-500",
                };
                const bgColor = colors[p._id] ?? "bg-gray-400";
                return (
                  <div key={p._id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${bgColor}`} />
                        <span className="text-sm font-medium text-gray-700">
                          {PAYMENT_LABELS[p._id] ?? p._id}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{pct}%</span>
                        <span className="text-xs text-gray-400 ml-1.5">({p.count} órdenes)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${bgColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      ${p.revenue.toLocaleString("es-AR")} generados
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
