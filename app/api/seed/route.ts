import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Datos de prueba para Compradores
const BUYERS = [
    {
        email: "comprador1@test.com",
        password: "password123",
        name: "Ana García",
        phone: "+56911111111",
        region: "Metropolitana",
        city: "Santiago",
        address: "Av. Providencia 1234",
    },
    {
        email: "comprador2@test.com",
        password: "password123",
        name: "Carlos López",
        phone: "+56922222222",
        region: "Valparaíso",
        city: "Viña del Mar",
        address: "Calle Valparaíso 567",
    },
    {
        email: "comprador3@test.com",
        password: "password123",
        name: "María Rodríguez",
        phone: "+56933333333",
        region: "Biobío",
        city: "Concepción",
        address: "O'Higgins 890",
    },
    {
        email: "comprador4@test.com",
        password: "password123",
        name: "Pedro Martínez",
        phone: "+56944444444",
        region: "Los Lagos",
        city: "Puerto Montt",
        address: "Costanera 101",
    },
];

// Datos de prueba para Artesanos
const ARTISANS = [
    {
        email: "artesano1@test.com",
        password: "password123",
        name: "Juan Pérez",
        bio: "Artesano experto en madera nativa del sur de Chile.",
        region: "La Araucanía",
        ciudad: "Temuco",
        specialties: ["Madera", "Muebles"],
    },
    {
        email: "artesano2@test.com",
        password: "password123",
        name: "Elena Torres",
        bio: "Tejedora tradicional de lana de oveja.",
        region: "Los Lagos",
        ciudad: "Chiloé",
        specialties: ["Textil", "Lana"],
    },
    {
        email: "artesano3@test.com",
        password: "password123",
        name: "Roberto Díaz",
        bio: "Ceramista contemporáneo con técnicas ancestrales.",
        region: "Metropolitana",
        ciudad: "Pomaire",
        specialties: ["Cerámica", "Greda"],
    },
    {
        email: "artesano4@test.com",
        password: "password123",
        name: "Laura Silva",
        bio: "Orfebre especializada en plata y lapislázuli.",
        region: "Coquimbo",
        ciudad: "La Serena",
        specialties: ["Joyería", "Plata"],
    },
];

export async function POST(request: NextRequest) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
        return new NextResponse("Error: Falta configuración de Supabase (SERVICE_ROLE_KEY)", {
            status: 500,
        });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
        async start(controller) {
            const log = (msg: string) => {
                controller.enqueue(encoder.encode(msg + "\n"));
            };

            try {
                log("Iniciando generación de datos...");

                // 1. Crear Compradores
                log("--- Creando Compradores ---");
                for (const buyer of BUYERS) {
                    log(`Procesando: ${buyer.email}`);

                    // Crear usuario Auth
                    let userId = null;
                    // Buscar si existe por email primero para evitar error
                    // Nota: admin.createUser no falla si existe? Verificar docs.
                    // Mejor intentar crear y catch error o listar usuarios.
                    // Por simplicidad, intentamos crear.

                    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
                        email: buyer.email,
                        password: buyer.password,
                        email_confirm: true,
                        user_metadata: {
                            full_name: buyer.name,
                            name: buyer.name,
                            user_type: "comprador",
                        },
                    });

                    if (userError) {
                        // Si ya existe, tratamos de obtener su ID (implementación simple)
                        log(`  Info: Usuario auth podría ya existir o error: ${userError.message}`);
                        // En un caso real buscaríamos el usuario, pero aquí asumiremos que si falla es porque existe
                        // Y trataremos de buscarlo (opcional, o simplemente saltar)
                        // Para simplificar este script, si falla la creación, saltamos al siguiente.
                        // O mejor: listamos usuarios por email para obtener el ID si existe.
                        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
                        const existing = listData.users.find(u => u.email === buyer.email);
                        if (existing) userId = existing.id;
                    } else {
                        userId = userData.user.id;
                        log(`  Usuario Auth creado: ${userId}`);
                    }

                    if (userId) {
                        // Verificar si perfil existe
                        const { data: profileCheck } = await supabaseAdmin
                            .from("buyer_profiles")
                            .select("id")
                            .eq("user_id", userId)
                            .maybeSingle();

                        if (!profileCheck) {
                            const { error: profileError } = await supabaseAdmin
                                .from("buyer_profiles")
                                .insert([{
                                    user_id: userId,
                                    phone: buyer.phone,
                                    shipping_addresses: [{
                                        address: buyer.address,
                                        city: buyer.city,
                                        region: buyer.region,
                                        phone: buyer.phone,
                                        is_default: true
                                    }],
                                    preferences: {
                                        favorite_categories: [],
                                        price_range: { min: null, max: null },
                                        materials: [],
                                        regions: [buyer.region]
                                    },
                                    notification_preferences: {
                                        email: true,
                                        new_products: true,
                                        order_updates: true,
                                        promotions: false
                                    },
                                    avatar_url: null
                                }]);

                            if (profileError) log(`  Error creando perfil: ${profileError.message}`);
                            else log("  Perfil de comprador creado correctamente.");
                        } else {
                            log("  Perfil ya existe, saltando inserción.");
                        }
                    }
                }

                // 2. Crear Artesanos
                log("\n--- Creando Artesanos ---");
                for (const artisan of ARTISANS) {
                    log(`Procesando: ${artisan.email}`);

                    let userId = null;
                    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
                        email: artisan.email,
                        password: artisan.password,
                        email_confirm: true,
                        user_metadata: {
                            full_name: artisan.name,
                            name: artisan.name,
                            user_type: "artesano",
                        },
                    });

                    if (userError) {
                        log(`  Info: Usuario auth podría ya existir o error: ${userError.message}`);
                        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
                        const existing = listData.users.find(u => u.email === artisan.email);
                        if (existing) userId = existing.id;
                    } else {
                        userId = userData.user.id;
                        log(`  Usuario Auth creado: ${userId}`);
                    }

                    if (userId) {
                        // Verificar si perfil existe
                        const { data: profileCheck } = await supabaseAdmin
                            .from("artisan_profiles")
                            .select("id")
                            .eq("user_id", userId)
                            .maybeSingle();

                        if (!profileCheck) {
                            const { error: profileError } = await supabaseAdmin
                                .from("artisan_profiles")
                                .insert([{
                                    user_id: userId,
                                    bio: artisan.bio,
                                    region: artisan.region,
                                    ciudad: artisan.ciudad,
                                    specialties: artisan.specialties,
                                    avatar_url: null
                                }]);

                            if (profileError) log(`  Error creando perfil: ${profileError.message}`);
                            else log("  Perfil de artesano creado correctamente.");
                        } else {
                            log("  Perfil ya existe, saltando inserción.");
                        }
                    }
                }

                log("\n--- Proceso Finalizado Exitosamente ---");
                controller.close();
            } catch (e: any) {
                log(`\nError fatal: ${e.message}`);
                controller.close();
            }
        },
    });

    return new NextResponse(readable, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
}
