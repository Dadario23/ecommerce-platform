// src/hooks/use-toast.tsx
"use client";

import React from "react";

export type ToastVariant = "default" | "destructive";

export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type ToastContextType = {
  toast: (props: Omit<ToastProps, "id">) => string; // retorna id
};

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const toast = React.useCallback((props: Omit<ToastProps, "id">) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? (crypto as any).randomUUID()
        : `${Date.now()}-${Math.random()}`;
    const t: ToastProps = { id, ...props };
    setToasts((prev) => [...prev, t]);

    const duration = props.duration ?? 3000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, duration);

    return id;
  }, []);

  const dismiss = React.useCallback((id?: string) => {
    if (!id) return;
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ title, description, variant = "default" }: ToastProps) {
  return (
    <div
      className={`rounded-lg border p-4 shadow-lg transition-all ${
        variant === "destructive"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-green-200 bg-green-50 text-green-800"
      }`}
    >
      {title && <h4 className="font-semibold">{title}</h4>}
      {description && <p className="text-sm">{description}</p>}
    </div>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}

export default useToast;
