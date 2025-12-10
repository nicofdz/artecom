import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ckggbmwcbaiyrwiapygv.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Crear usuarios de prueba
export async function POST(request: NextRequest) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY no está configurado" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const results: any = {};

    // 1. Crear comprador
    try {
      const { data: buyerData, error: buyerError } = await supabase.auth.admin.createUser({
        email: "comprador@test.com",
        password: "comprador123",
        email_confirm: true,
        user_metadata: {
          name: "Comprador Prueba",
          user_type: "comprador",
          phone: "+56912345678"
        }
      });

      if (buyerError) {
        if (buyerError.message.includes("already registered")) {
          results.buyer = { exists: true, message: "El comprador ya existe" };
        } else {
          throw buyerError;
        }
      } else {
        results.buyer = {
          created: true,
          email: "comprador@test.com",
          password: "comprador123",
          id: buyerData.user?.id
        };

        // Crear perfil de comprador
        if (buyerData.user?.id) {
          await supabase
            .from("buyer_profiles")
            .upsert({
              user_id: buyerData.user.id,
              phone: "+56912345678",
              shipping_addresses: [
                {
                  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  address: "Av. Principal 123",
                  city: "Santiago",
                  region: "Metropolitana de Santiago",
                  is_default: true
                }
              ],
              preferences: {
                favorite_categories: ["Cerámica", "Textil"],
                price_range_min: 10000,
                price_range_max: 50000
              },
              notification_preferences: {
                email_new_products: true,
                email_order_updates: true,
                email_promotions: false
              }
            });
        }
      }
    } catch (error: any) {
      results.buyer = { error: error.message };
    }

    // 2. Crear artesano
    try {
      const { data: artisanData, error: artisanError } = await supabase.auth.admin.createUser({
        email: "artesano@test.com",
        password: "artesano123",
        email_confirm: true,
        user_metadata: {
          name: "Artesano Prueba",
          user_type: "artesano",
          phone: "+56987654321"
        }
      });

      if (artisanError) {
        if (artisanError.message.includes("already registered")) {
          results.artisan = { exists: true, message: "El artesano ya existe" };
        } else {
          throw artisanError;
        }
      } else {
        results.artisan = {
          created: true,
          email: "artesano@test.com",
          password: "artesano123",
          id: artisanData.user?.id
        };

        // Crear perfil de artesano
        if (artisanData.user?.id) {
          await supabase
            .from("artisan_profiles")
            .upsert({
              user_id: artisanData.user.id,
              bio: "Artesano especializado en cerámica y textiles tradicionales chilenos",
              region: "Metropolitana de Santiago",
              ciudad: "Santiago",
              phone: "+56987654321",
              specialties: ["Cerámica", "Textil"],
              certifications: ["Certificación Artesanal"],
              social_media: {
                instagram: "@artesano_prueba",
                facebook: "Artesano Prueba"
              }
            });
        }
      }
    } catch (error: any) {
      results.artisan = { error: error.message };
    }

    return NextResponse.json({
      success: true,
      message: "Usuarios de prueba creados",
      results
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al crear usuarios de prueba" },
      { status: 500 }
    );
  }
}

