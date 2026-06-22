"use client";

import { useState, useRef, useCallback } from "react";
import { RotateCcw } from "lucide-react";

const COLS = 3;
const DOT_COUNT = 9;
const SIZE = 240;
const DOT_R = 13;
const HIT_R = 32;
const MIN_DOTS = 3;

function center(i: number, size = SIZE) {
  const cell = size / COLS;
  return { x: (i % COLS) * cell + cell / 2, y: Math.floor(i / COLS) * cell + cell / 2 };
}

function arrowSegment(
  a: { x: number; y: number },
  b: { x: number; y: number },
  r: number,
  as: number,
  color: string,
  opacity: number,
  key: number,
) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
  const nx = dx / len;
  const ny = dy / len;
  const tipX = b.x - r * 1.3 * nx;
  const tipY = b.y - r * 1.3 * ny;
  const pts = [
    [tipX, tipY],
    [tipX - as * nx - as * 0.45 * (-ny), tipY - as * ny - as * 0.45 * nx],
    [tipX - as * nx + as * 0.45 * (-ny), tipY - as * ny + as * 0.45 * nx],
  ].map(([x, y]) => `${(x as number).toFixed(1)},${(y as number).toFixed(1)}`).join(" ");
  return (
    <g key={key}>
      <line x1={a.x} y1={a.y} x2={tipX} y2={tipY}
        stroke={color} strokeWidth={2} strokeOpacity={opacity} />
      <polygon points={pts} fill={color} fillOpacity={opacity + 0.2} />
    </g>
  );
}

// ── Static display of an existing pattern ────────────────────────────────────
export function PatternDisplay({ pattern, size = 120 }: { pattern: string; size?: number }) {
  const dots = pattern.split("-").map(Number).filter((n) => !isNaN(n) && n >= 0 && n < 9);
  const r = Math.max(4, size / 18);
  const as = Math.max(4, size / 22);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg style={{ position: "absolute", inset: 0, width: size, height: size, overflow: "visible" }}>
        {dots.map((dotIdx, i) => {
          if (i === 0) return null;
          return arrowSegment(center(dots[i - 1], size), center(dotIdx, size), r, as, "#f59e0b", 0.6, i);
        })}
      </svg>
      {Array.from({ length: DOT_COUNT }, (_, i) => {
        const { x, y } = center(i, size);
        const activeIdx = dots.indexOf(i);
        const active = activeIdx !== -1;
        const fontSize = Math.max(7, r * 0.85);
        return (
          <div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2 }}
            className={`rounded-full border-2 flex items-center justify-center ${active ? "bg-amber-500 border-amber-500" : "bg-gray-100 border-gray-200"}`}
          >
            {active && (
              <span style={{ fontSize, lineHeight: 1 }} className="text-white font-bold select-none pointer-events-none">
                {activeIdx + 1}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Interactive pattern lock with confirmation ────────────────────────────────
type Phase = "draw" | "confirm";

interface PatternLockProps {
  onConfirm: (pattern: string) => void;
  onCancel?: () => void;
}

export default function PatternLock({ onConfirm, onCancel }: PatternLockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("draw");
  const [first, setFirst] = useState<number[]>([]);
  const [current, setCurrent] = useState<number[]>([]);
  const [dragging, setDragging] = useState(false);
  const [ptr, setPtr] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const relPos = useCallback((cx: number, cy: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: cx - rect.left, y: cy - rect.top };
  }, []);

  const dotAt = useCallback((x: number, y: number) => {
    for (let i = 0; i < DOT_COUNT; i++) {
      const c = center(i);
      if (Math.hypot(x - c.x, y - c.y) < HIT_R) return i;
    }
    return null;
  }, []);

  const onDown = useCallback((e: React.PointerEvent) => {
    const pos = relPos(e.clientX, e.clientY);
    if (!pos) return;
    const dot = dotAt(pos.x, pos.y);
    if (dot === null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    setError("");
    setCurrent([dot]);
    setPtr(pos);
  }, [relPos, dotAt]);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const pos = relPos(e.clientX, e.clientY);
    if (!pos) return;
    setPtr(pos);
    const dot = dotAt(pos.x, pos.y);
    if (dot !== null) setCurrent((p) => p.includes(dot) ? p : [...p, dot]);
  }, [dragging, relPos, dotAt]);

  const onUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    setPtr(null);

    if (current.length < MIN_DOTS) {
      setError(`El patrón necesita al menos ${MIN_DOTS} puntos.`);
      setCurrent([]);
      return;
    }

    if (phase === "draw") {
      setFirst(current);
      setCurrent([]);
      setPhase("confirm");
    } else {
      if (current.join("-") === first.join("-")) {
        setDone(true);
        onConfirm(current.join("-"));
      } else {
        setError("Los patrones no coinciden. Intentá de nuevo.");
        setFirst([]);
        setCurrent([]);
        setPhase("draw");
      }
    }
  }, [dragging, current, phase, first, onConfirm]);

  const reset = () => {
    setPhase("draw"); setFirst([]); setCurrent([]);
    setDragging(false); setPtr(null); setError(""); setDone(false);
  };

  const displayed = done ? first : current;
  const lineColor = done ? "#22c55e" : "#f59e0b";

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <p className="text-sm font-medium text-gray-700 text-center">
        {done ? "✓ Patrón guardado"
          : phase === "draw" ? "Dibujá el patrón"
          : "Confirmá el patrón nuevamente"}
      </p>

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}

      <div
        ref={ref}
        style={{ width: SIZE, height: SIZE, position: "relative", touchAction: "none", cursor: "crosshair" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* Lines between connected dots */}
        <svg style={{ position: "absolute", inset: 0, width: SIZE, height: SIZE, pointerEvents: "none" }}>
          {displayed.map((dotIdx, i) => {
            if (i === 0) return null;
            return arrowSegment(center(displayed[i - 1]), center(dotIdx), DOT_R, 10, lineColor, 0.65, i);
          })}
          {/* Trailing line to pointer while dragging */}
          {dragging && ptr && displayed.length > 0 && (
            <line
              x1={center(displayed[displayed.length - 1]).x}
              y1={center(displayed[displayed.length - 1]).y}
              x2={ptr.x} y2={ptr.y}
              stroke={lineColor} strokeWidth={2} strokeOpacity={0.35} strokeDasharray="5,4"
            />
          )}
        </svg>

        {/* Dots */}
        {Array.from({ length: DOT_COUNT }, (_, i) => {
          const { x, y } = center(i);
          const active = displayed.includes(i);
          return (
            <div key={i}
              style={{ position: "absolute", left: x - DOT_R, top: y - DOT_R, width: DOT_R * 2, height: DOT_R * 2 }}
              className={`rounded-full border-2 transition-all duration-100 ${
                active
                  ? done
                    ? "bg-green-500 border-green-500 scale-125"
                    : "bg-amber-500 border-amber-500 scale-125"
                  : "bg-white border-gray-300 hover:border-amber-300"
              }`}
            />
          );
        })}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={reset}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          <RotateCcw className="w-3 h-3" />
          Limpiar
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
