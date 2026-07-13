import { Resend } from "resend";
import { getBaseUrl } from "@/lib/base-url";
import { getClientConfig } from "@/config/client";
import { getTenantSecrets } from "@/lib/tenant-secrets";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

type EmailContext = {
  storeUrl: string;
  storeName: string;
  fromEmail: string;
  transferAlias: string;
  transferCvu: string;
  primaryColor: string;
  onPrimaryColor: string;
  tint: string;
};

// Identidad del tenant activo al momento del envío — los emails siempre
// se disparan dentro de una request, así que el contexto está disponible.
async function getEmailContext(): Promise<EmailContext> {
  const [config, secrets, storeUrl] = await Promise.all([
    getClientConfig(),
    getTenantSecrets(),
    getBaseUrl(),
  ]);
  return {
    storeUrl,
    storeName: config.storeName,
    fromEmail: secrets.fromEmail,
    transferAlias: secrets.transferAlias,
    transferCvu: secrets.transferCvu,
    primaryColor: config.theme.colors.primary,
    onPrimaryColor: config.theme.colors.onPrimary,
    tint: config.theme.colors.tint,
  };
}

// ── Shell visual compartido ──────────────────────────────────────────────────
// Header/footer con la marca del tenant activo, reutilizado por todos los
// tipos de email para que se vean como un mismo sistema.

function emailShell(opts: { ctx: EmailContext; eyebrow: string; bodyHtml: string; preheader?: string }): string {
  const { ctx, eyebrow, bodyHtml, preheader } = opts;
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charSet="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
          <tr>
            <td style="background:${ctx.primaryColor};padding:36px 40px;text-align:center;">
              <h1 style="color:${ctx.onPrimaryColor};margin:0;font-size:22px;letter-spacing:-.2px;">${ctx.storeName}</h1>
              <p style="color:${ctx.onPrimaryColor};margin:6px 0 0;font-size:13px;opacity:.8;">${eyebrow}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:22px 40px;text-align:center;border-top:1px solid #eef2f7;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} ${ctx.storeName}. Todos los derechos reservados.
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1;">
                Este es un mensaje automático, no es necesario responder.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string, url: string, ctx: EmailContext): string {
  return `
    <div style="text-align:center;margin-top:28px;">
      <a href="${url}" style="display:inline-block;background:${ctx.primaryColor};color:${ctx.onPrimaryColor};text-decoration:none;padding:13px 32px;border-radius:8px;font-size:14px;font-weight:bold;">
        ${text}
      </a>
    </div>`;
}

