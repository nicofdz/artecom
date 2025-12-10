import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase as adminSupabase } from "../../lib/supabase";

// Obtener perfil del comprador
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
      .from("buyer_profiles")
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

// Crear o actualizar perfil del comprador
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      phone,
      shipping_addresses,
      preferences,
      navigation_history,
      search_history,
      favorite_artisans,
      favorite_products,
      notification_preferences,
      avatar_url,
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id es requerido" },
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
      .from("buyer_profiles")
      .select("id")
      .eq("user_id", user_id)
      .maybeSingle();

    let result;
    if (existingProfile) {
      // Actualizar perfil existente
      const updateData: any = {};

      if (phone !== undefined) updateData.phone = phone || null;
      if (shipping_addresses !== undefined) updateData.shipping_addresses = shipping_addresses || [];
      if (preferences !== undefined) updateData.preferences = preferences || {};
      if (navigation_history !== undefined) updateData.navigation_history = navigation_history || [];
      if (search_history !== undefined) updateData.search_history = search_history || [];
      if (favorite_artisans !== undefined) updateData.favorite_artisans = favorite_artisans || [];
      if (favorite_products !== undefined) updateData.favorite_products = favorite_products || [];
      if (notification_preferences !== undefined) updateData.notification_preferences = notification_preferences || {};
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

      const { data, error } = await supabaseClient
        .from("buyer_profiles")
        .update(updateData)
        .eq("user_id", user_id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Crear nuevo perfil
      const { data, error } = await supabaseClient
        .from("buyer_profiles")
        .insert([
          {
            user_id,
            phone: phone || null,
            shipping_addresses: shipping_addresses || [],
            preferences: preferences || {
              favorite_categories: [],
              price_range: { min: null, max: null },
              materials: [],
              regions: [],
            },
            navigation_history: navigation_history || [],
            search_history: search_history || [],
            favorite_artisans: favorite_artisans || [],
            favorite_products: favorite_products || [],
            notification_preferences: notification_preferences || {
              email: true,
              new_products: true,
              order_updates: true,
              promotions: false,
            },
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

// Agregar dirección de envío
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, action, data: actionData } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id es requerido" },
        { status: 400 }
      );
    }

    // Obtener perfil actual
    let { data: profile, error: fetchError } = await adminSupabase
      .from("buyer_profiles")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError;
    }

    // Si no existe perfil, crearlo primero
    if (!profile) {
      const { data: newProfile, error: createError } = await adminSupabase
        .from("buyer_profiles")
        .insert([{ user_id }])
        .select()
        .single();

      if (createError) throw createError;
      profile = newProfile;
    }

    let updatedData: any = {};

    if (action === "add_shipping_address") {
      const addresses = profile.shipping_addresses || [];
      addresses.push(actionData);
      updatedData.shipping_addresses = addresses;
    } else if (action === "remove_shipping_address") {
      const addresses = profile.shipping_addresses || [];
      updatedData.shipping_addresses = addresses.filter(
        (addr: any, index: number) => index !== actionData.index
      );
    } else if (action === "add_favorite_product") {
      const favorites = profile.favorite_products || [];
      if (!favorites.includes(actionData.product_id)) {
        favorites.push(actionData.product_id);
      }
      updatedData.favorite_products = favorites;
    } else if (action === "remove_favorite_product") {
      const favorites = profile.favorite_products || [];
      updatedData.favorite_products = favorites.filter(
        (id: string) => id !== actionData.product_id
      );
    } else if (action === "add_favorite_artisan") {
      const favorites = profile.favorite_artisans || [];
      if (!favorites.includes(actionData.artisan_id)) {
        favorites.push(actionData.artisan_id);
      }
      updatedData.favorite_artisans = favorites;
    } else if (action === "remove_favorite_artisan") {
      const favorites = profile.favorite_artisans || [];
      updatedData.favorite_artisans = favorites.filter(
        (id: string) => id !== actionData.artisan_id
      );
    } else if (action === "add_to_search_history") {
      const history = profile.search_history || [];
      history.unshift(actionData.query);
      // Mantener solo los últimos 50
      updatedData.search_history = history.slice(0, 50);
    } else if (action === "add_to_navigation_history") {
      const history = profile.navigation_history || [];
      history.unshift({
        product_id: actionData.product_id,
        category: actionData.category,
        timestamp: new Date().toISOString(),
      });
      // Mantener solo los últimos 100
      updatedData.navigation_history = history.slice(0, 100);
    } else if (action === "update_preferences") {
      updatedData.preferences = {
        ...profile.preferences,
        ...actionData,
      };
    } else if (action === "update_notification_preferences") {
      updatedData.notification_preferences = {
        ...profile.notification_preferences,
        ...actionData,
      };
    } else {
      return NextResponse.json(
        { error: "Acción no válida" },
        { status: 400 }
      );
    }

    const { data, error } = await adminSupabase
      .from("buyer_profiles")
      .update(updatedData)
      .eq("user_id", user_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al actualizar perfil" },
      { status: 500 }
    );
  }
}

