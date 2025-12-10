"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { TopNav } from "../components/top-nav";
import { useAuth } from "../components/auth-provider";
import Footer from "../components/footer";

type OrderItem = {
  id: string;
  quantity: number;
  price_at_purchase: number;
  subtotal: number;
  products: {
    id: string;
    name: string;
    category: string;
    price: number;
    images: string[];
  };
};

type Order = {
  id: string;
  buyer_id: string;
  total_amount: number;
  shipping_address: string;
  shipping_city: string;
  shipping_region: string;
  shipping_phone: string;
  payment_status: string;
  order_status: string;
  tracking_number: string | null;
  cancellation_reason?: string | null;
  notes?: string | null;
  created_at: string;
  order_items: OrderItem[];
};

const orderStatusColors: Record<string, string> = {
  procesando: "bg-yellow-100 text-yellow-800 border-yellow-200",
  enviado: "bg-blue-100 text-blue-800 border-blue-200",
  entregado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelado: "bg-red-100 text-red-800 border-red-200",
};

const orderStatusLabels: Record<string, string> = {
  procesando: "Procesando",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const paymentStatusColors: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800 border-amber-200",
  pagado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  reembolsado: "bg-red-100 text-red-800 border-red-200",
};

const paymentStatusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  reembolsado: "Reembolsado",
};

