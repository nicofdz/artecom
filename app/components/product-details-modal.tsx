"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  is_active?: boolean;
  created_at?: string;
};

type ProductDetailsModalProps = {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
};

export function ProductDetailsModal({
  product,
  isOpen,
  onClose,
}: ProductDetailsModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setCurrentImageIndex(0);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const images = product.images && product.images.length > 0 
    ? product.images.filter(img => img && img.trim() !== '')
    : ["/next.svg"];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-slate-200 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-slate-100 p-2 text-slate-600 shadow-lg transition hover:bg-slate-200 hover:text-slate-900"
            aria-label="Cerrar"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="grid gap-0 lg:grid-cols-2">
            {/* Imágenes a la izquierda */}
            <div className="relative w-full bg-slate-50">
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
              {images.length > 1 && (
                <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        currentImageIndex === idx
                          ? "border-emerald-500"
                          : "border-white/80 bg-white"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Información del producto a la derecha */}
            <div className="flex flex-col gap-6 p-8">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase text-emerald-600">
                    {product.category}
                  </p>
                  {product.is_active === false && (
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-600">
                      Desactivado
                    </span>
                  )}
                </div>
                <h2 className="text-3xl font-semibold text-slate-900">
                  {product.name}
                </h2>
                {product.description && (
                  <p className="text-base text-slate-600">{product.description}</p>
                )}
                {product.avg_rating && product.avg_rating > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-lg">★</span>
                    <span className="text-lg font-semibold text-slate-900">
                      {product.avg_rating.toFixed(1)}
                    </span>
                    {product.reviews_count && (
                      <span className="text-sm text-slate-500">
                        ({product.reviews_count} {product.reviews_count === 1 ? "reseña" : "reseñas"})
                      </span>
                    )}
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
              </div>

              <div className="grid gap-4 border-t border-slate-200 pt-6 text-sm text-slate-700">
                <div>
                  <span className="text-slate-500">Precio:</span>{" "}
                  <span className="text-xl font-semibold text-emerald-600">
                    ${product.price.toLocaleString('es-CL')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Stock disponible:</span>{" "}
                  <span className={`font-semibold ${
                    product.stock > 0 ? "text-emerald-600" : "text-red-600"
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
                {product.artisan_name && (
                  <div>
                    <span className="text-slate-500">Artesano:</span>{" "}
                    <span className="font-semibold text-slate-900">
                      {product.artisan_name}
                    </span>
                  </div>
                )}
                {product.artisan_profiles && (
                  <div>
                    <span className="text-slate-500">Región:</span>{" "}
                    <span className="font-semibold text-slate-900">
                      {product.artisan_profiles.region}
                      {product.artisan_profiles.ciudad && `, ${product.artisan_profiles.ciudad}`}
                    </span>
                  </div>
                )}
                {product.created_at && (
                  <div>
                    <span className="text-slate-500">Fecha de creación:</span>{" "}
                    <span className="font-semibold text-slate-900">
                      {new Date(product.created_at).toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>

              {product.materials && product.materials.length > 0 && (
                <div className="border-t border-slate-200 pt-6">
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
                  href={`/catalogo/${product.id}`}
                  onClick={onClose}
                  className="flex w-full items-center justify-center rounded-2xl border border-emerald-500 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Ver en el catálogo público
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