interface OrderEmailData {
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

function buildOrderConfirmationHtml(data: OrderEmailData, ctx: EmailContext): string {
  const isTransfer = data.paymentMethod === "transfer";
  const paymentLabel =
    data.paymentMethod === "mercadopago"
      ? "Mercado Pago"
      : isTransfer
      ? "Transferencia bancaria (contraentrega)"
      : "Efectivo (contraentrega)";

  const payPageUrl = data.orderId
    ? `${ctx.storeUrl}/pay/${data.orderId}`
    : null;

  const transferBlock = isTransfer ? `
    <div style="margin-top:24px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;">
      <h3 style="font-size:13px;color:#166534;margin:0 0 12px;text-transform:uppercase;letter-spacing:.5px;">
        Datos para transferir al repartidor
      </h3>
      <p style="margin:0 0 6px;font-size:13px;color:#555;">
        Cuando llegue tu pedido podés pagar por transferencia bancaria.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
        <tr>
          <td style="padding:10px 14px;background:#fff;border-radius:8px 8px 0 0;border:1px solid #d1fae5;border-bottom:none;">
            <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;">Alias</p>
            <p style="margin:4px 0 0;font-size:16px;font-weight:bold;color:#166534;font-family:monospace;">${ctx.transferAlias}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background:#fff;border-radius:0 0 8px 8px;border:1px solid #d1fae5;">
            <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;">CVU</p>
            <p style="margin:4px 0 0;font-size:13px;color:#374151;font-family:monospace;">${ctx.transferCvu}</p>
          </td>
        </tr>
      </table>
      ${payPageUrl ? `
      <div style="text-align:center;margin-top:16px;">
        <a href="${payPageUrl}"
          style="display:inline-block;background:#166534;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:bold;">
          Ver página de pago con QR
        </a>
      </div>` : ""}
      <p style="margin:12px 0 0;font-size:11px;color:#888;text-align:center;">
        Mostrá el comprobante al repartidor al recibir el producto.
      </p>
    </div>` : "";


  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
          <span style="font-size:14px;color:#333;">${item.name}</span>
          <span style="font-size:12px;color:#888;"> x${item.quantity}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;color:#333;">
          $${(item.price * item.quantity).toLocaleString("es-AR")}
        </td>
      </tr>`
    )
    .join("");

  const addr = data.shippingAddress;

  const bodyHtml = `
    <p style="font-size:16px;color:#1e293b;margin:0 0 8px;">
      Hola${data.customerName ? `, ${data.customerName.split(" ")[0]}` : ""}! 🎉
    </p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">
      Recibimos tu pedido y lo estamos procesando. Te avisaremos cuando sea despachado.
    </p>

    <div style="background:${ctx.tint};border-radius:12px;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Número de pedido</p>
      <p style="margin:6px 0 0;font-size:20px;font-weight:bold;color:${ctx.primaryColor};">${data.orderNumber}</p>
    </div>

    <h3 style="font-size:14px;color:#1e293b;margin:0 0 12px;text-transform:uppercase;letter-spacing:.5px;">Detalle del pedido</h3>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${itemsHtml}
      <tr>
        <td style="padding:12px 0 0;font-weight:bold;font-size:15px;color:#1e293b;">Total</td>
        <td style="padding:12px 0 0;text-align:right;font-weight:bold;font-size:15px;color:${ctx.primaryColor};">
          $${data.total.toLocaleString("es-AR")}
        </td>
      </tr>
    </table>

    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #f1f5f9;">
      <h3 style="font-size:14px;color:#1e293b;margin:0 0 8px;text-transform:uppercase;letter-spacing:.5px;">Envío a</h3>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
        ${addr.firstName} ${addr.lastName}<br>
        ${addr.street}<br>
        ${addr.city}, ${addr.state} ${addr.zipCode}
      </p>
    </div>

    <div style="margin-top:16px;">
      <p style="margin:0;font-size:13px;color:#94a3b8;">
        Método de pago: <strong style="color:#475569;">${paymentLabel}</strong>
      </p>
    </div>

    ${transferBlock}

    ${ctaButton("Ver mis pedidos", `${ctx.storeUrl}/account/orders`, ctx)}
  `;

  return emailShell({
    ctx,
    eyebrow: "Confirmación de pedido",
    preheader: `Pedido ${data.orderNumber} confirmado — total $${data.total.toLocaleString("es-AR")}`,
    bodyHtml,
  });
}

// ── Order status update ──────────────────────────────────────────────────────

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  processing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const ORDER_STATUS_ICON: Record<string, string> = {
  pending: "⏳",
  confirmed: "✅",
  processing: "📦",
  shipped: "🚚",
  delivered: "🏠",
  cancelled: "❌",
};

export interface OrderStatusData {
  orderNumber: string;
  orderId: string;
  customerEmail: string;
  customerName?: string;
  newStatus: string;
}

function buildOrderStatusHtml(data: OrderStatusData, ctx: EmailContext): string {
  const label = ORDER_STATUS_LABEL[data.newStatus] ?? data.newStatus;
  const icon = ORDER_STATUS_ICON[data.newStatus] ?? "📋";

  const bodyHtml = `
    <p style="font-size:16px;color:#1e293b;margin:0 0 8px;">
      Hola${data.customerName ? `, ${data.customerName.split(" ")[0]}` : ""}!
    </p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">
      Hubo una actualización en tu pedido.
    </p>
    <div style="background:${ctx.tint};border-radius:12px;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Número de pedido</p>
      <p style="margin:6px 0 0;font-size:20px;font-weight:bold;color:${ctx.primaryColor};">${data.orderNumber}</p>
    </div>
    <div style="text-align:center;margin-bottom:8px;">
      <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Nuevo estado</p>
      <span style="display:inline-block;background:${ctx.tint};color:${ctx.primaryColor};border-radius:9999px;padding:8px 20px;font-size:16px;font-weight:bold;">
        ${icon} ${label}
      </span>
    </div>
    ${ctaButton("Ver mis pedidos", `${ctx.storeUrl}/account/orders`, ctx)}
  `;

  return emailShell({
    ctx,
    eyebrow: "Actualización de pedido",
    preheader: `Pedido ${data.orderNumber}: ${label}`,
    bodyHtml,
  });
}

export async function sendOrderStatusUpdate(data: OrderStatusData): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_xxx")) {
    console.warn("[email] RESEND_API_KEY no configurado, se omite el envío.");
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const label = ORDER_STATUS_LABEL[data.newStatus] ?? data.newStatus;
  try {
    const ctx = await getEmailContext();
    await resend.emails.send({
      from: ctx.fromEmail,
      to: data.customerEmail,
      subject: `📦 Pedido ${data.orderNumber}: ${label} — ${ctx.storeName}`,
      html: buildOrderStatusHtml(data, ctx),
    });
  } catch (err) {
    console.error("[email] Error enviando actualización de orden:", err);
  }
}

// ── Repair status update ─────────────────────────────────────────────────────

const REPAIR_STATUS_LABEL: Record<string, string> = {
  recibido: "Recibido",
  diagnosticado: "Diagnosticado",
  en_reparacion: "En reparación",
  esperando_repuestos: "Esperando repuestos",
  listo: "Listo para retirar",
  entregado: "Entregado",
  cancelado: "Cancelado",
  sin_reparacion: "Sin reparación posible",
};

const REPAIR_STATUS_ICON: Record<string, string> = {
  recibido: "📥",
  diagnosticado: "🔍",
  en_reparacion: "🔧",
  esperando_repuestos: "⏳",
  listo: "✅",
  entregado: "🏠",
  cancelado: "❌",
  sin_reparacion: "🚫",
};

export interface RepairStatusData {
  codigo: string;
  clienteNombre: string;
  clienteEmail: string;
  equipoMarca: string;
  equipoModelo: string;
  newStatus: string;
}

function buildRepairStatusHtml(data: RepairStatusData, ctx: EmailContext): string {
  const label = REPAIR_STATUS_LABEL[data.newStatus] ?? data.newStatus;
  const icon = REPAIR_STATUS_ICON[data.newStatus] ?? "🔧";
  const trackingUrl = `${ctx.storeUrl}/soporte-tecnico/seguimiento/${data.codigo}`;

  const bodyHtml = `
    <p style="font-size:16px;color:#1e293b;margin:0 0 8px;">
      Hola, ${data.clienteNombre.split(" ")[0]}!
    </p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">
      Tu equipo tiene una actualización de estado.
    </p>
    <div style="background:${ctx.tint};border-radius:12px;padding:16px;margin-bottom:20px;">
      <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Número de reparación</p>
      <p style="margin:6px 0 8px;font-size:20px;font-weight:bold;color:${ctx.primaryColor};">${data.codigo}</p>
      <p style="margin:0;font-size:13px;color:#475569;">${data.equipoMarca} ${data.equipoModelo}</p>
    </div>
    <div style="text-align:center;margin-bottom:8px;">
      <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;">Nuevo estado</p>
      <span style="display:inline-block;background:${ctx.tint};color:${ctx.primaryColor};border-radius:9999px;padding:8px 20px;font-size:16px;font-weight:bold;">
        ${icon} ${label}
      </span>
    </div>
    ${ctaButton("Ver estado de mi reparación", trackingUrl, ctx)}
  `;

  return emailShell({
    ctx,
    eyebrow: "Actualización de reparación",
    preheader: `Reparación ${data.codigo}: ${label}`,
    bodyHtml,
  });
}

export async function sendRepairStatusUpdate(data: RepairStatusData): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_xxx")) {
    console.warn("[email] RESEND_API_KEY no configurado, se omite el envío.");
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const label = REPAIR_STATUS_LABEL[data.newStatus] ?? data.newStatus;
  try {
    const ctx = await getEmailContext();
    await resend.emails.send({
      from: ctx.fromEmail,
      to: data.clienteEmail,
      subject: `🔧 Reparación ${data.codigo}: ${label} — ${ctx.storeName}`,
      html: buildRepairStatusHtml(data, ctx),
    });
  } catch (err) {
    console.error("[email] Error enviando actualización de reparación:", err);
  }
}

// ── Order confirmation ───────────────────────────────────────────────────────

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_xxx")) {
    console.warn("[email] RESEND_API_KEY no configurado, se omite el envío.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const ctx = await getEmailContext();
    await resend.emails.send({
      from: ctx.fromEmail,
      to: data.customerEmail,
      subject: `✅ Pedido ${data.orderNumber} confirmado — ${ctx.storeName}`,
      html: buildOrderConfirmationHtml(data, ctx),
    });
  } catch (err) {
    console.error("[email] Error enviando confirmación:", err);
  }
}

// ── Welcome email ────────────────────────────────────────────────────────────

function buildWelcomeHtml(name: string, ctx: EmailContext): string {
  const firstName = name.split(" ")[0];
  const bodyHtml = `
    <p style="font-size:16px;color:#1e293b;margin:0 0 8px;">
      ¡Hola${firstName ? `, ${firstName}` : ""}! 👋
    </p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">
      Gracias por crear tu cuenta en ${ctx.storeName}. Ya podés explorar productos,
      guardar tus favoritos y hacer seguimiento de tus compras desde un solo lugar.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${ctx.tint};border-radius:12px;">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 10px;font-size:13px;color:#334155;">📦 &nbsp;Seguí el estado de tus pedidos</p>
          <p style="margin:0 0 10px;font-size:13px;color:#334155;">🛒 &nbsp;Guardá productos en tus favoritos</p>
          <p style="margin:0;font-size:13px;color:#334155;">📍 &nbsp;Guardá tus direcciones de envío</p>
        </td>
      </tr>
    </table>
    ${ctaButton("Ir a la tienda", ctx.storeUrl, ctx)}
  `;

  return emailShell({
    ctx,
    eyebrow: "¡Bienvenido/a!",
    preheader: `Tu cuenta en ${ctx.storeName} ya está lista`,
    bodyHtml,
  });
}

export async function sendWelcomeEmail(data: { name: string; email: string }): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_xxx")) {
    console.warn("[email] RESEND_API_KEY no configurado, se omite el envío.");
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const ctx = await getEmailContext();
    await resend.emails.send({
      from: ctx.fromEmail,
      to: data.email,
      subject: `¡Bienvenido/a a ${ctx.storeName}! 👋`,
      html: buildWelcomeHtml(data.name, ctx),
    });
  } catch (err) {
    console.error("[email] Error enviando bienvenida:", err);
  }
}

// ── Password reset ───────────────────────────────────────────────────────────

function buildPasswordResetHtml(resetUrl: string, ctx: EmailContext): string {
  const bodyHtml = `
    <p style="font-size:16px;color:#1e293b;margin:0 0 8px;">
      Recuperación de contraseña
    </p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">
      Recibimos una solicitud para restablecer tu contraseña en ${ctx.storeName}.
      Hacé clic en el botón para elegir una nueva.
    </p>
    ${ctaButton("Restablecer contraseña", resetUrl, ctx)}
    <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;text-align:center;">
      Este enlace expira en 1 hora. Si no solicitaste este cambio, podés ignorar este mensaje.
    </p>
  `;

  return emailShell({
    ctx,
    eyebrow: "Recuperación de contraseña",
    preheader: "Restablecé tu contraseña — el enlace expira en 1 hora",
    bodyHtml,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_xxx")) {
    console.warn("[email] RESEND_API_KEY no configurado, se omite el envío.");
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const ctx = await getEmailContext();
  await resend.emails.send({
    from: ctx.fromEmail,
    to: email,
    subject: `Recuperá tu contraseña — ${ctx.storeName}`,
    html: buildPasswordResetHtml(resetUrl, ctx),
  });
}