export default function MisPedidosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [reviewedProducts, setReviewedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/pedidos");
    }
  }, [user, authLoading, router]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error("No hay usuario autenticado");
      }

      const response = await fetch(`/api/orders?buyer_id=${user.id}`);

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        setError(null);

        // Cargar reseñas del usuario para verificar qué productos ya fueron reseñados
        const reviewsResponse = await fetch(`/api/reviews?buyer_id=${user.id}`);
        if (reviewsResponse.ok) {
          const reviews = await reviewsResponse.json();
          // Crear un Set con la combinación product_id-order_id para permitir múltiples reseñas del mismo producto en diferentes pedidos
          const reviewedSet = new Set<string>(
            reviews.map((r: any) => `${r.product_id}-${r.order_id}`)
          );
          setReviewedProducts(reviewedSet);
        }

        // Los pedidos cancelados se manejan directamente en la UI
      } else {
        // Intentar obtener el mensaje de error de la respuesta
        let errorMessage = "Error al cargar pedidos";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        setError(errorMessage);
        console.error("Error al cargar pedidos:", errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || "Error al cargar pedidos";
      setError(errorMessage);
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, loadOrders]);

  // Refrescar pedidos cada 30 segundos para actualizar el badge
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        loadOrders();
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [user, loadOrders]);

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((order) => order.order_status === filterStatus);

  if (authLoading) {
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
    return null; // El useEffect redirigirá
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatShortDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function toggleOrder(orderId: string) {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  }

  function getProductNames(order: Order): string {
    if (!order.order_items || order.order_items.length === 0) {
      return "Sin productos";
    }
    const names = order.order_items.map((item) => item.products.name);
    if (names.length === 1) {
      return names[0];
    }
    if (names.length === 2) {
      return `${names[0]} y ${names[1]}`;
    }
    return `${names[0]}, ${names[1]} y ${names.length - 2} más`;
  }

  async function handleDeleteOrder(orderId: string) {
    if (!user?.id) return;

    if (!confirm("¿Estás seguro de que deseas eliminar este pedido cancelado?")) {
      return;
    }

    try {
      const response = await fetch(`/api/orders?id=${orderId}&buyer_id=${user.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Recargar pedidos
        await loadOrders();
        // Actualizar el badge en el navbar (forzar actualización)
        window.dispatchEvent(new CustomEvent("orders-updated"));
      } else {
        const error = await response.json();
        alert(error.error || "Error al eliminar el pedido");
      }
    } catch (error) {
      console.error("Error al eliminar pedido:", error);
      alert("Error al eliminar el pedido");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      {/* Expanded full-width layout container matching homepage/catalog style */}
      <div className="mx-auto w-full max-w-[1920px] px-4 py-8 sm:px-6 lg:px-8">

        <header className="mb-8 pl-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-600 mb-1">
                Mis pedidos
              </p>
              <h1 className="text-3xl font-semibold text-slate-900">
                Historial de pedidos
              </h1>
              <p className="max-w-2xl text-base text-slate-600 mt-2">
                Revisa el estado y detalles de todos tus pedidos realizados.
              </p>
            </div>
            <Link
              href="/catalogo"
              className="inline-flex items-center justify-center rounded-xl border border-emerald-500 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Seguir comprando
            </Link>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 relative">
          {/* Sidebar de Filtros */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Estado del Pedido</h3>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterStatus("all")}
                    className={`w-full text-left rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${filterStatus === "all"
                      ? "bg-emerald-50 text-emerald-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    Todos ({orders.length})
                  </button>
                  {Object.entries(orderStatusLabels).map(([status, label]) => {
                    const count = orders.filter((o) => o.order_status === status).length;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFilterStatus(status)}
                        className={`w-full text-left rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${filterStatus === status
                          ? "bg-emerald-50 text-emerald-700 font-bold"
                          : "text-slate-600 hover:bg-slate-50"
                          }`}
                      >
                        <span className="flex items-center justify-between">
                          <span>{label}</span>
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">{count}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Contenido Principal - Lista de Pedidos */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <p className="text-slate-600">Cargando pedidos...</p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                <p className="font-semibold text-red-800 mb-2">Error al cargar pedidos</p>
                <p className="text-sm text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => loadOrders()}
                  className="rounded-xl border border-red-500 bg-red-100 px-6 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-200"
                >
                  Reintentar
                </button>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <div className="mb-4 rounded-full bg-slate-50 p-6">
                  <span className="text-4xl">🛍️</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {filterStatus === "all" ? "Aún no tienes pedidos" : "No se encontraron pedidos"}
                </h3>
                <p className="text-slate-500 max-w-sm mb-6">
                  {filterStatus === "all"
                    ? "Explora nuestro catálogo y encuentra productos únicos de artesanos locales."
                    : `No tienes pedidos con el estado "${orderStatusLabels[filterStatus]}".`}
                </p>
                {filterStatus === "all" && (
                  <Link
                    href="/catalogo"
                    className="inline-flex rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-md hover:shadow-lg"
                  >
                    Explorar Catálogo
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  return (
                    <div
                      key={order.id}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg hover:border-emerald-500/30"
                    >
                      {/* Vista compacta - header del pedido */}
                      <div
                        className="flex flex-wrap items-center gap-4 bg-slate-50/50 p-4 sm:flex-nowrap sm:justify-between cursor-pointer"
                        onClick={() => toggleOrder(order.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-emerald-100/50 p-3 text-emerald-600">
                            📦
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              Pedido #{order.id.slice(0, 8)}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 ml-auto sm:ml-0">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${orderStatusColors[order.order_status] || orderStatusColors.procesando
                              }`}
                          >
                            {orderStatusLabels[order.order_status] || order.order_status}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${paymentStatusColors[order.payment_status] || paymentStatusColors.pendiente
                              }`}
                          >
                            {paymentStatusLabels[order.payment_status] || order.payment_status}
                          </span>
                          <div className="ml-2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200">
                            <svg
                              className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                                }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Info del producto (Preview) - Visible siempre, debajo del header */}
                      <div
                        className="border-t border-slate-100 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                        onClick={() => toggleOrder(order.id)}
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-slate-700 truncate max-w-md">
                            {getProductNames(order)}
                          </p>
                          <p className="text-sm font-bold text-slate-900">
                            ${order.total_amount.toLocaleString('es-CL')}
                          </p>
                        </div>
                      </div>

                      {/* Detalle expandido */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 bg-slate-50/30 p-6 animate-in slide-in-from-top-2 fade-in duration-200">
                          <div className="grid gap-8 lg:grid-cols-3">
                            {/* Columna Izquierda: Productos */}
                            <div className="lg:col-span-2 space-y-6">
                              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                                🛒 Productos ({order.order_items.length})
                              </h4>
                              <div className="space-y-4">
                                {order.order_items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                                  >
                                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                                      {item.products.images && item.products.images.length > 0 ? (
                                        <Image
                                          src={item.products.images[0]}
                                          alt={item.products.name}
                                          fill
                                          className="object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                          <span className="text-2xl">📷</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-start gap-2">
                                        <div>
                                          <p className="font-semibold text-slate-900 truncate">
                                            {item.products.name}
                                          </p>
                                          <p className="text-sm text-slate-500">
                                            {item.products.category}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-medium text-slate-900">
                                            ${item.price_at_purchase.toLocaleString('es-CL')}
                                          </p>
                                          <p className="text-xs text-slate-500">x{item.quantity}</p>
                                        </div>
                                      </div>

                                      {/* Acciones por producto */}
                                      {order.order_status === "entregado" && (
                                        <div className="mt-3 pt-3 border-t border-slate-100">
                                          {(() => {
                                            const productId = item.products?.id;
                                            const reviewKey = productId ? `${productId}-${order.id}` : null;
                                            const isReviewed = reviewKey && reviewedProducts.has(reviewKey);

                                            if (isReviewed) {
                                              return (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                                                  ✓ Opinión enviada
                                                </span>
                                              );
                                            }
                                            return (
                                              <Link
                                                href={`/catalogo/${productId || ''}?order_id=${order.id}&review=true`}
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                                              >
                                                ★ Dejar opinión
                                              </Link>
                                            );
                                          })()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Columna Derecha: Resumen y Datos */}
                            <div className="space-y-6">
                              <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-sm">
                                <h4 className="font-semibold text-slate-900 mb-4">Resumen de Pago</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between text-slate-600">
                                    <span>Subtotal (neto)</span>
                                    <span>${Math.round(order.total_amount / 1.19).toLocaleString('es-CL')}</span>
                                  </div>
                                  <div className="flex justify-between text-slate-600">
                                    <span>IVA (19%)</span>
                                    <span>${Math.round(order.total_amount - order.total_amount / 1.19).toLocaleString('es-CL')}</span>
                                  </div>
                                  <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
                                    <span>Total pagado</span>
                                    <span>${order.total_amount.toLocaleString('es-CL')}</span>
                                  </div>
                                </div>
                                {order.payment_status === "pagado" && (
                                  <Link
                                    href={`/comprobante/${order.id}`}
                                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                                  >
                                    📄 Ver Comprobante
                                  </Link>
                                )}
                              </div>

                              <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-sm">
                                <h4 className="font-semibold text-slate-900 mb-4">Datos de Envío</h4>
                                <div className="space-y-3 text-sm">
                                  <div className="flex items-start gap-3">
                                    <span className="text-slate-400 mt-0.5">📍</span>
                                    <div>
                                      <p className="font-medium text-slate-900">Dirección</p>
                                      <p className="text-slate-600">{order.shipping_address}</p>
                                      <p className="text-slate-600">{order.shipping_city}, {order.shipping_region}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <span className="text-slate-400 mt-0.5">📞</span>
                                    <div>
                                      <p className="font-medium text-slate-900">Contacto</p>
                                      <p className="text-slate-600">{order.shipping_phone}</p>
                                    </div>
                                  </div>
                                  {order.tracking_number && (
                                    <div className="flex items-start gap-3 border-t border-slate-100 pt-3 mt-3">
                                      <span className="text-slate-400 mt-0.5">🚚</span>
                                      <div>
                                        <p className="font-medium text-slate-900">Seguimiento</p>
                                        <p className="text-emerald-600 font-mono tracking-wider">{order.tracking_number}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {order.notes && (
                                <div className="rounded-xl bg-amber-50 p-4 border border-amber-100">
                                  <h4 className="text-xs font-bold uppercase text-amber-700 mb-1">Notas del pedido</h4>
                                  <p className="text-sm text-amber-900 mb-0">{order.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Acciones peligrosas (Eliminar) */}
                          {order.order_status === "cancelado" && (
                            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteOrder(order.id);
                                }}
                                className="text-sm text-red-600 hover:text-red-800 hover:underline px-4 py-2"
                              >
                                Eliminar este pedido permanentemente
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

