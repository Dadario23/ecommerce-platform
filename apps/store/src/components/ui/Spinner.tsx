// src/components/ui/Spinner.tsx
"use client";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-4",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          "rounded-full border-t-transparent border-solid animate-spin text-black-600",
          sizeClasses[size],
          className
        )}
        style={{ borderColor: "currentColor", borderTopColor: "transparent" }}
      />
    </div>
  );
}
