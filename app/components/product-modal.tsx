"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ReviewsSection } from "./reviews-section";

type CatalogItem = {
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
    specialties: string[];
  };
  avg_rating?: number;
  reviews_count?: number;
};

function getProductImage(product: CatalogItem): string {
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  return "/next.svg";
}

type ProductModalProps = {
  product: CatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
  cart: Record<string, number>;
  onAddToCart: (id: string, quantity?: number) => void;
  onSetQuantity: (id: string, quantity: number) => void;
  onDecrement: (id: string) => void;
};

export function ProductModal({
  product,
  isOpen,
  onClose,
  cart,
  onAddToCart,
  onSetQuantity,
  onDecrement,
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [showQuantityInput, setShowQuantityInput] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setQuantity(1);
      setShowQuantityInput(false); // No mostrar input inmediatamente
      setCurrentImageIndex(0);
    } else {
      document.body.style.overflow = "unset";
      setShowQuantityInput(false); // Resetear cuando se cierra
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const cartQuantity = cart[product.id] || 0;
  const images = product.images && product.images.length > 0 ? product.images : ["/next.svg"];

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
          className="relative w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-3xl bg-slate-900 border border-white/10 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-slate-800/90 p-2 text-emerald-100 shadow-lg transition hover:bg-slate-800 hover:text-emerald-300"
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

          <div className="flex flex-col">
            {/* Sección superior: Imagen e información */}
            <div className="grid gap-0 lg:grid-cols-2">
              {/* Imágenes a la izquierda */}
              <div className="relative w-full bg-slate-950">
                <div className="relative aspect-square w-full lg:aspect-[4/5]">
                  <Image
                    src={images[currentImageIndex]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
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
                            : "border-white/20"
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
                <p className="text-xs font-semibold uppercase text-emerald-400">
                  {product.category}
                </p>
                <h2 className="text-3xl font-semibold text-white">
                  {product.name}
                </h2>
                {product.description && (
                  <p className="text-base text-emerald-100">{product.description}</p>
                )}
                {product.avg_rating && product.avg_rating > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-lg">★</span>
                    <span className="text-lg font-semibold text-white">
                      {product.avg_rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-emerald-200">
                      ({product.reviews_count || 0} {product.reviews_count === 1 ? "reseña" : "reseñas"})
                    </span>
                  </div>
                )}
                {product.materials && product.materials.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.materials.map((material, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border border-emerald-500/50 bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-300"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-4 border-t border-white/10 pt-6 text-sm text-emerald-100">
                <div>
                  <span className="text-emerald-300">Precio:</span>{" "}
                  <span className="text-xl font-semibold text-white">
                    ${product.price.toLocaleString('es-CL')}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-300">Stock disponible:</span>{" "}
                  <span className={`font-semibold ${
                    product.stock > 0 ? "text-white" : "text-red-400"
                  }`}>
                    {product.stock} unidades
                  </span>
                </div>
                {product.dimensions && (
                  <div>
                    <span className="text-emerald-300">Dimensiones:</span>{" "}
                    <span className="font-semibold text-white">
                      {product.dimensions}
                    </span>
                  </div>
                )}
                {product.weight && (
                  <div>
                    <span className="text-emerald-300">Peso:</span>{" "}
                    <span className="font-semibold text-white">
                      {product.weight}g
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-emerald-300">Artesano:</span>{" "}
                  <span className="font-semibold text-white">
                    {product.artisan_name || "No especificado"}
                  </span>
                </div>
                {product.artisan_profiles && (
                  <div>
                    <span className="text-emerald-300">Región:</span>{" "}
                    <span className="font-semibold text-white">
                      {product.artisan_profiles.region}
                      {product.artisan_profiles.ciudad && `, ${product.artisan_profiles.ciudad}`}
                    </span>
                  </div>
                )}
              </div>

              {product.materials && product.materials.length > 0 && (
                <div className="border-t border-white/10 pt-6">
                  <p className="mb-3 text-sm font-semibold text-emerald-100">
                    Materiales utilizados:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.materials.map((material, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg border border-emerald-500/30 bg-emerald-900/20 px-3 py-1 text-sm text-emerald-200"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto space-y-3 border-t border-white/10 pt-6">
                
                {showQuantityInput ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-semibold text-emerald-100">
                        Cantidad:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          const availableStock = product.stock;
                          const currentCartQuantity = cart[product.id] || 0;
                          const maxAllowed = availableStock - currentCartQuantity;
                          
                          if (!isNaN(val) && val > 0) {
                            const limitedVal = Math.min(val, maxAllowed);
                            setQuantity(limitedVal);
                            if (val > maxAllowed) {
                              alert(`No puedes agregar más de ${maxAllowed} unidades. Stock disponible: ${availableStock} unidades. Ya tienes ${currentCartQuantity} en el carrito.`);
                            }
                          }
                        }}
                        className="flex-1 rounded-xl border border-white/10 bg-slate-800/50 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const availableStock = product.stock;
                          const currentCartQuantity = cart[product.id] || 0;
                          const maxAllowed = availableStock - currentCartQuantity;
                          
                          if (quantity > 0 && quantity <= maxAllowed) {
                            onAddToCart(product.id, quantity);
                            setShowQuantityInput(false);
                            setQuantity(1);
                          } else if (quantity > maxAllowed) {
                            alert(`No puedes agregar más de ${maxAllowed} unidades. Stock disponible: ${availableStock} unidades. Ya tienes ${currentCartQuantity} en el carrito.`);
                          }
                        }}
                        disabled={quantity <= 0 || product.stock <= 0}
                        className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:opacity-50"
                      >
                        Agregar {quantity} al carrito
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuantityInput(false);
                          setQuantity(1);
                        }}
                        className="rounded-2xl border border-white/10 bg-slate-800/50 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : cartQuantity > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onDecrement(product.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400 bg-slate-800/50 text-emerald-300 transition hover:bg-emerald-900/30"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center text-sm font-semibold text-emerald-100">
                        {cartQuantity} en carrito
                      </span>
                      <button
                        type="button"
                        onClick={() => onAddToCart(product.id)}
                        disabled={cartQuantity >= product.stock}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400 bg-slate-800/50 text-emerald-300 transition hover:bg-emerald-900/30 disabled:cursor-not-allowed disabled:opacity-50"
                        title={cartQuantity >= product.stock ? "Stock máximo alcanzado" : "Agregar más"}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowQuantityInput(true)}
                      className="w-full rounded-2xl border border-emerald-400 bg-slate-800/50 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:border-emerald-500 hover:bg-emerald-900/30"
                    >
                      Agregar más cantidad
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (product.stock > 0) {
                        setShowQuantityInput(true);
                      } else {
                        alert("Este producto no tiene stock disponible.");
                      }
                    }}
                    disabled={product.stock <= 0}
                    className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:opacity-50"
                  >
                    {product.stock > 0 ? "Añadir al carrito" : "Sin stock disponible"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sección de reseñas - Ancho completo */}
          <div className="border-t border-white/10 bg-slate-800/30 p-8">
            <div className="max-w-4xl mx-auto">
              <ReviewsSection
                productId={product.id}
                artisanId={product.artisan_id}
                showForm={false}
                orderId={undefined}
                darkMode={true}
              />
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}

