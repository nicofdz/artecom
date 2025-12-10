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

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  
  if (RESEND_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Marketplace Artesanal <onboarding@resend.dev>",
            to: [to],
            subject: subject,
            html: html,
            text: text,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const responseData = await response.json();
        
        if (!response.ok) {
          console.error(`[EMAIL] Error de Resend API (${response.status}):`, responseData);
          return { id: "error", message: responseData.message || "Error al enviar email", error: true };
        }

        return responseData;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          return { id: "error", message: "Timeout al enviar email", error: true };
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("[EMAIL] Error al enviar email:", error);
      return { id: "error", message: error instanceof Error ? error.message : "Error desconocido", error: true };
    }
  } else {
    console.log("=== EMAIL (desarrollo) ===");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body:", text);
    return { id: "dev-mode", message: "Email no enviado - RESEND_API_KEY no configurado" };
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("[Orders API] ===== INICIO GET /api/orders =====");
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get("buyer_id");
    const artisanId = searchParams.get("artisan_id");
    
    console.log("[Orders API] Parámetros recibidos:", { buyerId, artisanId });

    // Verificar si tenemos service role key para evitar recursión en RLS
    const usingServiceKey = !!supabaseServiceKey;
    console.log("[Orders API] Service Role Key disponible:", usingServiceKey);
    console.log("[Orders API] Service Role Key (primeros 20 chars):", supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + "..." : "NO CONFIGURADO");
    
    if (!usingServiceKey) {
      console.warn("[Orders API] ⚠️ ADVERTENCIA: No se encontró SUPABASE_SERVICE_ROLE_KEY. Puede causar recursión en RLS si las políticas están mal configuradas.");
    } else {
      console.log("[Orders API] ✅ Usando Service Role Key - RLS debería estar deshabilitado");
    }

    // Si se busca por artesano, primero obtener los order_ids de los order_items de ese artesano
    let orderIds: string[] | null = null;
    
    if (artisanId) {
      console.log("[Orders API] Buscando order_items para artisanId:", artisanId);
      console.log("[Orders API] Cliente Supabase usado:", usingServiceKey ? "SERVICE_ROLE" : "ANON");
      
      // Usar el mismo cliente (con service key si está disponible) para evitar recursión
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("order_id")
        .eq("artisan_id", artisanId);

      console.log("[Orders API] Resultado consulta order_items:", {
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
        console.error("[Orders API] ❌ ERROR al obtener order_items:", {
          message: itemsError.message,
          code: itemsError.code,
          details: itemsError.details,
          hint: itemsError.hint,
          usandoServiceKey: usingServiceKey
        });
        
        // Si hay error y no estamos usando service key, puede ser recursión
        if (!usingServiceKey && itemsError.message?.includes("recursion")) {
          console.error("[Orders API] 🔴 Error de recursión detectado sin Service Role Key");
          return NextResponse.json(
            { error: "Error de recursión en políticas RLS. Por favor, configura SUPABASE_SERVICE_ROLE_KEY en .env.local" },
            { status: 500 }
          );
        }
        throw itemsError;
      }
      
      // Obtener IDs únicos de pedidos
      orderIds = [...new Set((orderItems || []).map((item: any) => item.order_id))];
      console.log("[Orders API] Order IDs encontrados:", orderIds.length, orderIds);
      
      // Si no hay pedidos para este artesano, devolver array vacío
      if (orderIds.length === 0) {
        console.log("[Orders API] No hay pedidos para este artesano, retornando array vacío");
        return NextResponse.json([], { status: 200 });
      }
    }

    // Construir la consulta - evitar joins anidados que causan recursión en RLS
    // Primero obtener los orders sin joins
    console.log("[Orders API] Construyendo consulta de orders...");
    let query = supabase
      .from("orders")
      .select("*");

    // Aplicar filtros de seguridad
    if (buyerId) {
      console.log("[Orders API] Filtrando por buyer_id:", buyerId);
      query = query.eq("buyer_id", buyerId);
    }

    // Si hay orderIds filtrados por artesano, filtrar por esos IDs
    if (orderIds && orderIds.length > 0) {
      console.log("[Orders API] Filtrando por orderIds:", orderIds.length, "IDs");
      query = query.in("id", orderIds);
    }

    console.log("[Orders API] Ejecutando consulta de orders...");
    console.log("[Orders API] Cliente usado para orders:", usingServiceKey ? "SERVICE_ROLE" : "ANON");
    
    const { data: orders, error } = await query.order("created_at", { ascending: false });

    console.log("[Orders API] Resultado consulta orders:", {
      tieneDatos: !!orders,
      cantidadOrders: orders?.length || 0,
      tieneError: !!error,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      } : null
    });

    if (error) {
      console.error("[Orders API] ❌ ERROR al obtener orders:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        usandoServiceKey: usingServiceKey
      });
      throw error;
    }

    // Filtrar resultados para asegurar que solo se devuelven pedidos autorizados
    let filteredOrders = orders || [];
    
    if (buyerId) {
      filteredOrders = filteredOrders.filter((order: any) => order.buyer_id === buyerId);
    }

    // Obtener order_items y productos por separado para evitar recursión
    if (filteredOrders.length > 0) {
      const orderIdsList = filteredOrders.map((o: any) => o.id);
      console.log("[Orders API] Obteniendo order_items para", orderIdsList.length, "orders");
      
      // Obtener order_items
      console.log("[Orders API] Ejecutando consulta de order_items...");
      console.log("[Orders API] Cliente usado para order_items:", usingServiceKey ? "SERVICE_ROLE" : "ANON");
      
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIdsList);

      console.log("[Orders API] Resultado consulta order_items (segunda vez):", {
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
        console.error("[Orders API] ❌ ERROR al obtener order_items (segunda vez):", {
          message: itemsError.message,
          code: itemsError.code,
          details: itemsError.details,
          hint: itemsError.hint,
          usandoServiceKey: usingServiceKey
        });
        throw itemsError;
      }

      // Filtrar order_items por artesano si se busca por artesano
      let filteredItems = orderItems || [];
      if (artisanId) {
        filteredItems = filteredItems.filter((item: any) => item.artisan_id === artisanId);
      }

      // Obtener productos para los order_items
      const productIds = [...new Set(filteredItems.map((item: any) => item.product_id))];
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, category, images")
        .in("id", productIds);

      if (productsError) throw productsError;

      // Crear mapa de productos para acceso rápido
      const productsMap = new Map((products || []).map((p: any) => [p.id, p]));

      // Agrupar order_items por order_id y agregar información de productos
      const itemsByOrder = new Map<string, any[]>();
      filteredItems.forEach((item: any) => {
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
      const ordersWithItems = filteredOrders
        .map((order: any) => ({
          ...order,
          order_items: itemsByOrder.get(order.id) || []
        }))
        .filter((order: any) => {
          // Si se busca por artesano, solo mostrar orders que tengan items de ese artesano
          if (artisanId) {
            return order.order_items.length > 0;
          }
          return true;
        });

      console.log("[Orders API] ✅ Retornando", ordersWithItems.length, "orders con items");
      console.log("[Orders API] ===== FIN GET /api/orders (éxito) =====");
      return NextResponse.json(ordersWithItems, { status: 200 });
    }

    console.log("[Orders API] No hay orders filtrados, retornando array vacío");
    console.log("[Orders API] ===== FIN GET /api/orders (sin datos) =====");
    return NextResponse.json([], { status: 200 });
  } catch (error: any) {
    console.error("[Orders API] 🔴 ERROR GENERAL en GET /api/orders:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    console.log("[Orders API] ===== FIN GET /api/orders (error) =====");
    return NextResponse.json(
      { error: error.message || "Error al obtener pedidos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      buyer_id,
      shipping_address,
      shipping_city,
      shipping_region,
      shipping_phone,
      items, // Array de { product_id, quantity }
    } = body;

    // Validaciones
    if (!buyer_id) {
      return NextResponse.json(
        { error: "buyer_id es requerido" },
        { status: 400 }
      );
    }

    if (!shipping_address || !shipping_city || !shipping_region || !shipping_phone) {
      return NextResponse.json(
        { error: "shipping_address, shipping_city, shipping_region y shipping_phone son requeridos" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "El pedido debe contener al menos un producto" },
        { status: 400 }
      );
    }

    // 1. Validar stock y obtener información de productos
    const productIds = items.map((item: any) => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, stock, user_id")
      .in("id", productIds);

    if (productsError) throw productsError;

    if (!products || products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Uno o más productos no fueron encontrados" },
        { status: 400 }
      );
    }

    // Validar stock suficiente y calcular totales
    let totalAmount = 0;
    const orderItemsData: any[] = [];

    for (const item of items) {
      const product = products.find((p: any) => p.id === item.product_id);
      if (!product) {
        return NextResponse.json(
          { error: `Producto ${item.product_id} no encontrado` },
          { status: 400 }
        );
      }

      // Asegurar que stock y quantity sean números
      const availableStock = Number(product.stock) || 0;
      const requestedQuantity = Number(item.quantity) || 0;

      if (availableStock < requestedQuantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product.name}. Disponible: ${availableStock}, Solicitado: ${requestedQuantity}` },
          { status: 400 }
        );
      }

      if (availableStock === 0) {
        return NextResponse.json(
          { error: `El producto ${product.name} está agotado` },
          { status: 400 }
        );
      }

      const priceAtPurchase = parseFloat(product.price);
      const subtotal = priceAtPurchase * item.quantity;
      totalAmount += subtotal;

      orderItemsData.push({
        product_id: product.id,
        artisan_id: product.user_id,
        quantity: item.quantity,
        price_at_purchase: priceAtPurchase,
        subtotal: subtotal,
      });
    }

    // 2. Disminuir stock de productos
    for (const item of items) {
      const product = products.find((p: any) => p.id === item.product_id);
      if (product) {
        const newStock = product.stock - item.quantity;
        const { error: updateStockError } = await supabase
          .from("products")
          .update({ stock: newStock })
          .eq("id", item.product_id);

        if (updateStockError) {
          console.error(`Error al actualizar stock del producto ${item.product_id}:`, updateStockError);
          throw updateStockError;
        }
      }
    }

    // 3. Crear el pedido
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          buyer_id,
          total_amount: totalAmount,
          shipping_address,
          shipping_city,
          shipping_region,
          shipping_phone,
          payment_status: "pendiente",
          order_status: "procesando",
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // 4. Crear los items del pedido
    const orderItems = orderItemsData.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      artisan_id: item.artisan_id,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // 5. Obtener el pedido completo
    const { data: fullOrder, error: fetchError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .eq("id", order.id)
      .single();

    if (fetchError) throw fetchError;

    // 6. Enviar notificaciones a artesanos
    const artisanIds = [...new Set(orderItemsData.map((item) => item.artisan_id).filter((id: any) => id))];
    
    if (artisanIds.length > 0) {
      const productsByArtisan: Record<string, any[]> = {};
      for (const item of orderItemsData) {
        const product = products.find((p: any) => p.id === item.product_id);
        if (product && item.artisan_id) {
          if (!productsByArtisan[item.artisan_id]) {
            productsByArtisan[item.artisan_id] = [];
          }
          productsByArtisan[item.artisan_id].push({
            name: product.name,
            quantity: item.quantity,
            subtotal: item.subtotal,
          });
        }
      }

      for (const artisanId of artisanIds) {
        try {
          const { data: artisanEmail, error: artisanError } = await supabase.rpc('get_user_email', {
            user_id_param: artisanId
          });

          if (!artisanError && artisanEmail) {
            const artisanProducts = productsByArtisan[artisanId] || [];
            const artisanTotal = artisanProducts.reduce((sum, p) => sum + p.subtotal, 0);
            
            const orderItemsText = artisanProducts
              .map((p: any) => `- ${p.name} (${p.quantity} unidades) - $${p.subtotal.toLocaleString('es-CL')}`)
              .join("\n");

            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">Nuevo Pedido Recibido</h2>
                <p>Estimado/a artesano,</p>
                <p>Has recibido un nuevo pedido <strong>#${order.id.substring(0, 8)}</strong>.</p>
                
                <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 20px 0;">
                  <h3 style="margin: 0 0 12px 0; color: #059669;">Detalles del pedido:</h3>
                  <ul style="margin: 0; padding-left: 20px;">
                    <li><strong>Fecha:</strong> ${new Date(order.created_at).toLocaleDateString("es-ES")}</li>
                    <li><strong>Dirección de envío:</strong> ${shipping_address}, ${shipping_city}, ${shipping_region}</li>
                    <li><strong>Teléfono:</strong> ${shipping_phone}</li>
                  </ul>
                </div>

                <h3 style="color: #059669; margin-top: 24px;">Tus productos en este pedido:</h3>
                <pre style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; white-space: pre-wrap;">${orderItemsText}</pre>
                <p style="margin-top: 12px;"><strong>Total de tus productos: $${artisanTotal.toLocaleString('es-CL')}</strong></p>

                <p style="margin-top: 24px;">Por favor, revisa el pedido en tu panel de artesanos y prepara los productos.</p>
              </div>
            `;

            const emailText = `
Nuevo Pedido Recibido

Estimado/a artesano,

Has recibido un nuevo pedido #${order.id.substring(0, 8)}.

Detalles del pedido:
- Fecha: ${new Date(order.created_at).toLocaleDateString("es-ES")}
- Dirección de envío: ${shipping_address}, ${shipping_city}, ${shipping_region}
- Teléfono: ${shipping_phone}

Tus productos en este pedido:
${orderItemsText}

Total de tus productos: $${artisanTotal.toLocaleString('es-CL')}

Por favor, revisa el pedido en tu panel de artesanos y prepara los productos.
            `;

            sendEmail(
              artisanEmail,
              `Nuevo pedido #${order.id.substring(0, 8)}`,
              emailHtml,
              emailText
            ).catch((err) => {
              console.error(`[EMAIL] Error al enviar email a artesano ${artisanEmail}:`, err);
            });
          }
        } catch (error) {
          console.error(`[EMAIL] Error al obtener datos del artesano ${artisanId}:`, error);
        }
      }
    }

    return NextResponse.json(fullOrder, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al crear pedido" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      buyer_id,
      order_status, 
      payment_status,
      tracking_number,
      cancellation_reason 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID es requerido" },
        { status: 400 }
      );
    }

    // Validar estados
    const validOrderStatuses = ["procesando", "enviado", "entregado", "cancelado"];
    const validPaymentStatuses = ["pendiente", "pagado", "reembolsado"];

    if (order_status && !validOrderStatuses.includes(order_status)) {
      return NextResponse.json(
        { error: `order_status debe ser uno de: ${validOrderStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      return NextResponse.json(
        { error: `payment_status debe ser uno de: ${validPaymentStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Si se está cancelando, el motivo es requerido
    if (order_status === "cancelado" && !cancellation_reason) {
      return NextResponse.json(
        { error: "El motivo de cancelación es requerido" },
        { status: 400 }
      );
    }

    // Verificar permisos
    if (buyer_id) {
      const { data: existingOrder, error: checkError } = await supabase
        .from("orders")
        .select("buyer_id, order_status")
        .eq("id", id)
        .single();

      if (checkError) throw checkError;

      if (existingOrder?.buyer_id !== buyer_id) {
        return NextResponse.json(
          { error: "No tienes permiso para modificar este pedido" },
          { status: 403 }
        );
      }

      // Los compradores solo pueden cancelar pedidos en procesamiento
      if (order_status === "cancelado" && existingOrder?.order_status !== "procesando") {
        return NextResponse.json(
          { error: "Solo se pueden cancelar pedidos en procesamiento" },
          { status: 400 }
        );
      }
    }

    let previousStatus: string | undefined = undefined;
    if (order_status !== undefined) {
      // Si estamos actualizando el estado, necesitamos obtener el estado anterior
      const { data: currentOrder } = await supabase
        .from("orders")
        .select("order_status")
        .eq("id", id)
        .single();
      previousStatus = currentOrder?.order_status;
    }

    const isNewlyCancelled = order_status === "cancelado" && previousStatus !== "cancelado";

    const updateData: any = {};
    if (order_status !== undefined) updateData.order_status = order_status;
    if (payment_status !== undefined) updateData.payment_status = payment_status;
    if (tracking_number !== undefined) updateData.tracking_number = tracking_number;
    
    if (order_status === "cancelado" && cancellation_reason) {
      updateData.cancellation_reason = cancellation_reason;
    } else if (order_status !== "cancelado" && order_status !== undefined) {
      updateData.cancellation_reason = null;
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .single();

    if (error) throw error;

    // Si se canceló el pedido, restaurar el stock
    if (isNewlyCancelled && data.order_items && data.order_items.length > 0) {
      for (const item of data.order_items) {
        if (item.product_id && item.quantity) {
          try {
            const { data: productData } = await supabase
              .from("products")
              .select("stock")
              .eq("id", item.product_id)
              .single();

            const currentStock = productData?.stock || 0;
            const newStock = currentStock + item.quantity;

            await supabase
              .from("products")
              .update({ stock: newStock })
              .eq("id", item.product_id);
          } catch (error) {
            console.error(`[STOCK] Error al restaurar stock para producto ${item.product_id}:`, error);
          }
        }
      }
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al actualizar pedido" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");
    const buyerId = searchParams.get("buyer_id");

    if (!orderId || !buyerId) {
      return NextResponse.json(
        { error: "ID del pedido y buyer_id son requeridos" },
        { status: 400 }
      );
    }

    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, order_status, buyer_id")
      .eq("id", orderId)
      .single();

    if (fetchError) throw fetchError;

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (order.buyer_id !== buyerId) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar este pedido" },
        { status: 403 }
      );
    }

    if (order.order_status !== "cancelado") {
      return NextResponse.json(
        { error: "Solo se pueden eliminar pedidos cancelados" },
        { status: 400 }
      );
    }

    // Eliminar order_items (cascada)
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (itemsError) throw itemsError;

    // Eliminar el pedido
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (deleteError) throw deleteError;

    return NextResponse.json(
      { message: "Pedido eliminado correctamente" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al eliminar pedido" },
      { status: 500 }
    );
  }
}
