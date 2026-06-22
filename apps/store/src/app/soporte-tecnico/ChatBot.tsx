"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, RefreshCw, Search, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────
interface Msg {
  id: string;
  role: "bot" | "user";
  html: string;
  isCard?: boolean;
  card?: { brand: string; model: string; repair: string; price: string };
}
interface CartItem {
  repair: string;
  price: string; // numeric string or "a consultar"
}
type Step =
  | "init"
  | "device"
  | "wet"
  | "loading"
  | "brand"
  | "model"
  | "repair"
  | "more"
  | "name"
  | "done"
  | "error";

type DeviceType = "celular" | "laptop" | "pc";

interface RepairModel { brand: string; model: string }
interface RepairPrice { brand: string; model: string; repairType: string; price: number }

// ── Constants ─────────────────────────────────────────────────────────
const WA = "5491150610043";

const GENERIC_BRAND = "Sin marca";
const GENERIC_MODEL = "Sin modelo";

const DEVICE_LABEL: Record<DeviceType, string> = {
  celular: "celular",
  laptop: "laptop",
  pc: "PC de escritorio",
};

const DEVICE_ICON: Record<DeviceType, string> = {
  celular: "📱",
  laptop: "💻",
  pc: "🖥️",
};

const DEVICE_ARTICLE: Record<DeviceType, string> = {
  celular: "un celular",
  laptop: "una laptop",
  pc: "una PC de escritorio",
};

const MODEL_PLACEHOLDER: Record<DeviceType, string> = {
  celular: "Ej: Galaxy A52, Moto G84, iPhone 14…",
  laptop: "Ej: ThinkPad E14, Inspiron 15, Pavilion 15…",
  pc: "Ej: OptiPlex 3080, ThinkCentre M70q…",
};

// Síntomas comunes por tipo de equipo (sin precio, siempre a consultar)
const SYMPTOMS: Record<DeviceType, string[]> = {
  celular: [
    "Pantalla rota o táctil no responde",
    "No enciende",
    "No carga / no detecta el cargador",
    "Batería dura muy poco",
    "Cámara no funciona",
    "No escucha / altavoz roto",
    "Micrófono no funciona",
    "Se calienta mucho",
    "Se apaga solo",
    "Botones no funcionan",
    "WiFi o Bluetooth no conecta",
    "Sin señal / sin red",
  ],
  laptop: [
    "Teclado no funciona",
    "Pantalla rota o sin imagen",
    "No enciende",
    "Se calienta / se apaga solo",
    "Batería no carga o dura poco",
    "No detecta el cargador",
    "Bisagras rotas o flojas",
    "Puerto USB no funciona",
    "WiFi / Bluetooth no conecta",
    "Muy lento o trabado",
    "Hace ruido raro",
    "No arranca el sistema operativo",
    "Pantalla con rayas o manchas",
    "Necesito formateo / reinstalación Windows",
    "Quiero recuperar datos",
    "Necesito limpieza y mantenimiento",
  ],
  pc: [
    "No enciende",
    "Se reinicia solo",
    "No hay imagen en el monitor",
    "Muy lento o trabado",
    "Se calienta / apaga solo",
    "No detecta el disco",
    "Puerto USB no funciona",
    "WiFi / Ethernet no conecta",
    "Hace ruido raro",
    "Monitor con rayas o manchas",
    "Teclado o mouse no funcionan",
    "Necesito formateo / reinstalación Windows",
    "Quiero recuperar datos",
    "Necesito limpieza y mantenimiento",
    "No arranca el sistema operativo",
  ],
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2);

