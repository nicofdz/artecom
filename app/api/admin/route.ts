import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ckggbmwcbaiyrwiapygv.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ2dibXdjYmFpeXJ3aWFweWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDgxNjYsImV4cCI6MjA3OTU4NDE2Nn0.k8tyINQe9LLo16zffY1_1gZhwB71EH0vB-wFVsp-xP0";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Obtener estadísticas generales
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // Crear cliente de Supabase con el token del usuario para validar
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Intentar validar el token
    let user;
    try {
      const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser();

      if (authError || !authUser) {
        return NextResponse.json({
          error: "No autorizado",
          details: authError?.message
        }, { status: 401 });
      }

      user = authUser;
    } catch (error: any) {
      return NextResponse.json({
        error: "Error al validar token",
        details: error.message
      }, { status: 401 });
    }

    // Verificar si es admin (usar user_metadata)
    const userIsAdmin = user.user_metadata?.is_admin === true;
    if (!userIsAdmin) {
      return NextResponse.json({
        error: "Acceso denegado. Se requieren permisos de administrador.",
        user_metadata: user.user_metadata
      }, { status: 403 });
    }

    // Si es admin y tenemos service key, usar service key para bypass RLS
    // Si no hay service key, usar el cliente con token del usuario
    const usingServiceKey = !!supabaseServiceKey;
    console.log("[Admin API] Service Role Key disponible:", usingServiceKey);

    const supabase = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      : supabaseAuth;

    if (!usingServiceKey) {
      console.warn("[Admin API] ADVERTENCIA: No se encontró SUPABASE_SERVICE_ROLE_KEY. Usando token de usuario (puede causar recursión en RLS)");
    }

    const action = request.nextUrl.searchParams.get("action");

    // Estadísticas generales
    if (!action || action === "stats") {
      // Contar artesanos (usuarios con perfil de artesano)
      let totalArtisans = 0;
      try {
        const { count } = await supabase
          .from("artisan_profiles")
          .select("*", { count: "exact", head: true });
        totalArtisans = count || 0;
      } catch (error) {
        console.error("Error al contar artesanos:", error);
        totalArtisans = 0;
      }

      // Contar productos
      let totalProducts = 0;
      let activeProducts = 0;
      try {
        const { count: total } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true });
        totalProducts = total || 0;

        const { count: active } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);
        activeProducts = active || 0;
      } catch (error) {
        console.error("Error al contar productos:", error);
        totalProducts = 0;
        activeProducts = 0;
      }

      // Contar pedidos
      let totalOrders = 0;
      let ordersStatusCount: Record<string, number> = {};
      try {
        const { count } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true });
        totalOrders = count || 0;

        const { data: ordersByStatus } = await supabase
          .from("orders")
          .select("order_status");

        if (ordersByStatus) {
          ordersStatusCount = ordersByStatus.reduce((acc: Record<string, number>, order: any) => {
            acc[order.order_status] = (acc[order.order_status] || 0) + 1;
            return acc;
          }, {});
        }
      } catch (error) {
        console.error("Error al contar pedidos:", error);
        totalOrders = 0;
        ordersStatusCount = {};
      }

      // Contar reseñas
      let totalReviews = 0;
      let avgRating = 0;
      try {
        const { count } = await supabase
          .from("reviews")
          .select("*", { count: "exact", head: true });
        totalReviews = count || 0;

        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating");

        if (reviews && reviews.length > 0) {
          avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
        }
      } catch (error) {
        console.error("Error al contar reseñas:", error);
        totalReviews = 0;
        avgRating = 0;
      }

      // Calcular ingresos totales y ventas por día (últimos 7 días)
      let totalRevenue = 0;
      let salesHistory: { date: string; amount: number }[] = [];

      try {
        const { data: paidOrders } = await supabase
          .from("orders")
          .select("total_amount, created_at")
          .eq("payment_status", "pagado");

        if (paidOrders) {
          totalRevenue = paidOrders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);

          // Agrupar por día
          const salesByDay: Record<string, number> = {};
          const today = new Date();

          // Inicializar últimos 7 días con 0
          for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            salesByDay[dateStr] = 0;
          }

          paidOrders.forEach((order: any) => {
            const dateStr = new Date(order.created_at).toISOString().split('T')[0];
            if (salesByDay[dateStr] !== undefined) {
              salesByDay[dateStr] += order.total_amount || 0;
            }
          });

          salesHistory = Object.entries(salesByDay)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));
        }
      } catch (error) {
        console.error("Error al calcular ingresos:", error);
        totalRevenue = 0;
      }

      return NextResponse.json({
        stats: {
          users: {
            artisans: totalArtisans || 0,
            // Nota: El total de usuarios requiere permisos de servicio de Supabase
          },
          products: {
            total: totalProducts || 0,
            active: activeProducts || 0,
            inactive: (totalProducts || 0) - (activeProducts || 0),
          },
          orders: {
            total: totalOrders || 0,
            byStatus: ordersStatusCount,
          },
          reviews: {
            total: totalReviews || 0,
            averageRating: Math.round(avgRating * 10) / 10,
          },
          revenue: {
            total: totalRevenue,
            history: salesHistory,
          },
        },
      });
    }

    // Obtener lista de usuarios
    if (action === "users") {
      // Si tenemos service key, obtener usuarios completos desde auth
      if (supabaseServiceKey) {
        try {
          const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          });

          // Obtener todos los usuarios (limitado a 100)
          const { data: { users: authUsers }, error: listError } = await adminClient.auth.admin.listUsers();

          if (listError) {
            console.error("Error al listar usuarios:", listError);
            return NextResponse.json({ error: listError.message }, { status: 500 });
          }

          // Obtener perfiles de artesanos y compradores
          const userIds = (authUsers || []).map(u => u.id);

          const { data: artisanProfiles } = await supabase
            .from("artisan_profiles")
            .select("user_id")
            .in("user_id", userIds);

          const { data: buyerProfiles } = await supabase
            .from("buyer_profiles")
            .select("user_id")
            .in("user_id", userIds);

          const artisanUserIds = new Set((artisanProfiles || []).map((p: any) => p.user_id));
          const buyerUserIds = new Set((buyerProfiles || []).map((p: any) => p.user_id));

          const usersWithMetadata = (authUsers || []).map((authUser: any) => {
            const isArtisan = artisanUserIds.has(authUser.id);
            const isBuyer = buyerUserIds.has(authUser.id);

            let userType = authUser.user_metadata?.user_type || null;
            if (!userType) {
              if (isArtisan) userType = "artesano";
              else if (isBuyer) userType = "comprador";
            }

            return {
              id: authUser.id,
              email: authUser.email,
              name: authUser.user_metadata?.name || null,
              user_type: userType,
              is_admin: authUser.user_metadata?.is_admin === true,
              banned_until: authUser.banned_until,
              created_at: authUser.created_at,
            };
          });

          return NextResponse.json({ users: usersWithMetadata });
        } catch (error: any) {
          console.error("Error al obtener usuarios:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else {
        // Fallback: solo obtener perfiles de artesanos
        const { data: artisanProfiles, error } = await supabase
          .from("artisan_profiles")
          .select("user_id, region, ciudad, created_at")
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const usersWithMetadata = (artisanProfiles || []).map((profile: any) => ({
          id: profile.user_id,
          email: null,
          name: null,
          user_type: "artesano",
          is_admin: false,
          banned_until: null,
          region: profile.region,
          ciudad: profile.ciudad,
          created_at: profile.created_at,
        }));

        return NextResponse.json({ users: usersWithMetadata });
      }
    }

    // Obtener lista de productos
    if (action === "products") {
      const { data: products, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          category,
          price,
          stock,
          is_active,
          created_at,
          user_id
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ products: products || [] });
    }

    // Obtener lista de pedidos
    if (action === "orders") {
      console.log("[Admin API] Obteniendo pedidos. Usando Service Key:", usingServiceKey);

      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          id,
          buyer_id,
          total_amount,
          order_status,
          payment_status,
          created_at
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("[Admin API] Error al obtener pedidos:", error);
        console.error("[Admin API] Service Key usado:", usingServiceKey);
        return NextResponse.json({
          error: error.message,
          details: error,
          using_service_key: usingServiceKey
        }, { status: 500 });
      }

      console.log("[Admin API] Pedidos obtenidos exitosamente:", orders?.length || 0);
      return NextResponse.json({ orders: orders || [] });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error: any) {
    console.error("Error en API admin:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}

// Actualizar estado de productos o usuarios
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // Crear cliente para validar usuario
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userIsAdmin = user.user_metadata?.is_admin === true;
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Usar service role key si está disponible para bypass RLS
    const supabase = supabaseServiceKey
      ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      : supabaseAuth;

    const body = await request.json();
    const { type, id, updates } = body;

    if (type === "product") {
      const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (type === "user") {
      // Para actualizar usuarios, necesitamos usar el cliente con service key
      if (!supabaseServiceKey) {
        return NextResponse.json({
          error: "Se requiere service role key para actualizar usuarios"
        }, { status: 403 });
      }

      const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Si se está actualizando is_admin, también actualizar en user_metadata
      const updateData: any = {};
      if (updates.is_admin !== undefined) {
        updateData.user_metadata = { ...updates, is_admin: updates.is_admin };
      } else if (updates.ban_duration) {
        updateData.ban_duration = updates.ban_duration;
      } else {
        updateData.user_metadata = updates;
      }

      const { error } = await adminClient.auth.admin.updateUserById(id, updateData);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (type === "delete_product") {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Tipo no válido" }, { status: 400 });
  } catch (error: any) {
    console.error("Error en API admin PUT:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}

