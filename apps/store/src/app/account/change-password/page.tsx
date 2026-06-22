import { Suspense } from "react";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default function ChangePasswordPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Cambio de contraseña</h1>

      <Suspense fallback={<div>Cargando formulario...</div>}>
        <ChangePasswordForm />
      </Suspense>
    </div>
  );
}
