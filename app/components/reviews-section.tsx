"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./auth-provider";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  buyer_id: string;
  products?: {
    id: string;
    name: string;
  };
};

type ReviewsSectionProps = {
  productId: string;
  artisanId?: string;
  showForm?: boolean;
  orderId?: string;
  onReviewSubmitted?: () => void;
  darkMode?: boolean; // Para usar en modales con fondo oscuro
};

export function ReviewsSection({
  productId,
  artisanId,
  showForm = false,
  orderId,
  onReviewSubmitted,
  darkMode = false,
}: ReviewsSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(showForm);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [hasReviewedThisProduct, setHasReviewedThisProduct] = useState(false);
  const [hasReviewedThisOrder, setHasReviewedThisOrder] = useState(false);

  useEffect(() => {
    loadReviews();
    // Solo verificar si ya reseñó si el usuario es un comprador y hay un orderId
    if (user && orderId && user.user_metadata?.user_type === "comprador") {
      checkIfReviewed();
    }
  }, [productId, user?.id, orderId]);

  async function checkIfReviewed() {
    if (!user || !orderId || user.user_metadata?.user_type !== "comprador") return;
    try {
      const response = await fetch(`/api/reviews?product_id=${productId}&buyer_id=${user.id}&order_id=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        // Filtrar por order_id específico
        const reviewForThisOrder = data?.find((r: any) => r.order_id === orderId);
        setHasReviewedThisOrder(!!reviewForThisOrder);
      }
    } catch (error) {
      console.error("Error al verificar si ya reseñó:", error);
    }
  }

  async function loadReviews() {
    try {
      setLoading(true);
      // Cargar TODAS las reseñas del producto - sin filtrar por buyer_id
      // Todos los usuarios (compradores, vendedores, y no autenticados) deben poder ver todas las reseñas
      const params = new URLSearchParams({ product_id: productId });
      if (artisanId) params.append("artisan_id", artisanId);

      const response = await fetch(`/api/reviews?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data || []);

        // Calcular promedio
        if (data && data.length > 0) {
          const sum = data.reduce((acc: number, r: Review) => acc + r.rating, 0);
          setAvgRating(sum / data.length);
          setTotalReviews(data.length);
        } else {
          // Resetear valores si no hay reseñas
          setAvgRating(0);
          setTotalReviews(0);
        }

        // Verificar si el usuario actual ya reseñó este producto (sin considerar order_id)
        // Esto se usa para mostrar si el usuario ya reseñó el producto en general
        if (user?.id) {
          const userReview = data?.find((r: Review) => r.buyer_id === user.id);
          setHasReviewedThisProduct(!!userReview);
        } else {
          setHasReviewedThisProduct(false);
        }
      }
    } catch (error) {
      console.error("Error al cargar reseñas:", error);
    } finally {
      setLoading(false);
    }
  }

  async function submitReview() {
    if (!user || !artisanId || !orderId || rating === 0) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          product_id: productId,
          artisan_id: artisanId,
          buyer_id: user.id,
          rating,
          comment: comment || null,
        }),
      });

      if (response.ok) {
        setRating(0);
        setComment("");
        setShowReviewForm(false);
        setHasReviewedThisProduct(true);
        setHasReviewedThisOrder(true);
        await loadReviews();
        if (onReviewSubmitted) onReviewSubmitted();
        alert("¡Reseña publicada exitosamente!");
      } else {
        const error = await response.json();
        alert(error.error || "Error al publicar reseña");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al publicar reseña");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>Reseñas</h3>
          {totalReviews > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-lg ${
                      star <= Math.round(avgRating)
                        ? "text-amber-400"
                        : darkMode ? "text-slate-500" : "text-slate-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className={`text-sm font-semibold ${darkMode ? "text-emerald-200" : "text-slate-700"}`}>
                {avgRating.toFixed(1)}
              </span>
              <span className={`text-sm ${darkMode ? "text-emerald-300" : "text-slate-500"}`}>
                ({totalReviews} {totalReviews === 1 ? "reseña" : "reseñas"})
              </span>
            </div>
          )}
        </div>
        {user && user.user_metadata?.user_type === "comprador" && !showReviewForm && (
          <>
            {orderId && hasReviewedThisOrder ? (
              <button
                disabled
                className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                  darkMode
                    ? "border-slate-600 bg-slate-700/50 text-slate-400 cursor-not-allowed"
                    : "border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed"
                }`}
              >
                Ya reseñaste este producto
              </button>
            ) : orderId ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                  darkMode
                    ? "border-emerald-400 bg-emerald-900/30 text-emerald-200 hover:bg-emerald-900/50"
                    : "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                Dejar reseña
              </button>
            ) : null}
          </>
        )}
      </div>

      {/* Formulario de reseña */}
      {showReviewForm && user && user.user_metadata?.user_type === "comprador" && orderId && !hasReviewedThisOrder && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h4 className="mb-4 text-lg font-semibold text-slate-900">
            Escribe tu reseña
          </h4>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Valoración *
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl transition ${
                      star <= rating
                        ? "text-amber-400"
                        : "text-slate-300 hover:text-amber-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-1 text-xs text-slate-600">
                  {rating === 1 && "Muy malo"}
                  {rating === 2 && "Malo"}
                  {rating === 3 && "Regular"}
                  {rating === 4 && "Bueno"}
                  {rating === 5 && "Excelente"}
                </p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Comentario (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Comparte tu experiencia con este producto..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={submitReview}
                disabled={submitting || rating === 0}
                className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? "Publicando..." : "Publicar reseña"}
              </button>
              <button
                onClick={() => {
                  setShowReviewForm(false);
                  setRating(0);
                  setComment("");
                }}
                className="rounded-lg border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de reseñas */}
      {loading ? (
        <p className={`text-sm ${darkMode ? "text-emerald-200" : "text-slate-600"}`}>Cargando reseñas...</p>
      ) : reviews.length === 0 ? (
        <div className={`rounded-xl border p-8 text-center ${darkMode ? "border-white/10 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
          <p className={`text-sm ${darkMode ? "text-emerald-200" : "text-slate-600"}`}>
            Aún no hay reseñas para este producto.
          </p>
          {user && user.user_metadata?.user_type === "comprador" && !showReviewForm && (
            <>
              {orderId && hasReviewedThisOrder ? (
                <button
                  disabled
                  className={`mt-4 rounded-lg border px-4 py-2 text-sm font-semibold ${
                    darkMode
                      ? "border-slate-600 bg-slate-700/50 text-slate-400 cursor-not-allowed"
                      : "border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  Ya reseñaste este producto
                </button>
              ) : orderId ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className={`mt-4 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    darkMode
                      ? "border-emerald-400 bg-emerald-900/30 text-emerald-200 hover:bg-emerald-900/50"
                      : "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  Sé el primero en reseñar
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`rounded-xl border p-6 ${darkMode ? "border-white/10 bg-slate-800/50" : "border-slate-200 bg-white"}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${
                            star <= review.rating
                              ? "text-amber-400"
                              : darkMode ? "text-slate-500" : "text-slate-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className={`text-xs ${darkMode ? "text-emerald-300" : "text-slate-500"}`}>
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className={`text-sm ${darkMode ? "text-emerald-100" : "text-slate-700"}`}>{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

