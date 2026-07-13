"use client";

import { Check, X } from "lucide-react";
import { PASSWORD_REQUIREMENTS } from "@/lib/password-policy";

export default function PasswordChecklist({ password }: { password: string }) {
  const started = password.length > 0;
  return (
    <ul className="mt-2 space-y-1">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const ok = req.test(password);
        const color = !started
          ? "text-gray-400"
          : ok
            ? "text-emerald-600"
            : "text-red-500";
        return (
          <li key={req.id} className={`flex items-center gap-1.5 text-xs ${color}`}>
            {ok ? (
              <Check className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 shrink-0" />
            )}
            {req.label}
          </li>
        );
      })}
    </ul>
  );
}
