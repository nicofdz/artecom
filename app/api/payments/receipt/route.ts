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

// Generar comprobante de pago
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");
    const paymentId = searchParams.get("payment_id");

    if (!orderId && !paymentId) {
      return NextResponse.json(
        { error: "order_id o payment_id es requerido" },
        { status: 400 }
      );
    }

    // Usar service role key para evitar problemas de RLS
    const supabase = getSupabaseClient();

    let payment;
    let order;

    if (paymentId) {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          orders (
            id,
            buyer_id,
            total_amount,
            shipping_address,
            shipping_city,
            shipping_region,
            created_at,
            order_items (
              id,
              quantity,
              price_at_purchase,
              subtotal,
              products (
                id,
                name,
                category
              )
            )
          )
        `)
        .eq("id", paymentId)
        .single();

      if (error) throw error;
      payment = data;
      order = data.orders;
    } else {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            quantity,
            price_at_purchase,
            subtotal,
            products (
              id,
              name,
              category
            )
          )
        `)
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;
      order = orderData;

      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!paymentError && paymentData) {
        payment = paymentData;
      }
    }

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Obtener información del comprador
    const { data: { user: buyer } } = await supabase.auth.admin.getUserById(order.buyer_id).catch(() => ({ data: { user: null } }));

    const receipt = {
      order_id: order.id,
      transaction_id: payment?.transaction_id || "N/A",
      buyer_name: buyer?.user_metadata?.name || buyer?.email || "Cliente",
      buyer_email: buyer?.email || "",
      amount: order.total_amount,
      payment_method: payment?.payment_method || "N/A",
      payment_status: order.payment_status,
      date: payment?.created_at || order.created_at,
      items: order.order_items || [],
      shipping: {
        address: order.shipping_address,
        city: order.shipping_city,
        region: order.shipping_region,
      },
    };

    return NextResponse.json(receipt);
  } catch (error: any) {
    console.error("Error al generar comprobante:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar comprobante" },
      { status: 500 }
    );
  }
}