function iconFor(label: string) {
  const l = label.toLowerCase();
  if (/pantalla|modulo|módulo|display|rayas|manchas|imagen/.test(l)) return "📱";
  if (/teclado|tecla/.test(l)) return "⌨️";
  if (/carga|pin|cargador|detecta el cargador/.test(l)) return "🔌";
  if (/bater/.test(l)) return "🔋";
  if (/altavoz|parlante|escucha/.test(l)) return "🔊";
  if (/camara|cámara|webcam/.test(l)) return "📷";
  if (/microfono|micrófono/.test(l)) return "🎤";
  if (/selfie|frontal|auricular/.test(l)) return "🤳";
  if (/contraseña|patron|patrón/.test(l)) return "🔓";
  if (/ram|memoria/.test(l)) return "💾";
  if (/disco|ssd|hdd|almacenamiento|arranca|bootea/.test(l)) return "💿";
  if (/ventilador|cooler|fan|temperatura|calien|ruido/.test(l)) return "🌀";
  if (/bisagra/.test(l)) return "🔩";
  if (/formato|formateo|sistema|windows|software|virus|reinstal/.test(l)) return "🖥️";
  if (/puerto|usb|hdmi/.test(l)) return "🔌";
  if (/wifi|bluetooth|red|señal|internet|ethernet|conecta/.test(l)) return "📶";
  if (/lento|trabado/.test(l)) return "🐢";
  if (/datos|recuperar/.test(l)) return "💾";
  if (/limpieza|mantenimiento/.test(l)) return "🧹";
  if (/apaga|reinicia|enciende/.test(l)) return "⚡";
  return "🔧";
}

