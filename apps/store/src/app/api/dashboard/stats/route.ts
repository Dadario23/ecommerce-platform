import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getModels } from "@/lib/tenant-models";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { Cart, Category, Coupon, Notification, Order, Presupuesto, Product, RepairCatalog, Reparacion, Review, Setting, ShippingConfig, User } = await getModels();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    totalOrdersResult,
    totalSalesResult,
    lastMonthSalesResult,
    thisMonthSalesResult,
    totalCustomers,
    lastMonthCustomers,
    thisMonthCustomers,
    totalProducts,
    recentOrders,
    monthlySales,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([
      { $match: { "payment.status": "completed" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      {
        $match: {
          "payment.status": "completed",
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    Order.aggregate([
      {
        $match: {
          "payment.status": "completed",
          createdAt: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]),
    User.countDocuments({ role: { $ne: "admin" } }),
    User.countDocuments({
      role: { $ne: "admin" },
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    }),
    User.countDocuments({
      role: { $ne: "admin" },
      createdAt: { $gte: startOfMonth },
    }),
    Product.countDocuments(),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderNumber customerEmail total status createdAt payment.method")
      .lean(),
    // Ventas por mes (últimos 6 meses)
    Order.aggregate([
      {
        $match: {
          "payment.status": "completed",
          createdAt: {
            $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
          },
        },
      },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          total: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  const totalSales = totalSalesResult[0]?.total ?? 0;
  const lastMonthSales = lastMonthSalesResult[0]?.total ?? 0;
  const thisMonthSales = thisMonthSalesResult[0]?.total ?? 0;

  const salesTrend =
    lastMonthSales > 0
      ? ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100
      : 0;

  const customersTrend =
    lastMonthCustomers > 0
      ? ((thisMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100
      : 0;

  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  return NextResponse.json({
    totalSales,
    totalOrders: totalOrdersResult,
    totalCustomers,
    totalProducts,
    thisMonthSales,
    salesTrend: Math.round(salesTrend * 10) / 10,
    customersTrend: Math.round(customersTrend * 10) / 10,
    recentOrders,
    monthlySales: monthlySales.map((m) => ({
      month: months[m._id.month - 1],
      total: m.total,
      count: m.count,
    })),
  });
}
