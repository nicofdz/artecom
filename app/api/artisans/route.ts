import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ckggbmwcbaiyrwiapygv.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ2dibXdjYmFpeXJ3aWFweWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDgxNjYsImV4cCI6MjA3OTU4NDE2Nn0.k8tyINQe9LLo16zffY1_1gZhwB71EH0vB-wFVsp-xP0";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Helper para obtener cliente de Supabase
function getSupabaseClient() {
  if (supabaseServiceKey) {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Obtener todos los artesanos con sus perfiles y algunos productos
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    // Obtener todos los perfiles de artesanos
    const { data: profiles, error: profilesError } = await supabase
      .from("artisan_profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (profilesError) {
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ artisans: [] }, { status: 200 });
    }

    // Para cada artesano, obtener su nombre y algunos productos activos
    const artisansWithDetails = await Promise.all(
      profiles.map(async (profile: any) => {
        try {
          // Obtener nombre del artesano usando RPC
          let artisanName = null;
          try {
            const { data: name } = await supabase.rpc('get_user_name', {
              user_id_param: profile.user_id
            });
            artisanName = name;
          } catch (e) {
            console.error(`Error al obtener nombre para ${profile.user_id}:`, e);
          }

          // Obtener conteo total de productos activos
          const { count: totalProductsCount } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("user_id", profile.user_id)
            .eq("is_active", true);

          // Obtener algunos productos activos del artesano (máximo 6)
          const { data: products } = await supabase
            .from("products")
            .select("id, name, price, images, category")
            .eq("user_id", profile.user_id)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(6);

          // Obtener promedio de valoraciones del artesano
          let artisanRating = 0;
          try {
            const { data: rating } = await supabase.rpc('get_artisan_rating_avg', {
              artisan_id_param: profile.user_id
            });
            artisanRating = rating ? parseFloat(rating) : 0;
          } catch (e) {
            console.error(`Error al obtener rating para ${profile.user_id}:`, e);
          }

          return {
            user_id: profile.user_id,
            name: artisanName,
            bio: profile.bio,
            region: profile.region,
            ciudad: profile.ciudad,
            specialties: profile.specialties || [],
            certifications: profile.certifications || [],
            avatar_url: profile.avatar_url,
            social_media: profile.social_media || {},
            website: profile.website,
            phone: profile.phone,
            avg_rating: artisanRating,
            products: products || [],
            total_products_count: totalProductsCount || 0,
            created_at: profile.created_at,
          };
        } catch (error) {
          console.error(`Error al procesar artesano ${profile.user_id}:`, error);
          return {
            user_id: profile.user_id,
            name: null,
            bio: profile.bio,
            region: profile.region,
            ciudad: profile.ciudad,
            specialties: profile.specialties || [],
            certifications: profile.certifications || [],
            avatar_url: profile.avatar_url,
            social_media: profile.social_media || {},
            website: profile.website,
            phone: profile.phone,
            avg_rating: 0,
            products: [],
            total_products_count: 0,
            created_at: profile.created_at,
          };
        }
      })
    );

    return NextResponse.json({ artisans: artisansWithDetails }, { status: 200 });
  } catch (error: any) {
    console.error("Error en API artisans:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener artesanos" },
      { status: 500 }
    );
  }
}

