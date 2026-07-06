"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/useCartStore";
import Spinner from "@/components/ui/Spinner";
import type {
  WizardStep,
  DeliveryMethod,
  PaymentMethod,
  AddressUIMode,
  ShippingType,
  ShippingZone,
  CartItem,
  SavedAddress,
  AddressData,
  AddressErrors,
} from "./types";
import { findZone, findZoneByZip, fromSaved } from "./helpers";
import CheckoutStepBar from "./components/CheckoutStepBar";
import {
  CheckoutInitLoader,
  CheckoutTransitionLoader,
  CheckoutProcessingLoader,
  CheckoutEmptyCartView,
} from "./components/CheckoutLoadingScreens";
import CheckoutStepDelivery from "./components/CheckoutStepDelivery";
import CheckoutStepDate from "./components/CheckoutStepDate";
import CheckoutStepPayment from "./components/CheckoutStepPayment";
import CheckoutStepReview from "./components/CheckoutStepReview";

interface CheckoutClientProps {
  shippingEnabled?: boolean;
}

export default function CheckoutClient({ shippingEnabled = true }: CheckoutClientProps) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [step, setStep] = useState<WizardStep>("init-loading");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    shippingEnabled ? "domicilio" : "retiro",
  );
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [address, setAddress] = useState<AddressData>({
    firstName: "", lastName: "", street: "", city: "",
    state: "", postalCode: "", country: "Argentina", phone: "",
  });
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({});
  const [addressUIMode, setAddressUIMode] = useState<AddressUIMode>("default");
  const [zonesData, setZonesData] = useState<ShippingZone[]>([]);
  const [shippingType, setShippingType] = useState<ShippingType>("flex");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mercadopago");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const subtotal =
    items?.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0) ?? 0;

  const detectedZone =
    findZone(address.city, zonesData) ?? findZoneByZip(address.postalCode, zonesData);
  const shippingCost = detectedZone
    ? shippingType === "flex"
      ? detectedZone.flex
      : detectedZone.standard
    : 0;
  const total = Math.max(0, subtotal + shippingCost - couponDiscount);
  const today = new Date();

  // ── Init ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/login"); return; }
    if (authStatus !== "authenticated") return;

    const parts = (session?.user?.name ?? "").split(" ");
    const baseName = { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") || "-" };
    setAddress((prev) => ({ ...prev, ...baseName }));

    fetch("/api/shipping/zones")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setZonesData(data); })
      .catch(() => {});

    fetch("/api/user/addresses")
      .then((r) => r.json())
      .then((data: SavedAddress[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setSavedAddresses(data);
          const def = data.find((a) => a.isDefault) ?? data[0];
          setSelectedAddressId(def._id ?? null);
          setAddress((prev) => fromSaved(def, { ...prev, ...baseName }));
          setAddressUIMode("default");
        } else {
          setAddressUIMode("edit");
        }
      })
      .catch(() => { setAddressUIMode("edit"); });

    const timer = setTimeout(() => setStep("delivery"), 1800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  useEffect(() => {
    setPaymentMethod(deliveryMethod === "contraentrega" ? "cash" : "mercadopago");
  }, [deliveryMethod]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function patchAddress(data: Partial<AddressData>) {
    setAddress((prev) => ({ ...prev, ...data }));
  }

  function handleSelectSaved(addr: SavedAddress) {
    setSelectedAddressId(addr._id ?? null);
    setAddress((prev) => fromSaved(addr, prev));
    setAddressUIMode("default");
  }

  function validateAddress(): boolean {
    const errs: AddressErrors = {};
    if (!address.street?.trim()) errs.street = "La dirección es obligatoria";
    if (!address.city?.trim()) errs.city = "La ciudad es obligatoria";
    if (!address.state?.trim()) errs.state = "La provincia es obligatoria";
    if (!address.postalCode?.trim()) errs.postalCode = "El código postal es obligatorio";
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goToDate() {
    if (shippingEnabled && !validateAddress()) return;
    setAddressUIMode("default");
    setStep("trans-date");
    setTimeout(() => setStep("date"), 1000);
  }

  function goToPayment() {
    setStep("trans-payment");
    setTimeout(() => setStep("payment"), 1000);
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCheckingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), orderTotal: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error ?? "Cupón inválido");
        setCouponDiscount(0);
        setAppliedCoupon("");
      } else {
        setCouponDiscount(data.discount);
        setAppliedCoupon(data.code);
        setCouponError("");
      }
    } catch {
      setCouponError("Error al verificar el cupón");
    } finally {
      setCheckingCoupon(false);
    }
  }

  function removeCoupon() {
    setCouponCode("");
    setCouponDiscount(0);
    setAppliedCoupon("");
    setCouponError("");
  }

  function buildPayload() {
    const notesParts: string[] = [];
    if (!shippingEnabled) {
      notesParts.push("Entrega: Retiro / punto acordado con el vendedor");
    } else {
      if (detectedZone) notesParts.push(`Zona: ${detectedZone.name}`);
      notesParts.push(`Tipo de envío: ${shippingType === "flex" ? "Flex" : "Estándar"}`);
    }
    return {
      items, subtotal,
      shipping: shippingEnabled ? shippingCost : 0,
      discount: couponDiscount,
      couponCode: appliedCoupon || undefined,
      total: shippingEnabled ? total : Math.max(0, subtotal - couponDiscount),
      paymentMethod,
      shippingMethod: shippingEnabled ? deliveryMethod : "retiro",
      notes: notesParts.join(" | "),
      shippingAddress: {
        firstName: address.firstName, lastName: address.lastName,
        street: shippingEnabled ? address.street : "A coordinar",
        city: shippingEnabled ? address.city : "A coordinar",
        state: shippingEnabled ? address.state : "",
        zipCode: shippingEnabled ? address.postalCode : "",
        country: address.country || "Argentina",
        phone: address.phone,
      },
    };
  }

  async function confirmPurchase() {
    setIsProcessing(true);
    setErrorMsg("");
    const payload = buildPayload();
    try {
      if (paymentMethod === "mercadopago") {
        const res = await fetch("/api/payments/create-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setErrorMsg(
            res.status === 409 && Array.isArray(body.details)
              ? body.details.join("\n")
              : res.status === 422 && body.error
                ? body.error
                : "Error al crear preferencia de pago",
          );
          setIsProcessing(false);
          return;
        }
        const { initPoint } = await res.json();
        clearCart();
        window.location.href = initPoint;
      } else {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setErrorMsg(
            res.status === 409 && Array.isArray(body.details)
              ? body.details.join("\n")
              : res.status === 422 && body.error
                ? body.error
                : "Error al crear la orden",
          );
          setIsProcessing(false);
          return;
        }
        const created = await res.json();
        clearCart();
        router.push(`/order-success?orderId=${created.orderId}`);
      }
    } catch {
      setErrorMsg("Hubo un error al procesar tu pedido. Intentá de nuevo.");
      setIsProcessing(false);
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────────────

  if (authStatus === "loading") {
    return (
      <div className="pt-20 md:pt-32 flex items-center justify-center min-h-screen bg-gray-50 minimal:bg-transparent">
        <Spinner />
      </div>
    );
  }

  if (step === "init-loading") {
    return (
      <main className="pt-20 md:pt-32 pb-16 min-h-screen bg-gray-50 minimal:bg-transparent">
        <div className="max-w-lg mx-auto px-4">
          <CheckoutInitLoader />
        </div>
      </main>
    );
  }

  if (isProcessing) {
    return (
      <main className="pt-20 md:pt-32 pb-16 min-h-screen bg-gray-50 minimal:bg-transparent">
        <div className="max-w-lg mx-auto px-4">
          <CheckoutProcessingLoader />
        </div>
      </main>
    );
  }

  if (!items || items.length === 0) {
    return <CheckoutEmptyCartView onGoToStore={() => router.push("/")} />;
  }

  if (step === "trans-date") {
    return (
      <main className="pt-20 md:pt-32 pb-16 min-h-screen bg-gray-50 minimal:bg-transparent">
        <div className="max-w-lg mx-auto px-4">
          <CheckoutTransitionLoader message="Calculando opciones de entrega..." />
        </div>
      </main>
    );
  }

  if (step === "trans-payment") {
    return (
      <main className="pt-20 md:pt-32 pb-16 min-h-screen bg-gray-50 minimal:bg-transparent">
        <div className="max-w-lg mx-auto px-4">
          <CheckoutTransitionLoader message="Cargando métodos de pago..." />
        </div>
      </main>
    );
  }

  const paymentLabel = {
    mercadopago: "Mercado Pago",
    cash: shippingEnabled ? "Efectivo al recibir" : "Efectivo en el encuentro",
    transfer: "Transferencia bancaria",
  }[paymentMethod];

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <main className="pt-20 md:pt-32 pb-16 min-h-screen bg-gray-50 minimal:bg-transparent">
      <div className="max-w-lg mx-auto px-4">
        <CheckoutStepBar step={step} />

        {step === "delivery" && (
          <CheckoutStepDelivery
            shippingEnabled={shippingEnabled}
            deliveryMethod={deliveryMethod}
            onDeliveryMethodChange={setDeliveryMethod}
            address={address}
            addressErrors={addressErrors}
            addressUIMode={addressUIMode}
            onAddressUIModeChange={setAddressUIMode}
            savedAddresses={savedAddresses}
            selectedAddressId={selectedAddressId}
            onSelectSaved={handleSelectSaved}
            onPatchAddress={patchAddress}
            shippingType={shippingType}
            onShippingTypeChange={setShippingType}
            detectedZone={detectedZone}
            onContinue={goToDate}
          />
        )}

        {step === "date" && (
          <CheckoutStepDate
            shippingEnabled={shippingEnabled}
            shippingType={shippingType}
            today={today}
            onContinue={goToPayment}
            onBack={() => setStep("delivery")}
          />
        )}

        {step === "payment" && (
          <CheckoutStepPayment
            shippingEnabled={shippingEnabled}
            deliveryMethod={deliveryMethod}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            couponCode={couponCode}
            onCouponCodeChange={setCouponCode}
            couponError={couponError}
            couponDiscount={couponDiscount}
            appliedCoupon={appliedCoupon}
            checkingCoupon={checkingCoupon}
            onApplyCoupon={applyCoupon}
            onRemoveCoupon={removeCoupon}
            onContinue={() => setStep("review")}
            onBack={() => setStep("date")}
          />
        )}

        {step === "review" && (
          <CheckoutStepReview
            shippingEnabled={shippingEnabled}
            items={items}
            address={address}
            deliveryMethod={deliveryMethod}
            shippingType={shippingType}
            detectedZone={detectedZone}
            shippingCost={shippingCost}
            subtotal={subtotal}
            couponDiscount={couponDiscount}
            appliedCoupon={appliedCoupon}
            total={total}
            paymentMethod={paymentMethod}
            paymentLabel={paymentLabel}
            today={today}
            isProcessing={isProcessing}
            errorMsg={errorMsg}
            onConfirm={confirmPurchase}
            onBack={() => setStep("payment")}
          />
        )}
      </div>
    </main>
  );
}
