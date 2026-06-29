"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import ChatBot from "./ChatBot";

export default function ChatBotWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div className="w-[min(90vw,380px)] max-h-[80vh] shadow-2xl rounded-2xl overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <ChatBot onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label={open ? "Cerrar asistente" : "Obtener presupuesto de reparación"}
        className="w-14 h-14 rounded-full bg-(--tenant-primary) text-white shadow-lg hover:bg-blue-800 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" fill="currentColor" />
        )}
      </button>
    </div>
  );
}
