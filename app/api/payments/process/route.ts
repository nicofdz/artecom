import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ckggbmwcbaiyrwiapygv.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ2dibXdjYmFpeXJ3aWFweWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDgxNjYsImV4cCI6MjA3OTU4NDE2Nn0.k8tyINQe9LLo16zffY1_1gZhwB71EH0vB-wFVsp-xP0";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Helper para crear cliente de Supabase con service role key o anon key
const getSupabaseClient = () => {
  if (supabaseServiceKey) {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  // Fallback a cliente anónimo
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Procesar pago simulado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, payment_method, buyer_id } = body;

    if (!order_id || !payment_method || !buyer_id) {
      return NextResponse.json(
        { error: "order_id, payment_method y buyer_id son requeridos" },
        { status: 400 }
      );
    }

    // Validar métodos de pago permitidos
    const allowedMethods = ["webpay", "mercadopago", "transbank"];
    if (!allowedMethods.includes(payment_method)) {
      return NextResponse.json(
        { error: "Método de pago no válido" },
        { status: 400 }
      );
    }

    // Usar service role key para evitar problemas de RLS
    const supabase = getSupabaseClient();

    // Obtener el pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("buyer_id", buyer_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el pedido no esté ya pagado
    if (order.payment_status === "pagado") {
      return NextResponse.json(
        { error: "Este pedido ya ha sido pagado" },
        { status: 400 }
      );
    }

    // Simular procesamiento de pago (siempre exitoso en simulación)
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const paymentStatus = "completado";

    // Crear registro de pago
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          order_id,
          amount: order.total_amount,
          payment_method,
          transaction_id: transactionId,
          status: paymentStatus,
          metadata: {
            simulated: true,
            processed_at: new Date().toISOString(),
            buyer_id,
          },
        },
      ])
      .select()
      .single();

    if (paymentError) {
      throw paymentError;
    }

    // Actualizar estado del pedido
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "pagado",
        order_status: "procesando",
      })
      .eq("id", order_id);

    if (updateError) {
      throw updateError;
    }

    // Obtener información del comprador para el comprobante
    const { data: { user: buyer } } = await supabase.auth.admin.getUserById(buyer_id).catch(() => ({ data: { user: null } }));

    // Obtener detalles del pedido para el email
    const { data: orderDetails } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          quantity,
          price_at_purchase,
          subtotal,
          products (
            id,
            name,
            images
          )
        )
      `)
      .eq("id", order_id)
      .single();

    // Enviar comprobante por email
    if (buyer?.email && orderDetails) {
      try {
        const receiptHtml = `
          <h1>Comprobante de Pago - Pedido #${order_id.slice(0, 8)}</h1>
          <p>Estimado/a ${buyer.user_metadata?.name || buyer.email},</p>
          <p>Gracias por tu compra en MARKETPLACE DE PRODUCTOS ARTESANALES CHILENOS. Tu pago ha sido procesado exitosamente.</p>
          <h2>Detalles del Pago:</h2>
          <ul>
            <li><strong>ID de Transacción:</strong> ${transactionId}</li>
            <li><strong>Método de Pago:</strong> ${payment_method}</li>
            <li><strong>Monto Total:</strong> $${order.total_amount.toLocaleString('es-CL')}</li>
            <li><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</li>
          </ul>
          <h2>Detalles del Pedido:</h2>
          <p><strong>ID del Pedido:</strong> ${order_id.slice(0, 8)}</p>
          <p><strong>Estado del Pedido:</strong> ${order.order_status}</p>
          <p><strong>Dirección de Envío:</strong> ${order.shipping_address}, ${order.shipping_city}, ${order.shipping_region}</p>
          <p><strong>Teléfono de Contacto:</strong> ${order.shipping_phone}</p>
          <h3>Productos:</h3>
          <ul>
            ${orderDetails.order_items?.map((item: any) => `
              <li>
                ${item.products?.name || 'Producto'} x ${item.quantity} - $${item.subtotal.toLocaleString('es-CL')}
              </li>
            `).join('') || '<li>No hay productos disponibles</li>'}
          </ul>
          <p>Puedes ver el estado de tu pedido en: <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pedidos">Mis Pedidos</a></p>
          <p>Ver comprobante en línea: <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/comprobante/${order_id}">Comprobante #${order_id.slice(0, 8)}</a></p>
          <p>Saludos cordiales,</p>
          <p>El equipo de MARKETPLACE DE PRODUCTOS ARTESANALES CHILENOS</p>
        `;

        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: buyer.email,
            subject: `Comprobante de Pago - Pedido #${order_id.slice(0, 8)}`,
            html: receiptHtml,
          }),
        });
      } catch (emailError) {
        console.error("Error al enviar email:", emailError);
        // No fallar si el email falla
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        transaction_id: transactionId,
        amount: order.total_amount,
        payment_method,
        status: paymentStatus,
      },
      order: {
        id: order.id,
        total_amount: order.total_amount,
        payment_status: "pagado",
        order_status: "procesando",
      },
      receipt: {
        order_id: order.id,
        transaction_id: transactionId,
        buyer_name: buyer?.user_metadata?.name || buyer?.email || "Cliente",
        buyer_email: buyer?.email || "",
        amount: order.total_amount,
        payment_method,
        date: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error al procesar pago:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar pago" },
      { status: 500 }
    );
  }
}

