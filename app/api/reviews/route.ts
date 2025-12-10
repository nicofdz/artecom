import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase as supabaseAnon } from "../../lib/supabase";

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

// Obtener reseñas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");
    const artisanId = searchParams.get("artisan_id");
    const buyerId = searchParams.get("buyer_id");
    const orderId = searchParams.get("order_id");

    let query = supabase
      .from("reviews")
      .select(`
        *,
        products (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (productId) {
      query = query.eq("product_id", productId);
    }

    if (artisanId) {
      query = query.eq("artisan_id", artisanId);
    }

    if (buyerId) {
      query = query.eq("buyer_id", buyerId);
    }

    if (orderId) {
      query = query.eq("order_id", orderId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || [], { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener reseñas" },
      { status: 500 }
    );
  }
}

// Crear reseña
export async function POST(request: NextRequest) {
  try {
    console.log("[Reviews API] ===== INICIO POST /api/reviews =====");
    const body = await request.json();
    const {
      order_id,
      product_id,
      artisan_id,
      buyer_id,
      rating,
      comment,
    } = body;

    console.log("[Reviews API] Parámetros recibidos:", { order_id, product_id, artisan_id, buyer_id, rating });

    // Validaciones
    if (!order_id || !product_id || !artisan_id || !buyer_id || !rating) {
      console.log("[Reviews API] ❌ Faltan parámetros requeridos");
      return NextResponse.json(
        { error: "order_id, product_id, artisan_id, buyer_id y rating son requeridos" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      console.log("[Reviews API] ❌ Rating inválido:", rating);
      return NextResponse.json(
        { error: "La valoración debe estar entre 1 y 5" },
        { status: 400 }
      );
    }

    // Verificar si tenemos service role key
    const usingServiceKey = !!supabaseServiceKey;
    console.log("[Reviews API] Service Role Key disponible:", usingServiceKey);
    console.log("[Reviews API] Cliente usado:", usingServiceKey ? "SERVICE_ROLE" : "ANON");

    // Verificar que el usuario es un comprador
    console.log("[Reviews API] Verificando tipo de usuario...");
    let userIsBuyer = false;
    try {
      const { data: { user: authUser }, error: userError } = await supabase.auth.admin.getUserById(buyer_id);
      if (!userError && authUser) {
        const userType = authUser.user_metadata?.user_type;
        userIsBuyer = userType === "comprador";
        console.log("[Reviews API] Tipo de usuario:", userType, "Es comprador:", userIsBuyer);
      }
    } catch (error) {
      console.error("[Reviews API] Error al verificar tipo de usuario:", error);
    }

    if (!userIsBuyer) {
      console.log("[Reviews API] ❌ El usuario no es un comprador");
      return NextResponse.json(
        { error: "Solo los compradores pueden crear reseñas" },
        { status: 403 }
      );
    }

    // Verificar que el pedido existe y pertenece al comprador
    console.log("[Reviews API] Verificando pedido proporcionado:", order_id);
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, buyer_id, order_status")
      .eq("id", order_id)
      .single();

    console.log("[Reviews API] Resultado consulta order:", {
      tieneDatos: !!order,
      order: order ? { id: order.id, buyer_id: order.buyer_id, order_status: order.order_status } : null,
      tieneError: !!orderError,
      error: orderError ? JSON.stringify(orderError, Object.getOwnPropertyNames(orderError)) : null
    });

    if (orderError) {
      console.error("[Reviews API] ❌ ERROR al obtener order:", orderError);
      throw orderError;
    }

    if (!order) {
      console.log("[Reviews API] ❌ Pedido no encontrado");
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (order.buyer_id !== buyer_id) {
      console.log("[Reviews API] ❌ El pedido no pertenece al comprador:", {
        orderBuyerId: order.buyer_id,
        requestBuyerId: buyer_id
      });
      return NextResponse.json(
        { error: "No tienes permiso para reseñar este pedido" },
        { status: 403 }
      );
    }

    // Solo se puede reseñar si el pedido está entregado
    console.log("[Reviews API] Estado del pedido:", order.order_status);
    if (order.order_status !== "entregado") {
      console.log("[Reviews API] ❌ El pedido no está entregado, estado:", order.order_status);
      return NextResponse.json(
        { error: `Solo se pueden reseñar pedidos entregados. El estado actual es: ${order.order_status}` },
        { status: 400 }
      );
    }

    // Verificar que no existe ya una reseña para este producto del comprador
    // Solo una reseña por producto, pero si compra de nuevo puede reseñar
    // Primero verificar si ya hay una reseña para este producto del comprador
    const { data: existingProductReview } = await supabase
      .from("reviews")
      .select("id, order_id")
      .eq("product_id", product_id)
      .eq("buyer_id", buyer_id)
      .single();

    if (existingProductReview) {
      // Si ya hay una reseña para este producto, verificar si es del mismo pedido
      if (existingProductReview.order_id === order_id) {
        console.log("[Reviews API] ❌ Ya existe una reseña para este producto en este pedido");
        return NextResponse.json(
          { error: "Ya has reseñado este producto en este pedido." },
          { status: 400 }
        );
      }
      
      // Si es de otro pedido, verificar que el pedido actual tenga el producto
      // y que el comprador pueda reseñar (ya validado arriba que el pedido es entregado)
      console.log("[Reviews API] Ya hay una reseña para este producto de otro pedido, permitiendo nueva reseña para este pedido");
    }

    // Crear la reseña
    console.log("[Reviews API] Creando reseña con order_id:", order_id);
    const { data, error } = await supabase
      .from("reviews")
      .insert([
        {
          order_id,
          product_id,
          artisan_id,
          buyer_id,
          rating,
          comment: comment || null,
        },
      ])
      .select()
      .single();

    console.log("[Reviews API] Resultado creación reseña:", {
      tieneDatos: !!data,
      tieneError: !!error,
      error: error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : null
    });

    if (error) {
      console.error("[Reviews API] ❌ ERROR al crear reseña:", error);
      throw error;
    }

    console.log("[Reviews API] ✅ Reseña creada exitosamente");
    console.log("[Reviews API] ===== FIN POST /api/reviews (éxito) =====");
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("[Reviews API] 🔴 ERROR GENERAL en POST /api/reviews:", {
      error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    console.log("[Reviews API] ===== FIN POST /api/reviews (error) =====");
    return NextResponse.json(
      { error: error?.message || error?.toString() || "Error al crear reseña" },
      { status: 500 }
    );
  }
}

// Actualizar reseña
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, buyer_id, rating, comment } = body;

    if (!id || !buyer_id) {
      return NextResponse.json(
        { error: "id y buyer_id son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que la reseña pertenece al comprador
    const { data: existingReview, error: fetchError } = await supabase
      .from("reviews")
      .select("buyer_id")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    if (!existingReview) {
      return NextResponse.json(
        { error: "Reseña no encontrada" },
        { status: 404 }
      );
    }

    if (existingReview.buyer_id !== buyer_id) {
      return NextResponse.json(
        { error: "No tienes permiso para modificar esta reseña" },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: "La valoración debe estar entre 1 y 5" },
          { status: 400 }
        );
      }
      updateData.rating = rating;
    }
    if (comment !== undefined) updateData.comment = comment;

    const { data, error } = await supabase
      .from("reviews")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al actualizar reseña" },
      { status: 500 }
    );
  }
}

// Eliminar reseña
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const buyerId = searchParams.get("buyer_id");

    if (!id || !buyerId) {
      return NextResponse.json(
        { error: "id y buyer_id son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que la reseña pertenece al comprador
    const { data: existingReview, error: fetchError } = await supabase
      .from("reviews")
      .select("buyer_id")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    if (!existingReview) {
      return NextResponse.json(
        { error: "Reseña no encontrada" },
        { status: 404 }
      );
    }

    if (existingReview.buyer_id !== buyerId) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar esta reseña" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json(
      { message: "Reseña eliminada correctamente" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al eliminar reseña" },
      { status: 500 }
    );
  }
}

