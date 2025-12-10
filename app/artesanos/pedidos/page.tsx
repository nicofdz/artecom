"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "../../components/top-nav";
import { useAuth } from "../../components/auth-provider";
import Footer from "../../components/footer";
import Link from "next/link";
import Image from "next/image";

type OrderItem = {
  id: string;
  quantity: number;
  price_at_purchase: number;
  subtotal: number;
  products: {
    id: string;
    name: string;
    category: string;
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
  created_at: string;
  order_items: OrderItem[];
  notes?: string;
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

export default function PedidosArtesanoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // States for actions
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState<string>("");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login?redirect=/artesanos/pedidos");
      } else if (user.user_metadata?.user_type !== "artesano") {
        alert("Esta sección es solo para artesanos.");
        router.push("/catalogo");
      } else {
        loadOrders();
      }
    }
  }, [user, authLoading, router]);

  async function loadOrders() {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/orders?artisan_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        // Filtrar solo los pedidos que tienen productos de este artesano
        const artisanOrders = data.filter((order: Order) => {
          return order.order_items?.some((item: OrderItem) => {
            return true; // La API ya filtra por artisan_id en order_items
          });
        });
        setOrders(artisanOrders || []);
      }
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    } finally {
      setLoading(false);
    }
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

  async function updateOrderStatus(orderId: string, newStatus: string, cancellationReason?: string, tracking?: string) {
    if (!user?.id) return;

    try {
      const response = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          buyer_id: null,
          order_status: newStatus,
          cancellation_reason: cancellationReason || null,
          tracking_number: tracking || null,
        }),
      });

      if (response.ok) {
        await loadOrders();
        if (newStatus === "cancelado") {
          handleCancelClose();
        }
        if (tracking) {
          setTrackingNumber("");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar estado");
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al actualizar el estado del pedido");
    }
  }

  function handleCancelClick(orderId: string) {
    setCancelOrderId(orderId);
    setShowCancelModal(true);
  }

  function handleCancelConfirm() {
    if (!cancelOrderId || !cancelReason.trim()) {
      alert("Por favor, ingresa el motivo de cancelación");
      return;
    }
    updateOrderStatus(cancelOrderId, "cancelado", cancelReason.trim());
  }

  function handleCancelClose() {
    setShowCancelModal(false);
    setCancelReason("");
    setCancelOrderId(null);
  }

  function handleTrackingSubmit(orderId: string) {
    if (!trackingNumber.trim()) {
      alert("Por favor, ingresa el número de seguimiento");
      return;
    }
    updateOrderStatus(orderId, "enviado", undefined, trackingNumber.trim());
  }

  function getArtisanTotal(order: Order): number {
    return order.order_items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter((order) => order.order_status === filterStatus);

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

  if (!user || user.user_metadata?.user_type !== "artesano") {
    return null;
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
                Panel de Artesanos
              </p>
              <h1 className="text-3xl font-semibold text-slate-900">
                Pedidos Recibidos
              </h1>
              <p className="max-w-2xl text-base text-slate-600 mt-2">
                Gestiona y procesa los pedidos de tus clientes de manera eficiente.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/artesanos/productos"
                className="inline-flex items-center justify-center rounded-xl border border-emerald-500 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Mis Productos
              </Link>
            </div>
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
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">
                            {count}
                          </span>
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
            {filteredOrders.length === 0 ? (
              <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <div className="mb-4 rounded-full bg-slate-50 p-6">
                  <span className="text-4xl">📦</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {filterStatus === "all" ? "Aún no has recibido pedidos" : "No hay pedidos con este estado"}
                </h3>
                <p className="text-slate-500 max-w-sm mb-6">
                  {filterStatus === "all"
                    ? "Tus productos aparecerán aquí cuando los clientes realicen compras."
                    : `No hay pedidos marcados como "${orderStatusLabels[filterStatus]}".`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  const artisanTotal = getArtisanTotal(order);

                  return (
                    <div
                      key={order.id}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg hover:border-emerald-500/30"
                    >
                      {/* Cabecera del pedido */}
                      <div
                        className="flex flex-wrap items-center gap-4 bg-slate-50/50 p-4 sm:flex-nowrap sm:justify-between cursor-pointer"
                        onClick={() => toggleOrder(order.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-emerald-100/50 p-3 text-emerald-600">
                            🛒
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
                            <svg className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Preview (siempre visible) */}
                      <div
                        className="border-t border-slate-100 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                        onClick={() => toggleOrder(order.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-slate-600">
                              Cliente: <span className="font-medium text-slate-900">{order.shipping_address} (Ver detalles)</span>
                            </p>
                          </div>
                          <p className="text-sm font-bold text-emerald-600">
                            Total a recibir: ${artisanTotal.toLocaleString('es-CL')}
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
                                📦 Productos solicitados ({order.order_items.length})
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
                                      <p className="mt-2 text-right text-sm font-semibold text-emerald-600">
                                        Subtotal: ${item.subtotal.toLocaleString('es-CL')}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Sección de Gestión de Pedido para Artesanos */}
                              <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-sm mt-6">
                                <h4 className="font-semibold text-slate-900 mb-4">Gestionar Estado del Pedido</h4>
                                <div className="flex flex-wrap gap-3">
                                  {order.order_status === "procesando" && (
                                    <div className="w-full">
                                      <p className="text-sm text-slate-600 mb-2">Ingresa el número de seguimiento para enviar:</p>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={trackingNumber}
                                          onChange={(e) => setTrackingNumber(e.target.value)}
                                          placeholder="Número de seguimiento (ej: R123456789CL)"
                                          className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm"
                                        />
                                        <button
                                          onClick={() => handleTrackingSubmit(order.id)}
                                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                        >
                                          Marcar Enviado
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {order.order_status === "enviado" && (
                                    <button
                                      onClick={() => updateOrderStatus(order.id, "entregado")}
                                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                    >
                                      Marcar como Entregado
                                    </button>
                                  )}

                                  {order.order_status !== "cancelado" && order.order_status !== "entregado" && (
                                    <button
                                      onClick={() => handleCancelClick(order.id)}
                                      className="ml-auto rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                                    >
                                      Cancelar Pedido
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Columna Derecha: Datos de Envío y Cliente */}
                            <div className="space-y-6">
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
                                      <p className="font-medium text-slate-900">Teléfono</p>
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
                                  <h4 className="text-xs font-bold uppercase text-amber-700 mb-1">Notas del cliente</h4>
                                  <p className="text-sm text-amber-900 mb-0">{order.notes}</p>
                                </div>
                              )}

                              {order.cancellation_reason && (
                                <div className="rounded-xl bg-red-50 p-4 border border-red-100">
                                  <h4 className="text-xs font-bold uppercase text-red-700 mb-1">Motivo de cancelación</h4>
                                  <p className="text-sm text-red-900 mb-0">{order.cancellation_reason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* Modal de cancelación */}
        {showCancelModal && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={handleCancelClose}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="mb-4 text-lg font-semibold text-slate-900">
                  Cancelar pedido
                </h3>
                <p className="mb-4 text-sm text-slate-600">
                  Por favor, indica el motivo de la cancelación. Esta acción notificará al comprador.
                </p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Ej: Producto agotado, problema con el despacho..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelConfirm}
                    className="flex-1 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Confirmar cancelación
                  </button>
                  <button
                    onClick={handleCancelClose}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600"
                  >
                    Volver
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
