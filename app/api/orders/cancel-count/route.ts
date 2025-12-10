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

// Obtener conteo de pedidos cancelados del usuario
export async function GET(request: NextRequest) {
  try {
    console.log("[Cancel Count API] ===== INICIO GET /api/orders/cancel-count =====");
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    
    console.log("[Cancel Count API] Parámetros recibidos:", { userId });

    if (!userId) {
      console.log("[Cancel Count API] ❌ user_id no proporcionado");
      return NextResponse.json(
        { error: "user_id es requerido" },
        { status: 400 }
      );
    }

    // Verificar si tenemos service role key
    const usingServiceKey = !!supabaseServiceKey;
    console.log("[Cancel Count API] Service Role Key disponible:", usingServiceKey);
    console.log("[Cancel Count API] Service Role Key (primeros 20 chars):", supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + "..." : "NO CONFIGURADO");

    // Primero verificar que podemos acceder a la tabla orders
    console.log("[Cancel Count API] Ejecutando consulta de prueba simple...");
    const { data: testData, error: testError } = await supabase
      .from("orders")
      .select("id")
      .limit(1);
    
    console.log("[Cancel Count API] Test de acceso a tabla orders:", {
      tieneDatos: !!testData,
      tieneError: !!testError,
      error: testError ? JSON.stringify(testError, Object.getOwnPropertyNames(testError)) : null
    });

    if (testError) {
      console.error("[Cancel Count API] ❌ No se puede acceder a la tabla orders:", testError);
      throw testError;
    }

    // Obtener conteo de pedidos cancelados
    // Nota: La columna cancellation_viewed no existe en la tabla orders
    // Por ahora, retornamos el conteo de todos los pedidos cancelados
    console.log("[Cancel Count API] Ejecutando consulta de orders...");
    console.log("[Cancel Count API] Cliente usado:", usingServiceKey ? "SERVICE_ROLE" : "ANON");
    
    // Obtener conteo de todos los pedidos cancelados del usuario
    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("buyer_id", userId)
      .eq("order_status", "cancelado");

    console.log("[Cancel Count API] Resultado consulta cancelados:", {
      count: count,
      tieneError: !!error,
      error: error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : null
    });

    if (error) {
      console.error("[Cancel Count API] ❌ ERROR al obtener conteo de cancelados:", error);
      throw error;
    }

    const totalCount = count || 0;
    console.log("[Cancel Count API] Conteo total de pedidos cancelados:", totalCount);

    console.log("[Cancel Count API] ✅ Retornando count:", totalCount);
    console.log("[Cancel Count API] ===== FIN GET /api/orders/cancel-count (éxito) =====");
    return NextResponse.json({ count: totalCount }, { status: 200 });
  } catch (error: any) {
    console.error("[Cancel Count API] 🔴 ERROR GENERAL en GET /api/orders/cancel-count:", {
      error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    });
    console.log("[Cancel Count API] ===== FIN GET /api/orders/cancel-count (error) =====");
    return NextResponse.json(
      { error: error?.message || error?.toString() || "Error al obtener conteo" },
      { status: 500 }
    );
  }
}

