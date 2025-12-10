"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "../components/top-nav";
import { useAuth } from "../components/auth-provider";
import Footer from "../components/footer";
import { supabase } from "../lib/supabase";
import { getCart, saveCart, setCartItem, type Cart } from "../lib/cart";

type CartItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  images: string[];
  quantity: number;
};

const chileanRegions = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana",
  "O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén",
  "Magallanes",
];

function getProductImage(product: any): string {
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  return "/next.svg";
}

function CarritoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/carrito");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadCartItems();
    }
  }, [user, searchParams]);

  useEffect(() => {
    const cart = getCart();
    const itemsParam = searchParams.get("items");
    
    if (itemsParam) {
      const items = itemsParam.split(",").reduce((acc, item) => {
        const [id, qty] = item.split(":");
        acc[id] = parseInt(qty, 10);
        return acc;
      }, {} as Record<string, number>);
      saveCart(items);
    }
  }, [searchParams]);

  async function loadCartItems() {
    try {
      setLoading(true);
      
      const cart = getCart();
      const items = Object.entries(cart).map(([id, qty]) => ({
        id,
        quantity: qty,
      }));

      const itemsParam = searchParams.get("items");
      if (items.length === 0 && itemsParam) {
        const urlItems = itemsParam.split(",").map((item) => {
          const [id, qty] = item.split(":");
          return { id, quantity: parseInt(qty, 10) };
        });
        items.push(...urlItems);
      }

      if (items.length === 0) {
        setCartItems([]);
        return;
      }

      const response = await fetch("/api/products");
      if (response.ok) {
        const products = await response.json();
        const cartItemsData: CartItem[] = items
          .map((item) => {
            const product = products.find((p: any) => p.id === item.id);
            if (!product) return null;
            const cartItem: CartItem = {
              id: product.id,
              name: product.name,
              category: product.category,
              price: product.price,
              images: product.images || [],
              quantity: item.quantity,
            };
            return cartItem;
          })
          .filter((item): item is CartItem => item !== null);
        setCartItems(cartItemsData);
      }
    } catch (error) {
      console.error("Error al cargar productos del carrito:", error);
    } finally {
      setLoading(false);
    }
  }

  function updateQuantity(id: string, delta: number) {
    setCartItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      
      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        const updated = prev.filter((i) => i.id !== id);
        const cart = getCart();
        delete cart[id];
        saveCart(cart);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("cart-updated"));
        }, 0);
        return updated;
      }
      
      const updated = prev.map((i) =>
        i.id === id ? { ...i, quantity: newQuantity } : i
      );
      setCartItem(id, newQuantity);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("cart-updated"));
      }, 0);
      return updated;
    });
  }

  function removeItem(id: string) {
    setCartItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      const cart = getCart();
      delete cart[id];
      saveCart(cart);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("cart-updated"));
      }, 0);
      return updated;
    });
  }


  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const canContinue = cartItems.length > 0;

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

  if (!user) {
    return null;
  }

  if (cartItems.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <TopNav />
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-lg font-semibold text-slate-900 mb-4">
              Tu carrito está vacío
            </p>
            <Link
              href="/catalogo"
              className="inline-block rounded-xl border border-emerald-500 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Ir al catálogo
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-8 lg:px-12">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-emerald-600">
            Carrito de compras
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Completa tu pedido
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Revisa tus productos y completa la información para realizar el pedido.
          </p>
        </header>

        {/* Solo mostrar productos, sin pasos */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Productos en el carrito
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {totalItems} producto{totalItems !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-500/50 hover:shadow-md transition-all"
                >
                  <div className="flex gap-4">
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-200 ring-1 ring-slate-300">
                      <Image
                        src={getProductImage(item)}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-slate-600 mt-0.5">{item.category}</p>
                      <p className="text-sm text-emerald-600 mt-0.5 font-medium">
                        ${item.price.toLocaleString('es-CL')} c/u
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="h-9 w-9 rounded-full border border-slate-300 bg-white text-lg text-slate-700 hover:bg-slate-100 hover:border-emerald-500/50 transition-all"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-base font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="h-9 w-9 rounded-full border border-emerald-500 bg-emerald-50 text-lg text-emerald-600 hover:bg-emerald-100 transition-all"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-base font-semibold text-slate-900">
                        ${(item.price * item.quantity).toLocaleString('es-CL')}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 hover:border-red-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {canContinue ? (
                <Link
                  href="/checkout"
                  className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-md hover:shadow-lg text-center"
                >
                  Proceder al Checkout →
                </Link>
              ) : (
                <span
                  className="rounded-lg bg-slate-300 px-5 py-3 text-sm font-semibold text-slate-500 cursor-not-allowed shadow-none text-center"
                >
                  Proceder al Checkout →
                </span>
              )}
              <Link
                href="/catalogo"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center"
              >
                ← Seguir comprando
              </Link>
            </div>
          </section>
      </div>
      <Footer />
    </div>
  );
}

export default function CarritoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <TopNav />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    }>
      <CarritoContent />
    </Suspense>
  );
}
