"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Star, CheckCircle } from "lucide-react";

export interface SerializedReview {
  _id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  createdAt: string;
}

// Keep internal alias for readability
type Review = SerializedReview;

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(3, "El título es muy corto").max(120),
  body: z.string().min(10, "El comentario es muy corto").max(2000),
});

type ReviewForm = z.infer<typeof reviewSchema>;

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-6 h-6" : "w-5 h-5";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sz} transition-colors ${
            star <= (readonly ? value : hovered || value)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          } ${!readonly ? "cursor-pointer" : ""}`}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="py-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{review.authorName}</span>
            {review.verified && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" />
                Compra verificada
              </span>
            )}
          </div>
          <StarRating value={review.rating} readonly size="sm" />
        </div>
        <span className="text-xs text-gray-400">
          {new Date(review.createdAt).toLocaleDateString("es-AR")}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-800 mt-2">{review.title}</p>
      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{review.body}</p>
    </div>
  );
}

export default function ReviewsSection({
  productId,
  initialAvg = 0,
  initialCount = 0,
  initialReviews = [],
}: {
  productId: string;
  initialAvg?: number;
  initialCount?: number;
  initialReviews?: Review[];
}) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [loading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, title: "", body: "" },
  });

  const rating = watch("rating");

  const onSubmit = async (data: ReviewForm) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Error al enviar la reseña");
        return;
      }
      const newReview = await res.json();
      setReviews((prev) => [newReview, ...prev]);
      setSubmitted(true);
      setShowForm(false);
      reset();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const avg = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : initialAvg;
  const count = reviews.length || initialCount;

  return (
    <div className="mt-2">
      {/* Summary */}
      <div className="flex items-center gap-4 mb-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">
            {count > 0 ? avg.toFixed(1) : "—"}
          </div>
          <StarRating value={Math.round(avg)} readonly size="md" />
          <p className="text-xs text-gray-500 mt-1">
            {count} reseña{count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* CTA */}
      {session && !submitted && !showForm && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
          className="mb-6"
        >
          Escribir una reseña
        </Button>
      )}
      {!session && (
        <p className="text-sm text-gray-500 mb-6">
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Iniciá sesión
          </a>{" "}
          para dejar una reseña.
        </p>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 border rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-4">Tu reseña</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label className="mb-2 block text-sm">Puntaje</Label>
              <StarRating
                value={rating}
                onChange={(v) => setValue("rating", v, { shouldValidate: true })}
                size="lg"
              />
              {errors.rating && (
                <p className="text-xs text-red-500 mt-1">Seleccioná un puntaje</p>
              )}
            </div>
            <div>
              <Label htmlFor="review-title" className="text-sm">Título</Label>
              <Input
                id="review-title"
                {...register("title")}
                placeholder="Resumen en una línea"
                className="mt-1"
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="review-body" className="text-sm">Comentario</Label>
              <Textarea
                id="review-body"
                {...register("body")}
                placeholder="Contá tu experiencia con el producto..."
                rows={4}
                className="mt-1"
              />
              {errors.body && (
                <p className="text-xs text-red-500 mt-1">{errors.body.message}</p>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} size="sm">
                {submitting ? "Enviando..." : "Publicar reseña"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setShowForm(false); reset(); }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {submitted && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-6">
          ¡Gracias por tu reseña!
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">
          Aún no hay reseñas. ¡Sé el primero!
        </p>
      ) : (
        <div className="divide-y">
          {reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
