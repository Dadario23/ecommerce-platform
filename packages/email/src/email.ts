import { Resend } from "resend";

function storeConfig() {
  return {
    name: process.env.NEXT_PUBLIC_STORE_NAME ?? "Mi Tienda",
    url: process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000",
    fromEmail: process.env.FROM_EMAIL ?? "no-reply@example.com",
    transferAlias: process.env.TRANSFER_ALIAS ?? "",
    transferCvu: process.env.TRANSFER_CVU ?? "",
  };
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface OrderEmailData {
  orderNumber: string;
  orderId?: string;
  customerEmail: string;
  customerName?: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface OrderStatusData {
  orderNumber: string;
  orderId: string;
  customerEmail: string;
  customerName?: string;
  newStatus: string;
}

export interface RepairStatusData {
  codigo: string;
  clienteNombre: string;
  clienteEmail: string;
  equipoMarca: string;
  equipoModelo: string;
  newStatus: string;
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente", confirmed: "Confirmado", processing: "En preparación",
  shipped: "Enviado", delivered: "Entregado", cancelled: "Cancelado",
};

const ORDER_STATUS_ICON: Record<string, string> = {
  pending: "⏳", confirmed: "✅", processing: "📦",
  shipped: "🚚", delivered: "🏠", cancelled: "❌",
};

const REPAIR_STATUS_LABEL: Record<string, string> = {
  recibido: "Recibido", diagnosticado: "Diagnosticado", en_reparacion: "En reparación",
  esperando_repuestos: "Esperando repuestos", listo: "Listo para retirar",
  entregado: "Entregado", cancelado: "Cancelado", sin_reparacion: "Sin reparación posible",
};

const REPAIR_STATUS_ICON: Record<string, string> = {
  recibido: "📥", diagnosticado: "🔍", en_reparacion: "🔧",
  esperando_repuestos: "⏳", listo: "✅", entregado: "🏠",
  cancelado: "❌", sin_reparacion: "🚫",
};

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function isResendConfigured() {
  const key = process.env.RESEND_API_KEY;
  return key && !key.startsWith("re_xxx");
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  if (!isResendConfigured()) { console.warn("[email] RESEND_API_KEY no configurado."); return; }
  const { name, url, fromEmail, transferAlias, transferCvu } = storeConfig();
  const isTransfer = data.paymentMethod === "transfer";
  const paymentLabel = data.paymentMethod === "mercadopago" ? "Mercado Pago"
    : isTransfer ? "Transferencia bancaria (contraentrega)" : "Efectivo (contraentrega)";
  const payPageUrl = data.orderId ? `${url}/pay/${data.orderId}` : null;
  const addr = data.shippingAddress;

  const transferBlock = isTransfer && transferAlias ? `
    <div style="margin-top:20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;">
      <h3 style="font-size:13px;color:#166534;margin:0 0 12px;">Datos para transferir al repartidor</h3>
      <p style="margin:4px 0 0;font-size:16px;font-weight:bold;color:#166534;font-family:monospace;">${transferAlias}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#374151;font-family:monospace;">${transferCvu}</p>
      ${payPageUrl ? `<div style="text-align:center;margin-top:16px;"><a href="${payPageUrl}" style="display:inline-block;background:#166534;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:bold;">Ver página de pago con QR</a></div>` : ""}
    </div>` : "";

  const itemsHtml = data.items.map((item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">${item.name} <span style="color:#888;">x${item.quantity}</span></td>
      <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;color:#333;">$${(item.price * item.quantity).toLocaleString("es-AR")}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html lang="es"><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#1E3A8A;padding:28px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">${name}</h1>
      <p style="color:#93c5fd;margin:6px 0 0;font-size:13px;">Confirmación de pedido</p>
    </td></tr>
    <tr><td style="padding:32px 40px;">
      <p style="font-size:16px;color:#333;">Hola${data.customerName ? `, ${data.customerName.split(" ")[0]}` : ""}!</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;">Número de pedido</p>
        <p style="margin:6px 0 0;font-size:20px;font-weight:bold;color:#1E3A8A;">${data.orderNumber}</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">${itemsHtml}
        <tr><td style="padding:12px 0 0;font-weight:bold;font-size:15px;">Total</td>
        <td style="padding:12px 0 0;text-align:right;font-weight:bold;font-size:15px;color:#1E3A8A;">$${data.total.toLocaleString("es-AR")}</td></tr>
      </table>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f0f0f0;">
        <p style="font-size:14px;color:#555;">${addr.firstName} ${addr.lastName}<br>${addr.street}<br>${addr.city}, ${addr.state} ${addr.zipCode}</p>
        <p style="font-size:13px;color:#888;">Método de pago: <strong>${paymentLabel}</strong></p>
      </div>
      ${transferBlock}
      <div style="text-align:center;margin-top:32px;">
        <a href="${url}/account/orders" style="display:inline-block;background:#1E3A8A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:bold;">Ver mis pedidos</a>
      </div>
    </td></tr>
    <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#aaa;">© ${new Date().getFullYear()} ${name}. Todos los derechos reservados.</p>
    </td></tr>
  </table></td></tr></table></body></html>`;

  try {
    await getResend().emails.send({ from: fromEmail, to: data.customerEmail, subject: `✅ Pedido ${data.orderNumber} confirmado — ${name}`, html });
  } catch (err) { console.error("[email] Error enviando confirmación:", err); }
}

export async function sendOrderStatusUpdate(data: OrderStatusData): Promise<void> {
  if (!isResendConfigured()) { console.warn("[email] RESEND_API_KEY no configurado."); return; }
  const { name, url, fromEmail } = storeConfig();
  const label = ORDER_STATUS_LABEL[data.newStatus] ?? data.newStatus;
  const icon = ORDER_STATUS_ICON[data.newStatus] ?? "📋";

  const html = `<!DOCTYPE html><html lang="es"><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#1E3A8A;padding:28px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">${name}</h1>
      <p style="color:#93c5fd;margin:6px 0 0;font-size:13px;">Actualización de pedido</p>
    </td></tr>
    <tr><td style="padding:32px 40px;text-align:center;">
      <p style="font-size:16px;color:#333;">Hola${data.customerName ? `, ${data.customerName.split(" ")[0]}` : ""}!</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;">Pedido</p>
        <p style="margin:6px 0 0;font-size:20px;font-weight:bold;color:#1E3A8A;">${data.orderNumber}</p>
      </div>
      <span style="display:inline-block;background:#EFF6FF;color:#1E3A8A;border:1px solid #BFDBFE;border-radius:9999px;padding:8px 20px;font-size:16px;font-weight:bold;">${icon} ${label}</span>
      <div style="margin-top:28px;">
        <a href="${url}/account/orders" style="display:inline-block;background:#1E3A8A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:bold;">Ver mis pedidos</a>
      </div>
    </td></tr>
    <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#aaa;">© ${new Date().getFullYear()} ${name}.</p>
    </td></tr>
  </table></td></tr></table></body></html>`;

  try {
    await getResend().emails.send({ from: fromEmail, to: data.customerEmail, subject: `📦 Pedido ${data.orderNumber}: ${label} — ${name}`, html });
  } catch (err) { console.error("[email] Error enviando estado de orden:", err); }
}

export async function sendRepairStatusUpdate(data: RepairStatusData): Promise<void> {
  if (!isResendConfigured()) { console.warn("[email] RESEND_API_KEY no configurado."); return; }
  const { name, url, fromEmail } = storeConfig();
  const label = REPAIR_STATUS_LABEL[data.newStatus] ?? data.newStatus;
  const icon = REPAIR_STATUS_ICON[data.newStatus] ?? "🔧";
  const trackingUrl = `${url}/soporte-tecnico/seguimiento/${data.codigo}`;

  const html = `<!DOCTYPE html><html lang="es"><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
    <tr><td style="background:#1E3A8A;padding:28px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">${name}</h1>
      <p style="color:#93c5fd;margin:6px 0 0;font-size:13px;">Actualización de reparación</p>
    </td></tr>
    <tr><td style="padding:32px 40px;text-align:center;">
      <p style="font-size:16px;color:#333;">Hola, ${data.clienteNombre.split(" ")[0]}!</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;">Reparación</p>
        <p style="margin:6px 0 4px;font-size:20px;font-weight:bold;color:#1E3A8A;">${data.codigo}</p>
        <p style="margin:0;font-size:13px;color:#555;">${data.equipoMarca} ${data.equipoModelo}</p>
      </div>
      <span style="display:inline-block;background:#EFF6FF;color:#1E3A8A;border:1px solid #BFDBFE;border-radius:9999px;padding:8px 20px;font-size:16px;font-weight:bold;">${icon} ${label}</span>
      <div style="margin-top:28px;">
        <a href="${trackingUrl}" style="display:inline-block;background:#1E3A8A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:bold;">Ver estado de mi reparación</a>
      </div>
    </td></tr>
    <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#aaa;">© ${new Date().getFullYear()} ${name}.</p>
    </td></tr>
  </table></td></tr></table></body></html>`;

  try {
    await getResend().emails.send({ from: fromEmail, to: data.clienteEmail, subject: `🔧 Reparación ${data.codigo}: ${label} — ${name}`, html });
  } catch (err) { console.error("[email] Error enviando estado de reparación:", err); }
}
