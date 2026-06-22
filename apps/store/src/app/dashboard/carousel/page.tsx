import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getModels } from "@/lib/tenant-models";
import CarouselClient from "./CarouselClient";

export const revalidate = 0;

export default async function CarouselPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") redirect("/");

  const { Setting } = await getModels();
  const doc = await Setting.findOne().lean<{ carouselImages?: string[] }>();
  const images = doc?.carouselImages ?? [];

  return <CarouselClient initialImages={images} />;
}
