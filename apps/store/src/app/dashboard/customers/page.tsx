import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import { Users, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";

export const revalidate = 60;

function StatCard({
  title, value, icon, bg, color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-xs font-medium text-gray-500">{title}</p>
    </div>
  );
}

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") redirect("/");

  const { User, Order } = await getModels();

  const [users, orderStats] = await Promise.all([
    User.find({ role: { $ne: "admin" } })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
    Order.aggregate([
      {
        $group: {
          _id: "$userId",
          orderCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $eq: ["$payment.status", "completed"] }, "$total", 0],
            },
          },
          lastOrderAt: { $max: "$createdAt" },
        },
      },
    ]),
  ]);

  const statsMap = new Map(
    orderStats.map((s) => [String(s._id), s])
  );

  const customers = users.map((u) => {
    const s = statsMap.get(String(u._id));
    return {
      id: String(u._id),
      name: u.name ?? "Sin nombre",
      email: u.email,
      createdAt: (u.createdAt as Date).toISOString(),
      orderCount: s?.orderCount ?? 0,
      totalSpent: s?.totalSpent ?? 0,
      lastOrderAt: s?.lastOrderAt ? (s.lastOrderAt as Date).toISOString() : null,
    };
  });

  const totalCustomers = customers.length;
  const withOrders = customers.filter((c) => c.orderCount > 0).length;
  const totalRevenue = customers.reduce((a, c) => a + c.totalSpent, 0);
  const totalOrderCount = customers.reduce((a, c) => a + c.orderCount, 0);
  const avgSpend = withOrders > 0
    ? Math.round(totalRevenue / withOrders)
    : 0;

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total clientes"
          value={totalCustomers.toLocaleString("es-AR")}
          icon={<Users className="w-5 h-5" />}
          bg="bg-blue-50"
          color="text-blue-600"
        />
        <StatCard
          title="Con compras"
          value={withOrders.toLocaleString("es-AR")}
          icon={<ShoppingCart className="w-5 h-5" />}
          bg="bg-emerald-50"
          color="text-emerald-600"
        />
        <StatCard
          title="Total generado"
          value={`$${totalRevenue.toLocaleString("es-AR")}`}
          icon={<DollarSign className="w-5 h-5" />}
          bg="bg-violet-50"
          color="text-violet-600"
        />
        <StatCard
          title="Gasto promedio"
          value={`$${avgSpend.toLocaleString("es-AR")}`}
          icon={<TrendingUp className="w-5 h-5" />}
          bg="bg-orange-50"
          color="text-orange-600"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-900 text-sm">
            {totalCustomers.toLocaleString("es-AR")}{" "}
            {totalCustomers === 1 ? "cliente" : "clientes"} ·{" "}
            <span className="text-gray-400 font-normal">
              {totalOrderCount} órdenes en total
            </span>
          </p>
        </div>

        {/* Column headers */}
        <div className="hidden md:grid md:grid-cols-[2fr_2.5fr_1fr_1fr_1.2fr] gap-4 px-5 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50 bg-gray-50/50">
          <span>Cliente</span>
          <span>Email</span>
          <span>Registro</span>
          <span>Órdenes</span>
          <span>Total gastado</span>
        </div>

        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-gray-300" />
            </div>
            <p className="font-semibold text-gray-700 mb-1">Sin clientes registrados</p>
            <p className="text-sm text-gray-400">Los clientes aparecerán aquí cuando se registren</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {customers.map((c) => {
              const initials = c.name
                .split(" ")
                .map((w: string) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={c.id}
                  className="flex flex-col md:grid md:grid-cols-[2fr_2.5fr_1fr_1fr_1.2fr] md:items-center gap-1.5 md:gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {initials}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {c.name}
                    </p>
                  </div>

                  {/* Email */}
                  <p className="text-sm text-gray-500 truncate">{c.email}</p>

                  {/* Registration date */}
                  <p className="text-xs text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString("es-AR")}
                  </p>

                  {/* Order count */}
                  <div>
                    {c.orderCount > 0 ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {c.orderCount} {c.orderCount === 1 ? "orden" : "órdenes"}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-gray-400">
                        Sin órdenes
                      </span>
                    )}
                  </div>

                  {/* Total spent */}
                  <p className={`text-sm font-bold ${c.totalSpent > 0 ? "text-gray-900" : "text-gray-300"}`}>
                    {c.totalSpent > 0
                      ? `$${c.totalSpent.toLocaleString("es-AR")}`
                      : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
