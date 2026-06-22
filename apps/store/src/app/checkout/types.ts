export type WizardStep =
  | "init-loading"
  | "delivery"
  | "trans-date"
  | "date"
  | "trans-payment"
  | "payment"
  | "review";

export type DeliveryMethod = "domicilio" | "contraentrega" | "retiro";
export type PaymentMethod = "mercadopago" | "cash" | "transfer";
export type AddressUIMode = "default" | "list" | "edit";
export type ShippingType = "flex" | "standard";

export interface ShippingZone {
  id: string;
  name: string;
  localities: string[];
  zipRanges?: { min: number; max: number }[];
  flex: number;
  standard: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface SavedAddress {
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

export interface AddressData {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export type AddressErrors = Partial<Record<keyof AddressData, string>>;
