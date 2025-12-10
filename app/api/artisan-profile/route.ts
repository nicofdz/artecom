import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase as adminSupabase } from "../../lib/supabase";

// Obtener perfil del artesano
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id es requerido" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("Authorization");
    let supabaseClient = adminSupabase;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
    }

    const { data, error } = await supabaseClient
      .from("artisan_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw error;
    }

    // Si no existe perfil, devolver null
    return NextResponse.json(data || null, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener perfil" },
      { status: 500 }
    );
  }
}

// Crear o actualizar perfil del artesano
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      bio,
      region,
      ciudad,
      phone,
      website,
      social_media,
      certifications,
      specialties,
      avatar_url,
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id es requerido" },
        { status: 400 }
      );
    }

    if (!region) {
      return NextResponse.json(
        { error: "region es requerida" },
        { status: 400 }
      );
    }

    // Crear cliente autenticado si hay token
    const authHeader = request.headers.get("Authorization");
    let supabaseClient = adminSupabase;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
    }

    // Verificar si el perfil ya existe
    const { data: existingProfile } = await supabaseClient
      .from("artisan_profiles")
      .select("id")
      .eq("user_id", user_id)
      .maybeSingle();

    let result;
    if (existingProfile) {
      // Actualizar perfil existente
      const { data, error } = await supabaseClient
        .from("artisan_profiles")
        .update({
          bio: bio || null,
          region,
          ciudad: ciudad || null,
          phone: phone || null,
          website: website || null,
          social_media: social_media || {},
          certifications: certifications || [],
          specialties: specialties || [],
          avatar_url: avatar_url || null,
        })
        .eq("user_id", user_id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Crear nuevo perfil
      const { data, error } = await supabaseClient
        .from("artisan_profiles")
        .insert([
          {
            user_id,
            bio: bio || null,
            region,
            ciudad: ciudad || null,
            phone: phone || null,
            website: website || null,
            social_media: social_media || {},
            certifications: certifications || [],
            specialties: specialties || [],
            avatar_url: avatar_url || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al guardar perfil" },
      { status: 500 }
    );
  }
}

