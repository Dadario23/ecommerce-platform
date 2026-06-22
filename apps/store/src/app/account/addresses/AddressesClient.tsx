"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus, Edit, Trash2, MapPin, Star,
  Home, Briefcase, User, Users,
} from "lucide-react";
import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import { clearShippingZoneCache } from "@/hooks/useShippingZone";
import LocationMap from "@/components/ui/LocationMap";
import { ConfirmModal } from "@/components/dashboard/shared/ConfirmModal";
import { cn } from "@/lib/utils";

interface Address {
  _id?: string;
  title: string;
  firstName: string;
  lastName: string;
  street: string;
  betweenStreets?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
}

const EMPTY_FORM: Address = {
  title: "Casa",
  firstName: "", lastName: "", street: "", betweenStreets: "",
  city: "", state: "", zipCode: "", country: "Argentina",
  phone: "", isDefault: false,
};

const AR_PROVINCES = [
  "Buenos Aires","CABA","Catamarca","Chaco","Chubut","Córdoba",
  "Corrientes","Entre Ríos","Formosa","Jujuy","La Pampa","La Rioja",
  "Mendoza","Misiones","Neuquén","Río Negro","Salta","San Juan",
  "San Luis","Santa Cruz","Santa Fe","Santiago del Estero",
  "Tierra del Fuego","Tucumán",
];

const ADDRESS_TYPES = [
  { value: "Casa",    icon: Home,      label: "Casa" },
  { value: "Trabajo", icon: Briefcase, label: "Trabajo" },
  { value: "Otro",    icon: MapPin,    label: "Otro" },
];

