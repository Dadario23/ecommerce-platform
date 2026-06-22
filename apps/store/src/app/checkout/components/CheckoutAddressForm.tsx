"use client";

import AddressAutocomplete from "@/components/ui/AddressAutocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AddressData, AddressErrors } from "../types";

interface CheckoutAddressFormProps {
  address: AddressData;
  errors: AddressErrors;
  onChange: (data: Partial<AddressData>) => void;
  onPlaceSelect: (data: Partial<AddressData>) => void;
}

export default function CheckoutAddressForm({
  address,
  errors,
  onChange,
  onPlaceSelect,
}: CheckoutAddressFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label
          htmlFor="street"
          className="text-xs font-medium text-gray-600 mb-1 block"
        >
          Dirección
        </Label>
        <AddressAutocomplete
          id="street"
          value={address.street}
          onChange={(v) => onChange({ street: v })}
          onPlaceSelect={(c) =>
            onPlaceSelect({
              street: c.street,
              city: c.city,
              state: c.state,
              postalCode: c.postalCode,
              country: c.country || "Argentina",
            })
          }
          placeholder="Calle y número..."
        />
        {errors.street && (
          <p className="text-xs text-red-500 mt-1">{errors.street}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label
            htmlFor="city"
            className="text-xs font-medium text-gray-600 mb-1 block"
          >
            Ciudad
          </Label>
          <Input
            id="city"
            value={address.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="Ciudad"
            className="rounded-lg"
          />
          {errors.city && (
            <p className="text-xs text-red-500 mt-1">{errors.city}</p>
          )}
        </div>
        <div>
          <Label
            htmlFor="state"
            className="text-xs font-medium text-gray-600 mb-1 block"
          >
            Provincia
          </Label>
          <Input
            id="state"
            value={address.state}
            onChange={(e) => onChange({ state: e.target.value })}
            placeholder="Provincia"
            className="rounded-lg"
          />
          {errors.state && (
            <p className="text-xs text-red-500 mt-1">{errors.state}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label
            htmlFor="postalCode"
            className="text-xs font-medium text-gray-600 mb-1 block"
          >
            Cód. Postal
          </Label>
          <Input
            id="postalCode"
            value={address.postalCode}
            onChange={(e) => onChange({ postalCode: e.target.value })}
            placeholder="1234"
            className="rounded-lg"
          />
          {errors.postalCode && (
            <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>
          )}
        </div>
        <div>
          <Label
            htmlFor="phone"
            className="text-xs font-medium text-gray-600 mb-1 block"
          >
            Teléfono
          </Label>
          <Input
            id="phone"
            value={address.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="11 1234-5678"
            className="rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
