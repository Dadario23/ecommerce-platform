// components/AddressSelector.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Address {
  _id?: string;
  title: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export default function AddressSelector({
  onAddressSelect,
}: {
  onAddressSelect: (address: any) => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      fetchUserAddresses();
    }
  }, [session]);

  const fetchUserAddresses = async () => {
    try {
      const res = await fetch("/api/user/addresses");
      const data = await res.json();
      setAddresses(data);

      // Seleccionar dirección por defecto automáticamente
      const defaultAddress = data.find((addr: Address) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress._id || "");
        onAddressSelect(defaultAddress);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const handleAddressChange = (addressId: string) => {
    setSelectedAddress(addressId);
    const address = addresses.find((addr) => addr._id === addressId);
    if (address) {
      onAddressSelect(address);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Direcciones guardadas</h3>
      {addresses.length > 0 ? (
        <div className="space-y-2">
          {addresses.map((address) => (
            <div key={address._id} className="flex items-center space-x-2">
              <input
                type="radio"
                id={address._id}
                name="address"
                value={address._id}
                checked={selectedAddress === address._id}
                onChange={() => handleAddressChange(address._id || "")}
              />
              <label htmlFor={address._id} className="text-sm">
                {address.title}: {address.street}, {address.city}
                {address.isDefault && " (Predeterminada)"}
              </label>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No tienes direcciones guardadas</p>
      )}

      <button
        type="button"
        className="text-blue-600 text-sm hover:underline"
        onClick={() => {
          /* Abrir modal para agregar dirección */
        }}
      >
        + Agregar nueva dirección
      </button>
    </div>
  );
}
