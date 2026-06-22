// app/auth/reset-password/page.tsx
"use client";

import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export default function Page() {
  return (
    <Suspense
      fallback={<div className="pt-20 md:pt-32 text-center">Cargando...</div>}
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
