"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TopNav } from "../components/top-nav";
import { useAuth } from "../components/auth-provider";
import Footer from "../components/footer";
import { supabase } from "../lib/supabase";

type CartItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  images: string[];
  quantity: number;
};

const paymentMethods = [
  {
    id: "webpay",
    name: "Webpay Plus",
    description: "Tarjeta de crédito o débito",
    icon: "💳",
  },
  {
    id: "transbank",
    name: "Transbank",
    description: "Pago con tarjeta",
    icon: "💳",
  },
  {
    id: "mercadopago",
    name: "Mercado Pago",
    description: "Pago rápido y seguro",
    icon: "💳",
  },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("webpay");
  const [processing, setProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingRegion, setShippingRegion] = useState("Los Lagos");
  const [shippingPhone, setShippingPhone] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/checkout");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadCartItems();
      // Cargar dirección desde perfil si existe
      loadBuyerProfile();
    }
  }, [user]);

  async function loadBuyerProfile() {
    try {
      const response = await fetch(`/api/buyer-profile?user_id=${user?.id}`);
      if (response.ok) {
        const profile = await response.json();
        if (profile) {
          // Usar primera dirección predeterminada o la primera disponible
          const defaultAddress = profile.shipping_addresses?.find(
            (addr: any) => addr.is_default
          ) || profile.shipping_addresses?.[0];

          if (defaultAddress) {
            setShippingAddress(defaultAddress.address);
            setShippingCity(defaultAddress.city);
            setShippingRegion(defaultAddress.region);
            setShippingPhone(defaultAddress.phone);
          } else if (profile.phone) {
            setShippingPhone(profile.phone);
          }
        }
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
    }
  }

  async function loadCartItems() {
    try {
      setLoading(true);
      const { getCart } = await import("../lib/cart");
      const cart = getCart();
      const items = Object.entries(cart).map(([id, qty]) => ({
        id,
        quantity: qty,
      }));

      if (items.length === 0) {
        router.push("/carrito");
        return;
      }

      const productIds = items.map(item => item.id);
      const response = await fetch(`/api/products?ids=${productIds.join(',')}`);
      if (response.ok) {
        const products = await response.json();
        const cartItemsData: CartItem[] = items
          .map((item) => {
            const product = products.find((p: any) => p.id === item.id);
            if (!product) return null;
            
            // Validar stock disponible antes de agregar al carrito
            const availableStock = Number(product.stock) || 0;
            const requestedQuantity = Number(item.quantity) || 0;
            
            // Si el stock disponible es menor que la cantidad solicitada, ajustar
            if (availableStock < requestedQuantity) {
              console.warn(`Stock insuficiente para ${product.name}. Disponible: ${availableStock}, Solicitado: ${requestedQuantity}`);
              // No ajustar automáticamente, dejar que el usuario decida en el checkout
            }
            
            return {
              id: product.id,
              name: product.name,
              category: product.category,
              price: product.price,
              images: product.images || [],
              quantity: item.quantity,
            };
          })
          .filter((item): item is CartItem => item !== null);
        setCartItems(cartItemsData);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function processPayment() {
    if (!user) return;

    if (!shippingAddress || !shippingCity || !shippingRegion || !shippingPhone) {
      alert("Por favor completa todos los campos de envío");
      return;
    }

    if (cartItems.length === 0) {
      alert("El carrito está vacío. Agrega productos antes de pagar.");
      router.push("/carrito");
      return;
    }

    try {
      setProcessing(true);

      // Validar stock antes de crear el pedido
      const productIds = cartItems.map(item => item.id);
      const stockCheckResponse = await fetch(`/api/products?ids=${productIds.join(',')}`);
      if (!stockCheckResponse.ok) {
        throw new Error("Error al verificar stock de productos");
      }
      
      const currentProducts = await stockCheckResponse.json();
      const stockErrors: string[] = [];
      
      for (const cartItem of cartItems) {
        const product = currentProducts.find((p: any) => p.id === cartItem.id);
        if (!product) {
          stockErrors.push(`Producto ${cartItem.name} no encontrado`);
          continue;
        }
        
        const availableStock = Number(product.stock) || 0;
        const requestedQuantity = Number(cartItem.quantity) || 0;
        
        if (availableStock < requestedQuantity) {
          stockErrors.push(`Stock insuficiente para ${product.name}. Disponible: ${availableStock}, Solicitado: ${requestedQuantity}`);
        }
      }
      
      if (stockErrors.length > 0) {
        alert(stockErrors.join("\n") + "\n\nPor favor, ajusta las cantidades en tu carrito.");
        router.push("/carrito");
        return;
      }

      // Primero crear el pedido
      const orderItems = cartItems.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      }));

      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: user.id,
          shipping_address: shippingAddress,
          shipping_city: shippingCity,
          shipping_region: shippingRegion,
          shipping_phone: shippingPhone,
          items: orderItems,
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.error || "Error al crear pedido");
      }

      const orderData = await orderResponse.json();
      const newOrderId = orderData.id;

      // Procesar pago simulado
      const paymentResponse = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: newOrderId,
          payment_method: selectedPaymentMethod,
          buyer_id: user.id,
        }),
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json();
        throw new Error(error.error || "Error al procesar pago");
      }

      const paymentData = await paymentResponse.json();

      // Limpiar carrito
      const { clearCart } = await import("../lib/cart");
      clearCart();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("cart-updated"));
      }, 0);

      // Redirigir al comprobante - el API de pagos ya envía el email
      router.push(`/comprobante/${newOrderId}`);
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al procesar el pago");
    } finally {
      setProcessing(false);
    }
  }

  function generateReceiptHTML(receipt: any, items: CartItem[], address: string, city: string, region: string, phone: string) {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .content { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .total { font-size: 18px; font-weight: bold; color: #10b981; margin-top: 20px; }
          .info { margin: 10px 0; }
          .note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✅ Pago Confirmado</h1>
          <p>Marketplace de Productos Artesanales Chilenos</p>
        </div>
        <div class="content">
          <h2>Detalles del Pedido</h2>
          <div class="info"><strong>Número de Pedido:</strong> ${receipt.order_id.slice(0, 8)}</div>
          <div class="info"><strong>Transacción:</strong> ${receipt.transaction_id}</div>
          <div class="info"><strong>Método de Pago:</strong> ${
            receipt.payment_method === "webpay" ? "Webpay Plus" :
            receipt.payment_method === "transbank" ? "Transbank" :
            receipt.payment_method === "mercadopago" ? "Mercado Pago" :
            receipt.payment_method
          }</div>
          <div class="info"><strong>Fecha:</strong> ${new Date(receipt.date).toLocaleString("es-CL")}</div>
          
          <h3 style="margin-top: 20px;">Productos Artesanales</h3>
          ${items.map(item => `
            <div class="item">
              <span>${item.name} x${item.quantity}</span>
              <span>$${(item.price * item.quantity).toLocaleString("es-CL")}</span>
            </div>
          `).join("")}
          
          <div class="total">
            Total: $${receipt.amount.toLocaleString("es-CL")}
          </div>
          
          <h3 style="margin-top: 20px;">Dirección de Envío</h3>
          <div class="info">${address}, ${city}, ${region}</div>
          <div class="info">Teléfono: ${phone}</div>
          
          <div class="note">
            <strong>Nota:</strong> Este es un comprobante de pago simulado. 
            Tu pedido será procesado y enviado por el artesano. 
            Recibirás actualizaciones sobre el estado de tu pedido.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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

  if (orderId) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <TopNav />
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-20 sm:px-8">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <div className="mb-4 text-6xl">✅</div>
            <h1 className="mb-4 text-3xl font-semibold text-emerald-900">
              ¡Pago Procesado Exitosamente!
            </h1>
            <p className="mb-6 text-base text-emerald-700">
              Tu pedido ha sido confirmado y el comprobante ha sido enviado a tu email.
            </p>
            <div className="mb-6 rounded-xl border border-emerald-200 bg-white p-6 text-left">
              <p className="text-sm font-semibold text-slate-700">
                Número de Pedido: <span className="font-mono text-emerald-600">{orderId.slice(0, 8)}</span>
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Revisa tu email para ver el comprobante completo.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/comprobante/${orderId}`}
                className="rounded-lg border border-emerald-500 bg-white px-6 py-3 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Ver Comprobante
              </Link>
              <Link
                href="/pedidos"
                className="rounded-lg bg-emerald-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Ver Mis Pedidos
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-emerald-600">Checkout</p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Finalizar Compra
          </h1>
          <p className="text-base text-slate-600">
            Completa la información para procesar tu pago.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Formulario */}
          <div className="space-y-6">
            {/* Dirección de envío */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                Dirección de Envío
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Calle y número"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Región *
                    </label>
                    <select
                      value={shippingRegion}
                      onChange={(e) => setShippingRegion(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      {[
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
                      ].map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </section>

            {/* Método de pago */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                Método de Pago
              </h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition ${
                      selectedPaymentMethod === method.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-emerald-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.id}
                      checked={selectedPaymentMethod === method.id}
                      onChange={() => setSelectedPaymentMethod(method.id)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <span className="text-2xl">{method.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{method.name}</p>
                      <p className="text-sm text-slate-600">{method.description}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-800">
                  ⚠️ <strong>Modo Simulación:</strong> Este es un sistema de pago simulado. 
                  No se realizará ningún cargo real. El pago se procesará automáticamente.
                </p>
              </div>
            </section>
          </div>

          {/* Resumen */}
          <div className="lg:sticky lg:top-4 lg:h-fit">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                Resumen del Pedido
              </h2>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-700">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-semibold text-slate-900">
                      ${(item.price * item.quantity).toLocaleString("es-CL")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal ({totalItems} items):</span>
                  <span className="font-semibold text-slate-900">
                    ${totalAmount.toLocaleString("es-CL")}
                  </span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-lg font-semibold text-slate-900">Total:</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    ${totalAmount.toLocaleString("es-CL")}
                  </span>
                </div>
              </div>
              <button
                onClick={processPayment}
                disabled={processing || !shippingAddress || !shippingCity || !shippingPhone}
                className="mt-6 w-full rounded-xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {processing ? "Procesando pago..." : `Pagar $${totalAmount.toLocaleString("es-CL")}`}
              </button>
              <Link
                href="/carrito"
                className="mt-3 block w-full rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ← Volver al carrito
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <TopNav />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

