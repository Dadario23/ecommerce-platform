import { z } from "zod";

type PasswordRequirement = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "Al menos 8 caracteres",
    test: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "Una letra mayúscula",
    test: (password) => /[A-ZÁÉÍÓÚÑ]/.test(password),
  },
  {
    id: "lowercase",
    label: "Una letra minúscula",
    test: (password) => /[a-záéíóúñ]/.test(password),
  },
  {
    id: "number",
    label: "Un número",
    test: (password) => /\d/.test(password),
  },
];

export const PASSWORD_POLICY_MESSAGE =
  "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número";

export function isPasswordValid(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((req) => req.test(password));
}

export const passwordSchema = z
  .string()
  .max(200)
  .refine(isPasswordValid, PASSWORD_POLICY_MESSAGE);
