import { getModels } from "@/lib/tenant-models";
import { ESTADO_LABEL } from "@/lib/reparacion-config";
import {
  sendOrderStatusUpdate,
  sendRepairStatusUpdate,
} from "@/lib/email";

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  processing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export async function notifyOrderStatusChange(
  order: {
    _id: unknown;
    orderNumber: string;
    customerEmail: string;
    customerName?: string;
    userId?: unknown;
  },
  newStatus: string
) {
  try {
    await sendOrderStatusUpdate({
      orderNumber: order.orderNumber,
      orderId: String(order._id),
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      newStatus,
    });

    if (order.userId) {
      const { Notification } = await getModels();
      await Notification.create({
        userId: order.userId,
        type: "order_status",
        title: `Pedido ${order.orderNumber}`,
        message: `Tu pedido pasó a: ${ORDER_STATUS_LABEL[newStatus] ?? newStatus}`,
        link: "/account/orders",
        relatedId: String(order._id),
        relatedCode: order.orderNumber,
      });
    }
  } catch (err) {
    console.error("[notify] notifyOrderStatusChange:", err);
  }
}

export async function notifyRepairStatusChange(
  repair: {
    _id: unknown;
    codigo: string;
    cliente: { nombre: string; email?: string };
    equipo: { marca: string; modelo: string };
    userId?: unknown;
  },
  newStatus: string
) {
  try {
    if (repair.cliente?.email) {
      await sendRepairStatusUpdate({
        codigo: repair.codigo,
        clienteNombre: repair.cliente.nombre,
        clienteEmail: repair.cliente.email,
        equipoMarca: repair.equipo.marca,
        equipoModelo: repair.equipo.modelo,
        newStatus,
      });
    }

    if (repair.userId) {
      const { Notification } = await getModels();
      await Notification.create({
        userId: repair.userId,
        type: "repair_status",
        title: `Reparación ${repair.codigo}`,
        message: `Tu equipo pasó a: ${ESTADO_LABEL[newStatus as keyof typeof ESTADO_LABEL] ?? newStatus}`,
        link: `/soporte-tecnico/seguimiento/${repair.codigo}`,
        relatedId: String(repair._id),
        relatedCode: repair.codigo,
      });
    }
  } catch (err) {
    console.error("[notify] notifyRepairStatusChange:", err);
  }
}
