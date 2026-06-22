import { getModels } from "@/lib/tenant-models";
import bcrypt from "bcryptjs";

export async function findUserByEmail(email: string) {
  const { User } = await getModels();
  return await User.findOne({ email });
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword);
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}
