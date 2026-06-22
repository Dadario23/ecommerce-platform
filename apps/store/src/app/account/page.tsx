// app/account/page.tsx
import { redirect } from "next/navigation";

// Redirigir a la página de órdenes por defecto
export default function AccountPage() {
  redirect("/account/orders");
}
