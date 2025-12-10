// Script para crear usuarios de prueba
// Ejecutar con: npx tsx scripts/create-test-users.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ckggbmwcbaiyrwiapygv.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error("❌ ERROR: SUPABASE_SERVICE_ROLE_KEY no está configurado en .env.local");
  console.log("Por favor, agrega SUPABASE_SERVICE_ROLE_KEY a tu archivo .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  console.log("🚀 Creando usuarios de prueba...\n");

  // 1. Crear usuario comprador
  console.log("📝 Creando cuenta de COMPRADOR...");
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
        console.log("⚠️  El comprador ya existe, omitiendo...");
      } else {
        throw buyerError;
      }
    } else {
      console.log("✅ Comprador creado:");
      console.log(`   Email: comprador@test.com`);
      console.log(`   Contraseña: comprador123`);
      console.log(`   ID: ${buyerData.user?.id}\n`);

      // Crear perfil de comprador
      const { error: profileError } = await supabase
        .from("buyer_profiles")
        .upsert({
          user_id: buyerData.user?.id,
          phone: "+56912345678",
          shipping_addresses: [
            {
              id: crypto.randomUUID(),
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

      if (profileError && !profileError.message.includes("duplicate")) {
        console.log("⚠️  Error al crear perfil de comprador:", profileError.message);
      } else {
        console.log("✅ Perfil de comprador creado\n");
      }
    }
  } catch (error: any) {
    console.error("❌ Error al crear comprador:", error.message);
  }

  // 2. Crear usuario artesano
  console.log("📝 Creando cuenta de ARTESANO...");
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
        console.log("⚠️  El artesano ya existe, omitiendo...");
      } else {
        throw artisanError;
      }
    } else {
      console.log("✅ Artesano creado:");
      console.log(`   Email: artesano@test.com`);
      console.log(`   Contraseña: artesano123`);
      console.log(`   ID: ${artisanData.user?.id}\n`);

      // Crear perfil de artesano
      const { error: profileError } = await supabase
        .from("artisan_profiles")
        .upsert({
          user_id: artisanData.user?.id,
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

      if (profileError && !profileError.message.includes("duplicate")) {
        console.log("⚠️  Error al crear perfil de artesano:", profileError.message);
      } else {
        console.log("✅ Perfil de artesano creado\n");
      }
    }
  } catch (error: any) {
    console.error("❌ Error al crear artesano:", error.message);
  }

  console.log("\n✨ ¡Usuarios de prueba creados exitosamente!");
  console.log("\n📋 Credenciales:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("COMPRADOR:");
  console.log("  Email: comprador@test.com");
  console.log("  Contraseña: comprador123");
  console.log("\nARTESANO:");
  console.log("  Email: artesano@test.com");
  console.log("  Contraseña: artesano123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

createTestUsers().catch(console.error);



