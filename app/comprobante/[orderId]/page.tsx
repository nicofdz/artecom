"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopNav } from "../../components/top-nav";
import { useAuth } from "../../components/auth-provider";
import Footer from "../../components/footer";

type ReceiptProps = {
  params: Promise<{ orderId: string }>;
};

type Receipt = {
  order_id: string;
  transaction_id: string;
  buyer_name: string;
  buyer_email: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  date: string;
  items: Array<{
    id: string;
    quantity: number;
    price_at_purchase: number;
    subtotal: number;
    products: {
      id: string;
      name: string;
      category: string;
    };
  }>;
  shipping: {
    address: string;
    city: string;
    region: string;
  };
};

export default function ComprobantePage({ params }: ReceiptProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { orderId } = use(params);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/comprobante/${orderId}`);
    }
  }, [user, authLoading, router, orderId]);

  useEffect(() => {
    if (user) {
      loadReceipt();
    }
  }, [user, orderId]);

  async function loadReceipt() {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments/receipt?order_id=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setReceipt(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error al cargar comprobante:", errorData);
        alert(errorData.error || "Error al cargar comprobante");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar comprobante. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handlePrint() {
    window.print();
  }

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

  if (!receipt) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <TopNav />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">
              Comprobante no encontrado
            </p>
            <Link
              href="/pedidos"
              className="mt-4 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Volver a mis pedidos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-slate-900">
            Comprobante de Pago
          </h1>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              🖨️ Imprimir
            </button>
            <Link
              href="/pedidos"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver a pedidos
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg print:shadow-none">
          {/* Header */}
          <div className="mb-8 border-b border-slate-200 pb-6 text-center">
            <div className="mb-2 text-4xl">✅</div>
            <h2 className="text-2xl font-semibold text-emerald-600">
              Pago Confirmado
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Marketplace de Productos Artesanales Chilenos
            </p>
          </div>

          {/* Información del pedido */}
          <div className="mb-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Número de Pedido
                </p>
                <p className="mt-1 font-mono text-lg font-semibold text-slate-900">
                  {receipt.order_id.slice(0, 8)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Transacción
                </p>
                <p className="mt-1 font-mono text-sm text-slate-700">
                  {receipt.transaction_id}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Método de Pago
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {receipt.payment_method === "webpay" && "Webpay Plus"}
                  {receipt.payment_method === "transbank" && "Transbank"}
                  {receipt.payment_method === "mercadopago" && "Mercado Pago"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Fecha
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {formatDate(receipt.date)}
                </p>
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">Cliente</p>
            <p className="text-sm text-slate-900">{receipt.buyer_name}</p>
            <p className="text-sm text-slate-600">{receipt.buyer_email}</p>
          </div>

          {/* Productos */}
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Productos
            </h3>
            <div className="space-y-3">
              {receipt.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {item.products.name}
                    </p>
                    <p className="text-sm text-slate-600">
                      {item.products.category} · Cantidad: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      ${item.subtotal.toLocaleString("es-CL")} (IVA incluido)
                    </p>
                    <p className="text-xs text-slate-500">
                      ${item.price_at_purchase.toLocaleString("es-CL")} c/u (IVA incluido)
                    </p>
                    <p className="text-xs text-slate-400">
                      Neto: ${Math.round(item.price_at_purchase / 1.19).toLocaleString("es-CL")} + IVA: ${Math.round(item.price_at_purchase - item.price_at_purchase / 1.19).toLocaleString("es-CL")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dirección de envío */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">
              Dirección de Envío
            </p>
            <p className="text-sm text-slate-900">
              {receipt.shipping.address}, {receipt.shipping.city}, {receipt.shipping.region}
            </p>
          </div>

          {/* Total */}
          <div className="border-t border-slate-200 pt-6">
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Subtotal (neto):</span>
                <span>${Math.round(receipt.amount / 1.19).toLocaleString("es-CL")}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>IVA (19%):</span>
                <span>${Math.round(receipt.amount - receipt.amount / 1.19).toLocaleString("es-CL")}</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-300 pt-4">
              <span className="text-lg font-semibold text-slate-900">Total (IVA incluido):</span>
              <span className="text-3xl font-bold text-emerald-600">
                ${receipt.amount.toLocaleString("es-CL")}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-slate-600">Estado del pago:</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                {receipt.payment_status === "pagado" ? "Pagado" : receipt.payment_status}
              </span>
            </div>
          </div>

          {/* Nota */}
          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs text-amber-800">
              <strong>Nota:</strong> Este es un comprobante de pago simulado. 
              En un sistema de producción real, este comprobante sería generado 
              por la pasarela de pagos correspondiente.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