export default function AddressesClient() {
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Address>(EMPTY_FORM);
  const [streetNumber, setStreetNumber] = useState("");
  const [receiverType, setReceiverType] = useState<"self" | "other">("self");
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [saving, setSaving] = useState(false);
  const [streetNumberError, setStreetNumberError] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (session) loadAddresses();
  }, [session]);

  // Re-geocodifica cuando el usuario escribe el número de calle,
  // combinando calle + número + ciudad para obtener coordenadas precisas.
  useEffect(() => {
    const street = formData.street.trim();
    const city   = formData.city.trim();
    const number = streetNumber.trim();

    if (!street || !number || !city) return;

    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    geocodeTimerRef.current = setTimeout(async () => {
      try {
        const q = encodeURIComponent(`${street} ${number}, ${city}, ${formData.state || "Buenos Aires"}, Argentina`);
        const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&limit=1&countrycodes=ar`;
        const res  = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            setMapCenter([lat, lng]);
          }
        }
      } catch { /* silencioso — el pin queda donde estaba */ }
    }, 600);

    return () => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    };
  }, [streetNumber, formData.street, formData.city, formData.state]);

  const loadAddresses = async () => {
    setIsLoading(true);
    fetch("/api/user/addresses")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setAddresses(Array.isArray(d) ? d : []))
      .catch(() => setAddresses([]))
      .finally(() => setIsLoading(false));
  };

  const openNew = () => {
    setEditingId(null);
    setStreetNumber("");
    setStreetNumberError(false);
    setReceiverType("self");
    setMapCenter(null);
    setFormData({ ...EMPTY_FORM });
    setIsDialogOpen(true);
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr._id ?? null);
    setStreetNumberError(false);

    // Separar calle y número (ej: "Rio Dulce 641" → "Rio Dulce" + "641")
    const match = addr.street.trim().match(/^(.+?)\s+(\d+\S*)$/);
    const streetName = match ? match[1] : addr.street;
    const streetNum  = match ? match[2] : "";
    setStreetNumber(streetNum);

    // Detectar si recibe el mismo cliente
    const sessionFirst = session?.user?.name?.split(" ")[0] ?? "";
    setReceiverType(addr.firstName === sessionFirst ? "self" : "other");

    // Restaurar mapa si la dirección tiene coordenadas
    setMapCenter(addr.lat && addr.lng ? [addr.lat, addr.lng] : null);

    setFormData({ ...addr, street: streetName });
    setIsDialogOpen(true);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!streetNumber.trim()) {
      setStreetNumberError(true);
      return;
    }
    setStreetNumberError(false);

    const sessionFirst = session?.user?.name?.split(" ")[0] ?? "";
    const sessionLast  = session?.user?.name?.split(" ").slice(1).join(" ") ?? "";

    const submitData: Address = {
      ...formData,
      street: `${formData.street.trim()} ${streetNumber.trim()}`.trim(),
      firstName: receiverType === "self" ? sessionFirst : formData.firstName,
      lastName:  receiverType === "self" ? sessionLast  : formData.lastName,
      lat: mapCenter?.[0],
      lng: mapCenter?.[1],
    };

    setSaving(true);
    try {
      const url = editingId
        ? `/api/user/addresses/${editingId}`
        : "/api/user/addresses";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      if (res.ok) {
        clearShippingZoneCache();
        await loadAddresses();
        setIsDialogOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/user/addresses/${id}`, { method: "DELETE" });
    clearShippingZoneCache();
    loadAddresses();
  };

  const setAsDefault = async (id: string) => {
    await fetch(`/api/user/addresses/${id}/default`, { method: "PUT" });
    clearShippingZoneCache();
    loadAddresses();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Mis direcciones</h2>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 bg-[#1E3A8A] text-white text-sm font-semibold px-3.5 py-2 rounded-xl hover:bg-blue-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </DialogTrigger>

          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar dirección" : "Nueva dirección"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 mt-2">

              {/* ── Tipo de dirección ── */}
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-2 block">
                  Tipo de dirección *
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {ADDRESS_TYPES.map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, title: value }))}
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-semibold transition-all",
                        formData.title === value
                          ? "border-[#1E3A8A] bg-blue-50 text-[#1E3A8A]"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Quién recibe ── */}
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-2 block">
                  ¿Quién recibe? *
                </Label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setReceiverType("self")}
                    className={cn(
                      "flex items-center gap-2 justify-center py-2.5 rounded-xl border-2 text-xs font-semibold transition-all",
                      receiverType === "self"
                        ? "border-[#1E3A8A] bg-blue-50 text-[#1E3A8A]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    <User className="w-4 h-4" />
                    Yo mismo
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiverType("other")}
                    className={cn(
                      "flex items-center gap-2 justify-center py-2.5 rounded-xl border-2 text-xs font-semibold transition-all",
                      receiverType === "other"
                        ? "border-[#1E3A8A] bg-blue-50 text-[#1E3A8A]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    <Users className="w-4 h-4" />
                    Otra persona
                  </button>
                </div>

                {receiverType === "other" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                        Nombre *
                      </Label>
                      <Input
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInput}
                        required
                        placeholder="Nombre"
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                        Apellido *
                      </Label>
                      <Input
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInput}
                        required
                        placeholder="Apellido"
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Calle + Número ── */}
              <div>
                <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                  <div>
                    <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                      Calle *
                    </Label>
                    <AddressAutocomplete
                      value={formData.street}
                      onChange={(v) => setFormData((p) => ({ ...p, street: v }))}
                      onPlaceSelect={(c) => {
                        const streetName = c.street.replace(/\s+\d+\S*$/, "").trim();
                        const extractedNum = c.street.match(/\s+(\d+\S*)$/)?.[1] ?? "";
                        setFormData((p) => ({
                          ...p,
                          street: streetName || c.street,
                          city: c.city || p.city,
                          state: c.state || p.state,
                          zipCode: c.postalCode || p.zipCode,
                        }));
                        if (extractedNum && !streetNumber) {
                          setStreetNumber(extractedNum);
                          setStreetNumberError(false);
                        }
                        if (c.lat && c.lng) setMapCenter([c.lat, c.lng]);
                      }}
                      placeholder="Nombre de la calle"
                      required
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                      Número *
                    </Label>
                    <Input
                      value={streetNumber}
                      onChange={(e) => {
                        setStreetNumber(e.target.value);
                        if (e.target.value.trim()) setStreetNumberError(false);
                      }}
                      placeholder="641"
                      className={cn("rounded-lg", streetNumberError && "border-red-400 focus-visible:ring-red-300")}
                    />
                    {streetNumberError && (
                      <p className="text-[10px] text-red-500 mt-1">Obligatorio</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Entre calles ── */}
              <div>
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Entre calles
                </Label>
                <Input
                  name="betweenStreets"
                  value={formData.betweenStreets ?? ""}
                  onChange={handleInput}
                  placeholder="Ej: entre Av. Colón y San Martín"
                  className="rounded-lg"
                />
              </div>

              {/* ── Ciudad / Provincia / CP ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Ciudad *
                  </Label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInput}
                    required
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Provincia *
                  </Label>
                  <Select
                    value={formData.state}
                    onValueChange={(v) => setFormData((p) => ({ ...p, state: v }))}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Seleccioná" />
                    </SelectTrigger>
                    <SelectContent>
                      {AR_PROVINCES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Cód. Postal *
                  </Label>
                  <Input
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInput}
                    required
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Teléfono
                  </Label>
                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInput}
                    placeholder="+54 11..."
                    className="rounded-lg"
                  />
                </div>
              </div>

              {/* ── Mapa ── */}
              {mapCenter && (
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    Confirmá tu ubicación en el mapa
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    El pin puede no estar exactamente en tu domicilio — arrastralo hasta la puerta de tu casa para que el repartidor llegue sin problemas.
                  </p>
                  <LocationMap
                    center={mapCenter}
                    onPositionChange={(lat, lng) => setMapCenter([lat, lng])}
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                    <span>Mantené presionado el pin y arrastralo para ajustar la posición exacta.</span>
                  </p>
                </div>
              )}

              {/* ── Botones ── */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#1E3A8A] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-70"
                >
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Lista de direcciones ── */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <MapPin className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">Sin direcciones guardadas</p>
          <p className="text-sm text-gray-400">
            Guardá tus direcciones para agilizar el checkout
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => {
            const TypeIcon = ADDRESS_TYPES.find((t) => t.value === addr.title)?.icon ?? MapPin;
            return (
              <div
                key={addr._id}
                className="relative border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors"
              >
                {addr.isDefault && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    <Star className="w-2.5 h-2.5 fill-blue-500" />
                    Principal
                  </span>
                )}

                <div className="flex items-start gap-2.5 mb-3">
                  <TypeIcon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{addr.title}</p>
                    <p className="text-xs text-gray-500">
                      {addr.firstName} {addr.lastName}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-0.5 mb-4">
                  <p>{addr.street}</p>
                  {addr.betweenStreets && (
                    <p className="text-gray-400">Entre: {addr.betweenStreets}</p>
                  )}
                  <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                  {addr.phone && <p>{addr.phone}</p>}
                </div>

                <div className="flex items-center gap-1 border-t border-gray-50 pt-3">
                  <button
                    onClick={() => openEdit(addr)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1E3A8A] font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => addr._id && setConfirmDeleteId(addr._id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                  {!addr.isDefault && (
                    <button
                      onClick={() => addr._id && setAsDefault(addr._id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors ml-auto"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Hacer principal
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        title="Eliminar dirección"
        description="¿Estás seguro? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}
