import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import { type IOrder } from "@/models/Order";
import OrdersTable from "./OrdersTable";

export const revalidate = 0;

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") redirect("/");

  const { Order } = await getModels();

  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(100)
    .lean<IOrder[]>();

  const serialized = orders.map((o) => ({
    id: String(o._id),
    orderNumber: o.orderNumber,
    customerEmail: o.customerEmail,
    total: o.total,
    status: o.status,
    paymentMethod: o.payment.method,
    paymentStatus: o.payment.status,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    shippingAddress: o.shippingAddress,
  }));

  return <OrdersTable orders={serialized} />;
}
