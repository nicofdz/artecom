"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, use, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "../../components/top-nav";
import { useAuth } from "../../components/auth-provider";
import Footer from "../../components/footer";
import { ReviewsSection } from "../../components/reviews-section";
import Recommendations from "../../components/recommendations";

function getProductImage(product: any): string {
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  return "/next.svg";
}

type ProductPageProps = {
  params: Promise<{ productId: string }>;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  images: string[];
  materials: string[];
  dimensions: string | null;
  weight: number | null;
  artisan_name?: string;
  artisan_id?: string;
  artisan_profiles?: {
    region: string;
    ciudad: string | null;
  };
  avg_rating?: number;
  reviews_count?: number;
};

function ProductDetailContent({ params }: ProductPageProps) {
  // TODOS los hooks deben estar al principio, en el mismo orden siempre
  // use() debe ir primero para evitar problemas de orden
  const resolvedParams = use(params);
  const productId = resolvedParams.productId;

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const searchParams = useSearchParams();

  // Obtener parámetros de búsqueda de forma segura
  useEffect(() => {
    const orderIdParam = searchParams.get("order_id");
    const reviewParam = searchParams.get("review") === "true";
    setOrderId(orderIdParam);
    setShowReviewForm(reviewParam);
  }, [searchParams]);

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products?id=${productId}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setProduct(data[0]);
        }
      }
    } catch (error) {
      console.error("Error al cargar producto:", error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!authLoading) {
      loadProduct();
    }
  }, [authLoading, loadProduct]);


  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <TopNav />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <TopNav />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">Producto no encontrado</p>
            <Link
              href="/catalogo"
              className="mt-4 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Asegurar que images sea un array válido
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images.filter(img => img && img.trim() !== '')
    : ["/next.svg"];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12">
        <Link
          href="/catalogo"
          className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          ← Volver al catálogo
        </Link>

        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase text-emerald-600">
            {product.category}
          </p>
          <h1 className="text-4xl font-semibold text-slate-900">
            {product.name}
          </h1>
          <div className="text-base text-slate-600">
            {product.description ? (
              <p>{product.description}</p>
            ) : (
              <p className="italic text-slate-400">Este producto no tiene descripción disponible.</p>
            )}
          </div>
          {product.avg_rating && product.avg_rating > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-lg">★</span>
              <span className="text-lg font-semibold text-slate-900">
                {product.avg_rating.toFixed(1)}
              </span>
              <span className="text-sm text-slate-500">
                ({product.reviews_count || 0} {product.reviews_count === 1 ? "reseña" : "reseñas"})
              </span>
            </div>
          )}
          {product.materials && product.materials.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.materials.map((material, idx) => (
                <span
                  key={idx}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                >
                  {material}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Imágenes */}
          <div className="space-y-4">
            <div className="relative w-full overflow-hidden rounded-3xl bg-slate-100">
              <div className="relative aspect-square w-full">
                {images[currentImageIndex] && images[currentImageIndex] !== "/next.svg" ? (
                  <Image
                    src={images[currentImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-400">
                    <span className="text-sm">Sin imagen disponible</span>
                  </div>
                )}
              </div>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${currentImageIndex === idx
                      ? "border-emerald-500"
                      : "border-slate-200"
                      }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8">
            <div className="grid gap-4 text-sm text-slate-700">
              <div>
                <span className="text-slate-500">Precio:</span>{" "}
                <span className="text-2xl font-bold text-emerald-600">
                  ${product.price.toLocaleString("es-CL")}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Stock disponible:</span>{" "}
                <span className={`font-semibold ${product.stock > 0 ? "text-emerald-600" : "text-red-600"
                  }`}>
                  {product.stock} unidades
                </span>
              </div>
              {product.dimensions && (
                <div>
                  <span className="text-slate-500">Dimensiones:</span>{" "}
                  <span className="font-semibold text-slate-900">
                    {product.dimensions}
                  </span>
                </div>
              )}
              {product.weight && (
                <div>
                  <span className="text-slate-500">Peso:</span>{" "}
                  <span className="font-semibold text-slate-900">
                    {product.weight}g
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-500">Artesano:</span>{" "}
                <span className="font-semibold text-slate-900">
                  {product.artisan_name || "No especificado"}
                </span>
              </div>
              {product.artisan_profiles && (
                <div>
                  <span className="text-slate-500">Región:</span>{" "}
                  <span className="font-semibold text-slate-900">
                    {product.artisan_profiles.region}
                    {product.artisan_profiles.ciudad && `, ${product.artisan_profiles.ciudad}`}
                  </span>
                </div>
              )}
            </div>

            {product.materials && product.materials.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">
                  Materiales utilizados:
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.materials.map((material, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                    >
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto space-y-3 border-t border-slate-200 pt-6">
              <Link
                href="/catalogo"
                className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Volver al catálogo
              </Link>
            </div>
          </div>
        </div>

        {/* Sección de reseñas */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8">
          <ReviewsSection
            productId={product.id}
            artisanId={product.artisan_id}
            showForm={showReviewForm}
            orderId={orderId || undefined}
            onReviewSubmitted={() => {
              // Recargar producto para actualizar rating
              loadProduct();
            }}
          />
        </div>

        {/* Sección de recomendaciones */}
        <Recommendations productId={product.id} />
      </div>
      <Footer />
    </div>
  );
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <TopNav />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    }>
      <ProductDetailContent params={params} />
    </Suspense>
  );
}
