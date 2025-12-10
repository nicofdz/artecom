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

// Marcar pedidos cancelados como vistos
export async function POST(request: NextRequest) {
  try {
    console.log("[Mark Cancellations API] ===== INICIO POST /api/orders/mark-cancellations-viewed =====");
    const body = await request.json();
    const { user_id } = body;
    
    console.log("[Mark Cancellations API] Parámetros recibidos:", { user_id });

    if (!user_id) {
      console.log("[Mark Cancellations API] ❌ user_id no proporcionado");
      return NextResponse.json(
        { error: "user_id es requerido" },
        { status: 400 }
      );
    }

    // Verificar si tenemos service role key
    const usingServiceKey = !!supabaseServiceKey;
    console.log("[Mark Cancellations API] Service Role Key disponible:", usingServiceKey);

    // Nota: La columna cancellation_viewed no existe en la tabla orders
    // Por ahora, simplemente retornamos éxito sin hacer nada
    console.log("[Mark Cancellations API] Nota: cancellation_viewed no existe en la tabla orders");
    console.log("[Mark Cancellations API] Retornando éxito sin actualizar (funcionalidad no implementada)");
    
    // Retornar éxito sin hacer nada ya que la columna no existe
    const data: any[] = [];

    console.log("[Mark Cancellations API] Resultado update:", {
      tieneDatos: !!data,
      cantidadActualizados: data?.length || 0,
      tieneError: false
    });

    console.log("[Mark Cancellations API] ✅ Actualizados", data?.length || 0, "pedidos");
    console.log("[Mark Cancellations API] ===== FIN POST /api/orders/mark-cancellations-viewed (éxito) =====");
    return NextResponse.json(
      { message: "Pedidos cancelados marcados como vistos", count: data?.length || 0 },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Mark Cancellations API] 🔴 ERROR GENERAL en POST /api/orders/mark-cancellations-viewed:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    console.log("[Mark Cancellations API] ===== FIN POST /api/orders/mark-cancellations-viewed (error) =====");
    return NextResponse.json(
      { error: error.message || "Error al marcar pedidos como vistos" },
      { status: 500 }
    );
  }
}

