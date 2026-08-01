import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import type { UploadApiResponse } from "cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MAX_SIZE = 30 * 1024 * 1024; // 30MB
const MAX_DURATION = 60; // segundos
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session || (role !== "admin" && role !== "superadmin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Formato no permitido" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El video supera los 30MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "reels",
            resource_type: "video",
            eager: [
              {
                resource_type: "video",
                format: "jpg",
                transformation: [{ width: 400, crop: "fill" }],
              },
            ],
          },
          (error, result) => {
            if (error || !result) reject(error ?? new Error("Upload failed"));
            else resolve(result);
          },
        )
        .end(buffer);
    });

    if (result.duration > MAX_DURATION) {
      await cloudinary.uploader.destroy(result.public_id, { resource_type: "video" });
      return NextResponse.json(
        { error: `El video no puede superar los ${MAX_DURATION} segundos` },
        { status: 400 },
      );
    }

    return NextResponse.json({
      secure_url: result.secure_url,
      public_id: result.public_id,
      thumbnail_url: result.eager?.[0]?.secure_url,
      duration: result.duration,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
