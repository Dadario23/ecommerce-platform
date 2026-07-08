"use client";

import { Input } from "@/components/ui/input";
import {
  MapPin,
  Home,
  Truck,
  Check,
  Package,
  Pencil,
  ListChecks,
  Zap,
  MessageCircle,
} from "lucide-react";
import type {
  AddressData,
  AddressErrors,
  AddressUIMode,
  DeliveryMethod,
  SavedAddress,
  ShippingType,
  ShippingZone,
} from "../types";
import CheckoutAddressForm from "./CheckoutAddressForm";
import { useWhatsAppNumber } from "@/hooks/use-whatsapp-number";

interface CheckoutStepDeliveryProps {
  shippingEnabled: boolean;
  deliveryMethod: DeliveryMethod;
  onDeliveryMethodChange: (m: DeliveryMethod) => void;
  address: AddressData;
  addressErrors: AddressErrors;
  addressUIMode: AddressUIMode;
  onAddressUIModeChange: (m: AddressUIMode) => void;
  savedAddresses: SavedAddress[];
  selectedAddressId: string | null;
  onSelectSaved: (addr: SavedAddress) => void;
  onPatchAddress: (data: Partial<AddressData>) => void;
  shippingType: ShippingType;
  onShippingTypeChange: (t: ShippingType) => void;
  detectedZone: ShippingZone | null;
  onContinue: () => void;
}