function fmtPrice(p: string | number) {
  const n = parseFloat(String(p).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? String(p) : n.toLocaleString("es-AR");
}

function norm(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

async function fetchCatalog(device: DeviceType): Promise<{ brands: string[]; models: RepairModel[]; prices: RepairPrice[] }> {
  const res = await fetch(`/api/repair-catalog?device=${device}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Main component ────────────────────────────────────────────────────
export default function ChatBot({ onClose }: { onClose?: () => void } = {}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState<Step>("init");
  const [deviceType, setDeviceType] = useState<DeviceType | "">("");
  const [models, setModels] = useState<RepairModel[]>([]);
  const [prices, setPrices] = useState<RepairPrice[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [sel, setSel] = useState({ brand: "", model: "", repair: "", price: "" });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modelQ, setModelQ] = useState("");
  const [nameVal, setNameVal] = useState("");
  const [userName, setUserName] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [desktopSent, setDesktopSent] = useState(false);
  const { data: session, status } = useSession();
  const chatRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  const started = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs, typing]);

  // ── Helpers ────────────────────────────────────────────────────────
  function addMsg(msg: Omit<Msg, "id">) {
    if (!mounted.current) return;
    setMsgs((p) => [...p, { ...msg, id: uid() }]);
  }

  async function botSay(html: string, delay = 900) {
    if (!mounted.current) return;
    setTyping(true);
    await sleep(delay);
    if (!mounted.current) return;
    setTyping(false);
    addMsg({ role: "bot", html });
  }

  function userSay(text: string) {
    addMsg({ role: "user", html: text });
  }

  // ── Flow ───────────────────────────────────────────────────────────
  async function doInit() {
    const name = session?.user?.name ?? "";
    await botSay(
      name
        ? `¡Hola, <strong>${name}</strong>! 👋 Soy el asistente de <strong>Compumobile</strong>.<br>Estoy aquí para ayudarte a obtener un presupuesto para la reparación de tu equipo en segundos.`
        : "¡Hola! 👋 Soy el asistente de <strong>Compumobile</strong>.<br>Estoy aquí para ayudarte a obtener un presupuesto para la reparación de tu equipo en segundos.",
      1000,
    );
    await sleep(200);
    await botSay("Antes de empezar… ¿el equipo estuvo en contacto con agua o humedad?", 800);
    if (mounted.current) setStep("init");
  }

  useEffect(() => {
    if (status === "loading") return;
    if (started.current) return;
    started.current = true;
    doInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleWet() {
    userSay("💧 Se mojó");
    setStep("wet");
    await botSay(
      "⚠️ <strong>No realizamos reparaciones en equipos mojados</strong> ya que no podemos ofrecer garantía sobre el resultado.",
      800,
    );
  }

  async function handleDry() {
    userSay("✅ Está seco");
    await botSay("¡Perfecto! ¿Qué tipo de equipo querés reparar?", 700);
    if (mounted.current) setStep("device");
  }

  async function selectDevice(type: DeviceType) {
    userSay(`${DEVICE_ICON[type]} ${type === "pc" ? "PC de escritorio" : type.charAt(0).toUpperCase() + type.slice(1)}`);
    setDeviceType(type);
    setStep("loading");
    const loadId = uid();
    setMsgs((p) => [...p, { id: loadId, role: "bot", html: "Cargando catálogo…" }]);

    try {
      const { brands: b, models: mRows, prices: pRows } = await fetchCatalog(type);
      if (!mounted.current) return;

      setModels(mRows);
      setPrices(pRows);
      setBrands(b);
      setMsgs((p) => p.filter((m) => m.id !== loadId));
      await botSay(`¿Cuál es la <strong>marca</strong> de tu ${DEVICE_LABEL[type]}?`, 600);
      setStep("brand");
    } catch {
      setMsgs((p) => p.filter((m) => m.id !== loadId));
      await botSay("No pude cargar el catálogo en este momento. Podés consultarnos directamente por WhatsApp.", 500);
      setStep("error");
    }
  }

  async function selectBrand(brand: string) {
    const icon = deviceType ? DEVICE_ICON[deviceType] : "📱";
    userSay(`${icon} ${brand}`);
    setSel({ brand, model: "", repair: "", price: "" });
    setModelQ("");
    setStep("model");
    await botSay(`¿Cuál es el <strong>modelo</strong> de tu ${brand}?`, 700);
  }

  // Sin marca: saltea modelo, va directo a síntomas
  async function selectGenericBrand() {
    userSay("❓ No sé la marca");
    const deviceName = deviceType ? DEVICE_LABEL[deviceType] : "equipo";
    setSel({ brand: GENERIC_BRAND, model: GENERIC_MODEL, repair: "", price: "" });
    setCart([]);
    setStep("repair");
    await botSay(
      `No hay problema. ¿Cuál es la falla de tu ${deviceName}? Podés agregar <strong>más de una</strong>.`,
      700,
    );
  }

  // Sin modelo: la marca está seleccionada, va a síntomas
  async function selectUnknownModel() {
    userSay("❓ No sé el modelo");
    setSel((p) => ({ ...p, model: GENERIC_MODEL, repair: "", price: "" }));
    setCart([]);
    setStep("repair");
    const deviceName = deviceType ? DEVICE_LABEL[deviceType] : "equipo";
    await botSay(
      `No hay problema. ¿Cuál es la falla de tu ${sel.brand ? sel.brand : deviceName}? Podés agregar <strong>más de una</strong>.`,
      700,
    );
  }

  async function selectModel(model: string) {
    userSay(`📲 ${model}`);
    setSel((p) => ({ ...p, model, repair: "", price: "" }));
    setCart([]);
    setStep("repair");
    await botSay("¿Cuál es la <strong>falla o reparación</strong> que necesitás?", 700);
  }

  // Selección de síntoma (equipo sin marca/modelo conocido → siempre a consultar)
  async function selectSymptom(symptom: string) {
    userSay(`⚠️ ${symptom}`);
    setSel((p) => ({ ...p, repair: symptom, price: "a consultar" }));
    setCart((c) => [...c, { repair: symptom, price: "a consultar" }]);
    const deviceName = deviceType ? DEVICE_LABEL[deviceType] : "equipo";
    await botSay(
      `Anotado. ¿Tenés otro problema con tu ${deviceName}?`,
      600,
    );
    setStep("more");
  }

  // Selección de reparación con precio (marca+modelo conocido)
  async function selectRepair(repair: string, brand: string, model: string) {
    userSay(`🔧 ${repair}`);
    setSel((p) => ({ ...p, repair, price: "" }));
    setTyping(true);
    await sleep(1400);
    if (!mounted.current) return;
    setTyping(false);

    const row = prices.find(
      (r) =>
        norm(r.brand) === norm(brand) &&
        norm(r.model) === norm(model) &&
        norm(r.repairType) === norm(repair),
    );

    if (row && row.price > 0) {
      const price = String(row.price);
      setSel((p) => ({ ...p, price }));
      setCart((c) => [...c, { repair, price }]);
      addMsg({
        role: "bot",
        html: "",
        isCard: true,
        card: { brand, model, repair, price },
      });
      await sleep(400);
      await botSay("Agregado al presupuesto. ¿Tenés otra falla o servicio que agregar?", 600);
    } else {
      setSel((p) => ({ ...p, price: "a consultar" }));
      setCart((c) => [...c, { repair, price: "a consultar" }]);
      await botSay(
        "No tenemos precio cargado para esa reparación, pero la anotamos para que el técnico la evalúe. ¿Tenés otra falla?",
        600,
      );
    }
    setStep("more");
  }

  // El cliente no tiene más fallas: construye el resumen
  async function handleNoMore() {
    userSay("No, es todo");
    const loggedName = session?.user?.name ?? "";
    const deviceName = deviceType ? DEVICE_LABEL[deviceType] : "equipo";

    if (isGeneric) {
      const list = cart.map((i) => `<strong>${i.repair}</strong>`).join(", ");
      await botSay(
        `Perfecto. El técnico ya sabe que tu ${deviceName} tiene: ${list}. Te contactamos a la brevedad.`,
        800,
      );
    } else {
      const priceItems = cart.filter((i) => i.price !== "a consultar");
      const noPrice = cart.filter((i) => i.price === "a consultar");
      if (priceItems.length > 0) {
        const total = priceItems.reduce(
          (sum, i) => sum + parseFloat(String(i.price).replace(/[^0-9.]/g, "")),
          0,
        );
        const parts: string[] = [];
        if (priceItems.length > 0)
          parts.push(`Presupuesto estimado: <strong>$${total.toLocaleString("es-AR")}</strong>`);
        if (noPrice.length > 0)
          parts.push(`${noPrice.length} reparación(es) requieren evaluación en taller`);
        await botSay(parts.join(". ") + ".", 700);
      }
    }

    if (loggedName) {
      setUserName(loggedName);
      await botSay(
        isMobile
          ? `<strong>${loggedName}</strong>, envianos el resumen por WhatsApp y coordinamos. 🚀`
          : `<strong>${loggedName}</strong>, tu presupuesto está listo. Hacé clic en el botón para enviarlo y te contactamos pronto. 🚀`,
        500,
      );
      setStep("done");
    } else {
      await botSay("Para coordinar, ¿cuál es tu nombre? 👇", 500);
      setStep("name");
    }
  }

  // Agrega otra falla
  async function handleAddMore() {
    userSay("Sí, tengo otra falla");
    setSel((p) => ({ ...p, repair: "", price: "" }));
    await botSay(
      isGeneric ? "¿Cuál es el otro problema?" : "¿Cuál es la otra reparación o servicio?",
      500,
    );
    setStep("repair");
  }

  async function submitName() {
    const name = nameVal.trim();
    if (!name) return;
    userSay(`👤 ${name}`);
    setNameVal("");
    setUserName(name);
    await botSay(
      `¡Listo, <strong>${name}</strong>! Cuando quieras, envianos el resumen por WhatsApp y coordinamos. 🚀`,
      800,
    );
    setStep("done");
  }

  function buildPresupuestoPayload() {
    const nombre = userName || session?.user?.name || "";
    return {
      cliente: { nombre, email: session?.user?.email },
      equipo: {
        tipo: deviceType,
        marca: sel.brand === GENERIC_BRAND ? "" : sel.brand,
        modelo: sel.model === GENERIC_MODEL ? "" : sel.model,
      },
      items: cart,
      esGenerico: isGeneric,
    };
  }

  function handleMobileWA() {
    window.open(waUrl, "_blank");
    fetch("/api/presupuestos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPresupuestoPayload()),
    }).catch(() => {});
  }

  async function handleDesktopSubmit() {
    fetch("/api/presupuestos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPresupuestoPayload()),
    }).catch(() => {});
    setDesktopSent(true);
    await botSay(
      "✅ ¡Listo! Tu solicitud fue registrada. Un técnico o asesor se comunicará con vos a la brevedad para coordinar los próximos pasos.",
      800,
    );
  }

  function restart() {
    setMsgs([]);
    setSel({ brand: "", model: "", repair: "", price: "" });
    setCart([]);
    setModelQ("");
    setNameVal("");
    setUserName("");
    setDeviceType("");
    setDesktopSent(false);
    setTyping(false);
    setStep("init");
    started.current = false;
    doInit();
  }

  // ── Derived ────────────────────────────────────────────────────────
  const isGeneric = sel.brand === GENERIC_BRAND || sel.model === GENERIC_MODEL;

  const selectedInCart = cart.map((i) => norm(i.repair));

  const availableModels = [
    ...new Set(
      models
        .filter((r) => r.brand.toLowerCase() === sel.brand.toLowerCase())
        .map((r) => r.model)
        .filter(Boolean),
    ),
  ].sort();

  const filteredModels = modelQ
    ? availableModels.filter((m) => m.toLowerCase().includes(modelQ.toLowerCase()))
    : availableModels;

  const availableRepairs = [
    ...new Set(
      prices
        .filter(
          (r) =>
            norm(r.brand) === norm(sel.brand) &&
            norm(r.model) === norm(sel.model) &&
            r.repairType &&
            !selectedInCart.includes(norm(r.repairType)),
        )
        .map((r) => r.repairType.trim())
        .filter(Boolean),
    ),
  ];

  const availableSymptoms = (SYMPTOMS[deviceType as DeviceType] ?? []).filter(
    (s) => !selectedInCart.includes(norm(s)),
  );

  // WhatsApp message
  const cartText =
    cart.length > 0
      ? cart
          .map((i) =>
            i.price !== "a consultar"
              ? `${i.repair} ($${fmtPrice(i.price)})`
              : i.repair,
          )
          .join(", ")
      : sel.repair || "";

  const deviceArticle = deviceType ? DEVICE_ARTICLE[deviceType] : "un equipo";
  const equipInfo =
    !isGeneric && sel.brand && sel.model !== GENERIC_MODEL
      ? `${sel.brand} ${sel.model}`
      : "";

  const waMsg = isGeneric
    ? `Hola${userName ? `, soy ${userName}` : ""}! Tengo ${deviceArticle}${equipInfo ? ` ${equipInfo}` : ""} con los siguientes problemas: ${cartText}. Quisiera recibir asesoramiento.`
    : `Hola${userName ? `, soy ${userName}` : ""}! Tengo ${deviceArticle}${equipInfo ? ` ${equipInfo}` : ""}. Fallas / servicios: ${cartText}. Quisiera coordinar la reparación.`;

  const waUrl = `https://wa.me/${WA}?text=${encodeURIComponent(waMsg)}`;

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes cmBounce {
          0%,60%,100% { transform: translateY(0); }
          30%          { transform: translateY(-6px); }
        }
        @keyframes cmSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cm-msg { animation: cmSlideIn .25s ease forwards; }
        .cm-opt:hover { background: #eff6ff !important; border-color: #1E3A8A !important; color: #1E3A8A !important; }
      `}</style>

      <div
        className="rounded-2xl border border-gray-200 overflow-hidden bg-white flex flex-col"
        style={{ height: 560 }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0"
          style={{ background: "#1E3A8A" }}
        >
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg shrink-0">
            🛠️
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Asistente</p>
            <p className="text-blue-200 text-xs">Presupuestos al instante</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-blue-200">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              En línea
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/20 transition-colors text-white/70 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50"
        >
          {msgs.map((m) => (
            <div
              key={m.id}
              className={`cm-msg flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "bot" && (
                <div className="w-7 h-7 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white text-xs font-bold shrink-0 self-end mr-2">
                  CM
                </div>
              )}
              {m.isCard && m.card ? (
                <div className="max-w-xs rounded-2xl border border-[#1E3A8A] bg-blue-50 overflow-hidden shadow-sm">
                  <div className="bg-[#1E3A8A] px-4 py-2.5">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">
                      ✅ Precio estimado
                    </p>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {(
                      [
                        ["Equipo", `${m.card.brand} ${m.card.model}`],
                        ["Reparación", m.card.repair],
                      ] as [string, string][]
                    ).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between text-sm border-b border-blue-100 pb-2"
                      >
                        <span className="text-gray-500">{k}</span>
                        <span className="font-semibold text-gray-800 text-right max-w-36 truncate">{v}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-sm text-gray-500">Precio</span>
                      <span className="text-2xl font-bold text-[#1E3A8A]">
                        ${fmtPrice(m.card.price)}
                      </span>
                    </div>
                  </div>
                  <p className="px-4 pb-3 text-[11px] text-gray-400">
                    ⚡ Precio estimado. Puede variar según diagnóstico en taller.
                  </p>
                </div>
              ) : (
                <div
                  className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#1E3A8A] text-white rounded-br-sm"
                      : "bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm"
                  }`}
                  dangerouslySetInnerHTML={{ __html: m.html }}
                />
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white text-xs font-bold shrink-0 self-end mr-2">
                CM
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  {[0, 200, 400].map((d, i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-gray-300 inline-block"
                      style={{ animation: `cmBounce 1.2s ${d}ms infinite` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action zone */}
        <div
          className="shrink-0 border-t border-gray-100 bg-white px-4 pt-3 pb-4 flex flex-col gap-2.5 overflow-y-auto"
          style={{ maxHeight: "42%" }}
        >
          {/* ── Humedad ── */}
          {step === "init" && (
            <>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                ¿Contacto con agua?
              </p>
              <div className="flex flex-wrap gap-2">
                <ActionBtn onClick={handleDry} primary>✅ No, está seco</ActionBtn>
                <ActionBtn onClick={handleWet} danger>💧 Sí, se mojó</ActionBtn>
              </div>
            </>
          )}

          {/* ── Tipo de equipo ── */}
          {step === "device" && (
            <>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Tipo de equipo
              </p>
              <div className="flex flex-wrap gap-2">
                <ActionBtn onClick={() => selectDevice("celular")}>📱 Celular</ActionBtn>
                <ActionBtn onClick={() => selectDevice("laptop")}>💻 Laptop</ActionBtn>
                <ActionBtn onClick={() => selectDevice("pc")}>🖥️ PC de escritorio</ActionBtn>
              </div>
            </>
          )}

          {(step === "wet" || step === "error") && (
            <ActionBtn onClick={restart} full icon={<RefreshCw className="w-4 h-4" />}>
              Nuevo presupuesto
            </ActionBtn>
          )}

          {step === "loading" && (
            <p className="text-sm text-gray-400 py-1">Cargando catálogo…</p>
          )}

          {/* ── Marca ── */}
          {step === "brand" && (
            <>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Elegí la marca
              </p>
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => (
                  <ActionBtn key={b} onClick={() => selectBrand(b)}>
                    {deviceType ? DEVICE_ICON[deviceType] : "📱"} {b}
                  </ActionBtn>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-2 flex flex-col gap-2">
                <ActionBtn full onClick={selectGenericBrand}>
                  ❓ No sé la marca / marca genérica
                </ActionBtn>
                <ActionBtn full onClick={() => setStep("device")}>
                  ← Cambiar tipo de equipo
                </ActionBtn>
              </div>
            </>
          )}

          {/* ── Modelo ── */}
          {step === "model" && (
            <>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Buscá tu modelo · {availableModels.length} disponibles
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  autoFocus
                  value={modelQ}
                  onChange={(e) => setModelQ(e.target.value)}
                  placeholder={deviceType ? MODEL_PLACEHOLDER[deviceType] : MODEL_PLACEHOLDER.celular}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1E3A8A] placeholder:text-gray-400"
                />
              </div>
              {filteredModels.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Sin coincidencias.{" "}
                  <a
                    href={`https://wa.me/${WA}?text=${encodeURIComponent(`Hola! Quisiera un presupuesto para reparar mi ${sel.brand}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1E3A8A] font-medium hover:underline"
                  >
                    Consultanos por WhatsApp
                  </a>
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredModels.map((m) => {
                    const q = modelQ.toLowerCase();
                    const idx = m.toLowerCase().indexOf(q);
                    const hl =
                      q && idx >= 0
                        ? m.slice(0, idx) +
                          `<mark class="bg-blue-100 text-[#1E3A8A] rounded px-0.5">${m.slice(idx, idx + q.length)}</mark>` +
                          m.slice(idx + q.length)
                        : m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => selectModel(m)}
                        className="cm-opt flex-1 basis-[calc(50%-4px)] min-w-28 flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl bg-white transition-colors text-left"
                        dangerouslySetInnerHTML={{ __html: `<span>📲</span><span>${hl}</span>` }}
                      />
                    );
                  })}
                </div>
              )}
              <div className="border-t border-gray-100 pt-2 flex flex-col gap-2">
                <ActionBtn full onClick={selectUnknownModel}>
                  ❓ No sé el modelo
                </ActionBtn>
                <ActionBtn
                  full
                  onClick={() => {
                    setSel((p) => ({ ...p, brand: "", model: "" }));
                    setStep("brand");
                  }}
                >
                  ← Cambiar marca
                </ActionBtn>
              </div>
            </>
          )}

          {/* ── Reparaciones / Síntomas ── */}
          {step === "repair" && (
            <>
              {isGeneric ? (
                <>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    ¿Cuál es el problema?
                  </p>
                  {availableSymptoms.length === 0 ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-gray-400">Ya seleccionaste todos los problemas disponibles.</p>
                      <ActionBtn full onClick={handleNoMore} primary>Listo, es todo →</ActionBtn>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableSymptoms.map((s) => (
                        <ActionBtn key={s} onClick={() => selectSymptom(s)}>
                          {iconFor(s)} {s}
                        </ActionBtn>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    {cart.length > 0 ? "Agregar otra reparación" : "Tipo de reparación"}
                  </p>
                  {availableRepairs.length === 0 ? (
                    <div className="flex flex-col gap-2">
                      {cart.length > 0 ? (
                        <ActionBtn full onClick={handleNoMore} primary>Listo, es todo →</ActionBtn>
                      ) : (
                        <ActionBtn
                          full
                          whatsapp
                          href={`https://wa.me/${WA}?text=${encodeURIComponent(`Hola! Quisiera un presupuesto para ${sel.brand} ${sel.model}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="w-4 h-4" /> Consultar por WhatsApp
                        </ActionBtn>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableRepairs.map((r) => (
                        <ActionBtn
                          key={r}
                          onClick={() => selectRepair(r, sel.brand, sel.model)}
                        >
                          {iconFor(r)} {r}
                        </ActionBtn>
                      ))}
                    </div>
                  )}
                </>
              )}
              {cart.length === 0 && (
                <ActionBtn
                  full
                  onClick={() => {
                    if (isGeneric && sel.brand === GENERIC_BRAND) {
                      setSel({ brand: "", model: "", repair: "", price: "" });
                      setStep("brand");
                    } else if (isGeneric) {
                      setSel((p) => ({ ...p, model: "", repair: "", price: "" }));
                      setModelQ("");
                      setStep("model");
                    } else {
                      setSel((p) => ({ ...p, model: "", repair: "" }));
                      setModelQ("");
                      setStep("model");
                    }
                  }}
                >
                  ← {isGeneric && sel.brand === GENERIC_BRAND ? "Cambiar marca" : "Cambiar modelo"}
                </ActionBtn>
              )}
            </>
          )}

          {/* ── ¿Más problemas? ── */}
          {step === "more" && (
            <>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                ¿Tenés otra falla?
              </p>
              {/* Resumen del carrito */}
              {cart.length > 0 && (
                <div className="bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
                  <p className="text-[11px] text-blue-600 font-semibold mb-1">
                    {cart.length} problema{cart.length > 1 ? "s" : ""} anotado{cart.length > 1 ? "s" : ""}:
                  </p>
                  <ul className="space-y-0.5">
                    {cart.map((item, i) => (
                      <li key={i} className="text-xs text-gray-700 flex justify-between">
                        <span>• {item.repair}</span>
                        {item.price !== "a consultar" && (
                          <span className="text-[#1E3A8A] font-semibold">${fmtPrice(item.price)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <ActionBtn onClick={handleAddMore} primary>Sí, tengo otra falla</ActionBtn>
                <ActionBtn onClick={handleNoMore}>No, es todo →</ActionBtn>
              </div>
            </>
          )}

          {/* ── Nombre ── */}
          {step === "name" && (
            <form
              onSubmit={(e) => { e.preventDefault(); submitName(); }}
              className="flex gap-2"
            >
              <input
                autoFocus
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                placeholder="Tu nombre…"
                maxLength={40}
                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1E3A8A] placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1E3A8A] text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-colors"
              >
                Listo →
              </button>
            </form>
          )}

          {/* ── Done ── */}
          {step === "done" && (
            <div className="flex flex-col gap-2">
              {isMobile || !session ? (
                <button
                  type="button"
                  onClick={handleMobileWA}
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar por WhatsApp
                </button>
              ) : desktopSent ? (
                <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
                  <span className="text-green-600 mt-0.5">✅</span>
                  <p className="font-medium leading-snug">
                    Tu solicitud fue enviada. Un técnico o asesor se comunicará con vos a la brevedad.
                  </p>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleDesktopSubmit}
                    className="flex items-center justify-center gap-2 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Solicitar confirmación de presupuesto
                  </button>
                  <p className="text-[11px] text-gray-400 text-center">
                    Un técnico o asesor se comunicará con vos para coordinar la entrega del equipo al taller.
                  </p>
                </>
              )}
              <button
                type="button"
                onClick={restart}
                className="flex items-center justify-center gap-2 text-sm text-gray-500 border border-gray-200 rounded-xl px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Nuevo presupuesto
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── ActionBtn helper ──────────────────────────────────────────────────
interface ABProps {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  danger?: boolean;
  full?: boolean;
  whatsapp?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  icon?: React.ReactNode;
}
function ActionBtn({ children, onClick, primary, danger, full, whatsapp, href, target, rel }: ABProps) {
  const base = [
    "cm-opt flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl border transition-colors",
    full ? "w-full justify-center" : "flex-1 basis-[calc(50%-4px)] min-w-28",
    primary
      ? "bg-[#1E3A8A] text-white border-[#1E3A8A] hover:bg-blue-800"
      : danger
        ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
        : whatsapp
          ? "bg-[#25D366] text-white border-transparent hover:bg-[#20bd5a]"
          : "bg-white text-gray-700 border-gray-200",
  ].join(" ");

  if (href) {
    return <a href={href} target={target} rel={rel} className={base}>{children}</a>;
  }
  return (
    <button type="button" onClick={onClick} className={base}>
      {children}
    </button>
  );
}
