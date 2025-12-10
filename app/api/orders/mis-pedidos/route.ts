import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase as supabaseAnon } from "../../../lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ckggbmwcbaiyrwiapygv.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ2dibXdjYmFpeXJ3aWFweWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDgxNjYsImV4cCI6MjA3OTU4NDE2Nn0.k8tyINQe9LLo16zffY1_1gZhwB71EH0vB-wFVsp-xP0";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Crear cliente con service role key si está disponible (bypass RLS)
const supabase = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabaseAnon;

// Obtener pedidos del usuario autenticado
export async function GET(request: NextRequest) {
  try {
    console.log("[Mis Pedidos API] ===== INICIO GET /api/orders/mis-pedidos =====");
    
    // Obtener el user_id de los query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    
    console.log("[Mis Pedidos API] Parámetros recibidos:", { userId });

    if (!userId) {
      console.log("[Mis Pedidos API] ❌ user_id no proporcionado");
      return NextResponse.json(
        { error: "user_id es requerido" },
        { status: 400 }
      );
    }

    // Verificar si tenemos service role key
    const usingServiceKey = !!supabaseServiceKey;
    console.log("[Mis Pedidos API] Service Role Key disponible:", usingServiceKey);
    console.log("[Mis Pedidos API] Service Role Key (primeros 20 chars):", supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + "..." : "NO CONFIGURADO");

    // Obtener orders sin joins para evitar recursión en RLS
    console.log("[Mis Pedidos API] Ejecutando consulta de orders...");
    console.log("[Mis Pedidos API] Cliente usado:", usingServiceKey ? "SERVICE_ROLE" : "ANON");
    
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    console.log("[Mis Pedidos API] Resultado consulta orders:", {
      tieneDatos: !!orders,
      cantidadOrders: orders?.length || 0,
      tieneError: !!ordersError,
      error: ordersError ? {
        message: ordersError.message,
        code: ordersError.code,
        details: ordersError.details,
        hint: ordersError.hint
      } : null
    });

    if (ordersError) {
      console.error("[Mis Pedidos API] ❌ ERROR al obtener orders:", {
        message: ordersError.message,
        code: ordersError.code,
        details: ordersError.details,
        hint: ordersError.hint,
        usandoServiceKey: usingServiceKey
      });
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      console.log("[Mis Pedidos API] No hay orders, retornando array vacío");
      console.log("[Mis Pedidos API] ===== FIN GET /api/orders/mis-pedidos (sin datos) =====");
      return NextResponse.json([], { status: 200 });
    }

    // Obtener order_items por separado
    const orderIds = orders.map((o: any) => o.id);
    console.log("[Mis Pedidos API] Obteniendo order_items para", orderIds.length, "orders");
    console.log("[Mis Pedidos API] Ejecutando consulta de order_items...");
    console.log("[Mis Pedidos API] Cliente usado:", usingServiceKey ? "SERVICE_ROLE" : "ANON");
    
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);

    console.log("[Mis Pedidos API] Resultado consulta order_items:", {
      tieneDatos: !!orderItems,
      cantidadItems: orderItems?.length || 0,
      tieneError: !!itemsError,
      error: itemsError ? {
        message: itemsError.message,
        code: itemsError.code,
        details: itemsError.details,
        hint: itemsError.hint
      } : null
    });

    if (itemsError) {
      console.error("[Mis Pedidos API] ❌ ERROR al obtener order_items:", {
        message: itemsError.message,
        code: itemsError.code,
        details: itemsError.details,
        hint: itemsError.hint,
        usandoServiceKey: usingServiceKey
      });
      throw itemsError;
    }

    // Obtener productos por separado
    const productIds = [...new Set((orderItems || []).map((item: any) => item.product_id))];
    console.log("[Mis Pedidos API] Obteniendo productos para", productIds.length, "productos");
    console.log("[Mis Pedidos API] Ejecutando consulta de products...");
    
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, category, images")
      .in("id", productIds);

    console.log("[Mis Pedidos API] Resultado consulta products:", {
      tieneDatos: !!products,
      cantidadProducts: products?.length || 0,
      tieneError: !!productsError,
      error: productsError ? {
        message: productsError.message,
        code: productsError.code
      } : null
    });

    if (productsError) {
      console.error("[Mis Pedidos API] ❌ ERROR al obtener products:", productsError);
      throw productsError;
    }

    // Crear mapa de productos para acceso rápido
    const productsMap = new Map((products || []).map((p: any) => [p.id, p]));

    // Agrupar order_items por order_id y agregar información de productos
    const itemsByOrder = new Map<string, any[]>();
    (orderItems || []).forEach((item: any) => {
      const product = productsMap.get(item.product_id);
      if (!itemsByOrder.has(item.order_id)) {
        itemsByOrder.set(item.order_id, []);
      }
      itemsByOrder.get(item.order_id)!.push({
        ...item,
        products: product || null
      });
    });

    // Combinar orders con sus order_items
    const ordersWithItems = orders.map((order: any) => ({
      ...order,
      order_items: itemsByOrder.get(order.id) || []
    }));

    console.log("[Mis Pedidos API] ✅ Retornando", ordersWithItems.length, "orders con items");
    console.log("[Mis Pedidos API] ===== FIN GET /api/orders/mis-pedidos (éxito) =====");
    return NextResponse.json(ordersWithItems, { status: 200 });
  } catch (error: any) {
    console.error("[Mis Pedidos API] 🔴 ERROR GENERAL en GET /api/orders/mis-pedidos:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    console.log("[Mis Pedidos API] ===== FIN GET /api/orders/mis-pedidos (error) =====");
    return NextResponse.json(
      { error: error.message || "Error al obtener pedidos" },
      { status: 500 }
    );
  }
}

