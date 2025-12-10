import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("product_id");

        if (!productId) {
            return NextResponse.json(
                { error: "product_id es requerido" },
                { status: 400 }
            );
        }

        // Obtener información del producto actual
        const { data: currentProduct, error: currentError } = await supabase
            .from("products")
            .select("artisan_id, category")
            .eq("id", productId)
            .single();

        if (currentError || !currentProduct) {
            return NextResponse.json(
                { error: "Producto no encontrado" },
                { status: 404 }
            );
        }

        const { artisan_id, category } = currentProduct;

        // Productos del mismo artesano
        const { data: sameArtisanProducts } = await supabase
            .from("products")
            .select("id, name, category, price, images, stock, artisan_id")
            .eq("artisan_id", artisan_id)
            .eq("status", "active")
            .gt("stock", 0)
            .neq("id", productId)
            .limit(3);

        // Productos de la misma categoría
        const { data: sameCategoryProducts } = await supabase
            .from("products")
            .select("id, name, category, price, images, stock, artisan_id")
            .eq("category", category)
            .eq("status", "active")
            .gt("stock", 0)
            .neq("id", productId)
            .neq("artisan_id", artisan_id)
            .limit(3);

        // Combinar recomendaciones
        let recommendations = [
            ...(sameArtisanProducts || []),
            ...(sameCategoryProducts || []),
        ];

        // Si no hay suficientes, agregar productos aleatorios
        if (recommendations.length < 4) {
            const { data: randomProducts } = await supabase
                .from("products")
                .select("id, name, category, price, images, stock, artisan_id")
                .eq("status", "active")
                .gt("stock", 0)
                .neq("id", productId)
                .limit(6);

            recommendations = [
                ...recommendations,
                ...(randomProducts || []),
            ];
        }

        // Limitar a 6 y mezclar
        const shuffled = recommendations
            .slice(0, 6)
            .sort(() => Math.random() - 0.5);

        return NextResponse.json({ recommendations: shuffled });
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        return NextResponse.json(
            { error: "Error al obtener recomendaciones" },
            { status: 500 }
        );
    }
}