export default function CheckoutStepDelivery({
  shippingEnabled,
  deliveryMethod,
  onDeliveryMethodChange,
  address,
  addressErrors,
  addressUIMode,
  onAddressUIModeChange,
  savedAddresses,
  selectedAddressId,
  onSelectSaved,
  onPatchAddress,
  shippingType,
  onShippingTypeChange,
  detectedZone,
  onContinue,
}: CheckoutStepDeliveryProps) {
  const whatsappNumber = useWhatsAppNumber();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">
        {shippingEnabled ? "Elegí la forma de entrega" : "Forma de entrega"}
      </h1>

      {shippingEnabled ? (
        <>
          {/* Delivery method options */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => onDeliveryMethodChange("domicilio")}
              className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border-2 transition-all ${
                deliveryMethod === "domicilio"
                  ? "border-(--tenant-primary) bg-blue-50"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  deliveryMethod === "domicilio" ? "bg-(--tenant-primary)" : "bg-gray-100"
                }`}
              >
                <Home
                  className={`w-5 h-5 ${
                    deliveryMethod === "domicilio" ? "text-white" : "text-gray-400"
                  }`}
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">Envío a domicilio</p>
                <p className="text-xs text-gray-500 mt-0.5">Recibís en tu casa o donde quieras</p>
              </div>
              {deliveryMethod === "domicilio" && (
                <Check className="w-5 h-5 text-(--tenant-primary) shrink-0 mt-0.5" />
              )}
            </button>

            {/* Punto de encuentro — próximamente */}
            <div className="flex items-start gap-4 p-4 rounded-2xl border-2 border-gray-100 bg-white opacity-50 cursor-not-allowed">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm text-gray-800">
                    Retiro en punto de encuentro
                  </p>
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                    Próximamente
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Retirá en una sucursal o punto cercano
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDeliveryMethodChange("contraentrega")}
              className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border-2 transition-all ${
                deliveryMethod === "contraentrega"
                  ? "border-(--tenant-primary) bg-blue-50"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  deliveryMethod === "contraentrega" ? "bg-(--tenant-primary)" : "bg-gray-100"
                }`}
              >
                <Package
                  className={`w-5 h-5 ${
                    deliveryMethod === "contraentrega" ? "text-white" : "text-gray-400"
                  }`}
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">Contraentrega</p>
                <p className="text-xs text-gray-500 mt-0.5">Pagás cuando recibís en tu casa</p>
              </div>
              {deliveryMethod === "contraentrega" && (
                <Check className="w-5 h-5 text-(--tenant-primary) shrink-0 mt-0.5" />
              )}
            </button>
          </div>

          {/* Address section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-(--tenant-primary)" />
              <p className="text-sm font-semibold text-gray-700">Dirección de entrega</p>
            </div>

            <div className="p-5 space-y-4">
              {addressUIMode === "default" && (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-(--tenant-primary)/20">
                    <Check className="w-4 h-4 text-(--tenant-primary) mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {savedAddresses.find((a) => a._id === selectedAddressId)?.title ??
                          "Mi dirección"}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {address.street}, {address.city}
                      </p>
                      <p className="text-xs text-gray-500">
                        {address.state} {address.postalCode}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onAddressUIModeChange("edit")}
                      className="flex items-center gap-1.5 text-xs font-semibold text-(--tenant-primary) hover:text-blue-800 border border-(--tenant-primary)/30 hover:border-(--tenant-primary) px-3 py-2 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Modificar dirección
                    </button>
                    {savedAddresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onAddressUIModeChange("list")}
                        className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-400 px-3 py-2 rounded-lg transition-colors"
                      >
                        <ListChecks className="w-3.5 h-3.5" /> Elegir otra
                      </button>
                    )}
                  </div>
                </>
              )}

              {addressUIMode === "list" && (
                <>
                  <div className="space-y-2">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr._id}
                        type="button"
                        onClick={() => onSelectSaved(addr)}
                        className={`w-full text-left flex items-start gap-3 p-3 border rounded-xl transition-colors ${
                          selectedAddressId === addr._id
                            ? "border-(--tenant-primary) bg-blue-50"
                            : "border-gray-100 hover:border-gray-300"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                            selectedAddressId === addr._id
                              ? "border-(--tenant-primary) bg-(--tenant-primary)"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedAddressId === addr._id && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-800">
                            {addr.title}
                            {addr.isDefault && (
                              <span className="ml-2 text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded-full">
                                Predeterminada
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddressUIModeChange("default")}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Cancelar
                  </button>
                </>
              )}

              {addressUIMode === "edit" && (
                <>
                  <CheckoutAddressForm
                    address={address}
                    errors={addressErrors}
                    onChange={onPatchAddress}
                    onPlaceSelect={onPatchAddress}
                  />
                  {savedAddresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onAddressUIModeChange("default")}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Cancelar
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Shipping type selector */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <Truck className="w-4 h-4 text-(--tenant-primary)" />
              <p className="text-sm font-semibold text-gray-700">Tipo de envío</p>
            </div>
            <div className="p-5 space-y-3">
              {!address.city.trim() ? (
                <p className="text-sm text-gray-400 text-center py-2">
                  Completá tu dirección para ver las opciones de envío
                </p>
              ) : !detectedZone ? (
                <div className="space-y-3">
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    Tu zona (<span className="font-semibold">{address.city}</span>) no está
                    cubierta por nuestro servicio de envío propio.
                  </p>
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Consultar envío por WhatsApp
                  </a>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500">
                    Zona detectada:{" "}
                    <span className="font-semibold text-gray-700">
                      {detectedZone.name} — {address.city}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => onShippingTypeChange("flex")}
                    className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      shippingType === "flex"
                        ? "border-(--tenant-primary) bg-blue-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        shippingType === "flex" ? "bg-(--tenant-primary)" : "bg-gray-100"
                      }`}
                    >
                      <Zap
                        className={`w-5 h-5 ${
                          shippingType === "flex" ? "text-white" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-800">Envío flex</p>
                      <p className="text-xs text-gray-500">Mismo día / día siguiente</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        ${detectedZone.flex.toLocaleString("es-AR")}
                      </p>
                      {shippingType === "flex" && (
                        <Check className="w-4 h-4 text-(--tenant-primary) ml-auto mt-1" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onShippingTypeChange("standard")}
                    className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      shippingType === "standard"
                        ? "border-(--tenant-primary) bg-blue-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        shippingType === "standard" ? "bg-(--tenant-primary)" : "bg-gray-100"
                      }`}
                    >
                      <Truck
                        className={`w-5 h-5 ${
                          shippingType === "standard" ? "text-white" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-800">Envío estándar</p>
                      <p className="text-xs text-gray-500">2-3 días hábiles</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        ${detectedZone.standard.toLocaleString("es-AR")}
                      </p>
                      {shippingType === "standard" && (
                        <Check className="w-4 h-4 text-(--tenant-primary) ml-auto mt-1" />
                      )}
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onContinue}
            disabled={!!address.city.trim() && !detectedZone}
            className="w-full bg-(--tenant-primary) hover:bg-blue-800 text-white font-semibold py-4 rounded-xl transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </>
      ) : (
        /* Envíos desactivados: retiro / punto acordado */
        <>
          <div className="flex items-start gap-4 p-5 rounded-2xl border-2 border-(--tenant-primary) bg-blue-50">
            <div className="w-10 h-10 rounded-xl bg-(--tenant-primary) flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-gray-800">Retiro / punto acordado</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Podés retirar el producto en nuestro local o coordinar un punto de encuentro.
                Una vez confirmado el pedido te contactamos para arreglar los detalles.
              </p>
            </div>
            <Check className="w-5 h-5 text-(--tenant-primary) shrink-0 mt-0.5" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-(--tenant-primary)" />
              <p className="text-sm font-semibold text-gray-700">Datos de contacto</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                Teléfono (para coordinar la entrega)
              </label>
              <Input
                value={address.phone}
                onChange={(e) => onPatchAddress({ phone: e.target.value })}
                placeholder="11 1234-5678"
                className="rounded-lg"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="w-full bg-(--tenant-primary) hover:bg-blue-800 text-white font-semibold py-4 rounded-xl transition-colors mt-2"
          >
            Continuar
          </button>
        </>
      )}
    </div>
  );
}
