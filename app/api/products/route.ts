import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ckggbmwcbaiyrwiapygv.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrZ2dibXdjYmFpeXJ3aWFweWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDgxNjYsImV4cCI6MjA3OTU4NDE2Nn0.k8tyINQe9LLo16zffY1_1gZhwB71EH0vB-wFVsp-xP0";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Helper para obtener cliente de Supabase con autenticación
function getSupabaseClient(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  // Si hay service key, usarlo para bypass RLS
  if (supabaseServiceKey) {
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  // Si hay token de usuario, usarlo
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }

  // Cliente anónimo por defecto
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const category = searchParams.get("category");
    const onlyActive = searchParams.get("only_active") === "true";
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const id = searchParams.get("id"); // ID individual de producto
    const idsParam = searchParams.get("ids");
    const search = searchParams.get("search"); // Búsqueda por texto
    const region = searchParams.get("region"); // Filtro por región
    const material = searchParams.get("material"); // Filtro por material
    const sortBy = searchParams.get("sort_by") || "recent"; // Ordenamiento: recent, price_asc, price_desc, rating, sold
    const sortOrder = searchParams.get("sort_order") || "desc"; // asc o desc
    const recommendFor = searchParams.get("recommend_for"); // ID de producto para obtener recomendaciones

    // Si se solicitan recomendaciones para un producto
    if (recommendFor) {
      const { data: currentProduct } = await supabase
        .from("products")
        .select("user_id, category")
        .eq("id", recommendFor)
        .single();

      if (currentProduct && currentProduct.category) {
        // Obtener productos de la misma categoría primero
        const { data: categoryProducts } = await supabase
          .from("products")
          .select("*")
          .eq("category", currentProduct.category)
          .neq("id", recommendFor)
          .limit(6);

        // Si hay menos de 6, completar con productos aleatorios
        if (categoryProducts && categoryProducts.length < 6) {
          const { data: randomProducts } = await supabase
            .from("products")
            .select("*")
            .neq("id", recommendFor)
            .limit(6 - categoryProducts.length);

          const combined = [...(categoryProducts || []), ...(randomProducts || [])];
          return NextResponse.json(combined);
        }

        return NextResponse.json(categoryProducts || []);
      }

      // Si no hay categoría, devolver productos aleatorios
      const { data: randomProducts } = await supabase
        .from("products")
        .select("*")
        .neq("id", recommendFor)
        .limit(6);

      return NextResponse.json(randomProducts || []);
    }

    // Si hay filtro por región, primero obtener los user_ids de artesanos en esa región
    let artisanUserIds: string[] | null = null;
    if (region) {
      const { data: profiles, error: profileError } = await supabase
        .from("artisan_profiles")
        .select("user_id")
        .eq("region", region);

      if (profileError) {
        console.error("Error al obtener perfiles por región:", profileError);
      } else if (profiles && profiles.length > 0) {
        artisanUserIds = profiles.map((p: any) => p.user_id);
      } else {
        // No hay artesanos en esa región, retornar array vacío
        return NextResponse.json([], { status: 200 });
      }
    }

    // Construir query de productos
    let query = supabase
      .from("products")
      .select("*");

    // Filtrar por ID individual si se proporciona
    if (id) {
      query = query.eq("id", id);
    }
    // Filtrar por IDs múltiples si se proporciona (para carrito/checkout)
    else if (idsParam) {
      const ids = idsParam.split(',').filter(id => id.trim() !== '');
      if (ids.length > 0) {
        query = query.in("id", ids);
      }
    }

    // Filtrar por usuario si se proporciona
    if (userId) {
      query = query.eq("user_id", userId);
    } else if (artisanUserIds && artisanUserIds.length > 0) {
      // Filtrar por user_ids de artesanos en la región
      query = query.in("user_id", artisanUserIds);
    }

    // Filtrar por categoría
    if (category) {
      query = query.eq("category", category);
    }

    // Filtrar solo activos si se solicita
    if (onlyActive) {
      query = query.eq("is_active", true);
    }

    // Filtrar por precio mínimo
    if (minPrice) {
      query = query.gte("price", parseFloat(minPrice));
    }

    // Filtrar por precio máximo
    if (maxPrice) {
      query = query.lte("price", parseFloat(maxPrice));
    }

    // Filtrar por material (buscar en el array de materials)
    if (material) {
      query = query.contains("materials", [material]);
    }

    // Búsqueda por texto (nombre, descripción, categoría)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
    }

    // Aplicar ordenamiento
    let orderColumn = "created_at";
    let ascending = false;

    switch (sortBy) {
      case "price_asc":
        orderColumn = "price";
        ascending = true;
        break;
      case "price_desc":
        orderColumn = "price";
        ascending = false;
        break;
      case "recent":
        orderColumn = "created_at";
        ascending = false;
        break;
      case "rating":
        // Para rating, ordenaremos después de obtener los datos
        orderColumn = "created_at";
        ascending = false;
        break;
      case "sold":
        // Para más vendidos, necesitaríamos contar order_items
        // Por ahora, ordenamos por created_at
        orderColumn = "created_at";
        ascending = false;
        break;
      default:
        orderColumn = "created_at";
        ascending = sortOrder === "asc";
    }

    const { data, error } = await query.order(orderColumn, { ascending });

    if (error) throw error;

    // Obtener nombres de los artesanos, valoraciones promedio y datos del perfil para cada producto
    if (data && data.length > 0) {
      const productsWithDetails = await Promise.all(
        data.map(async (product: any) => {
          if (product.user_id) {
            try {
              // Obtener nombre del artesano
              const { data: artisanName, error: nameError } = await supabase.rpc('get_user_name', {
                user_id_param: product.user_id
              });

              if (!nameError && artisanName) {
                product.artisan_name = artisanName;
              } else {
                product.artisan_name = null;
              }

              // Obtener cantidad de reseñas primero
              const { count: reviewsCount } = await supabase
                .from("reviews")
                .select("id", { count: "exact", head: true })
                .eq("product_id", product.id);

              product.reviews_count = reviewsCount || 0;

              // Obtener promedio de valoraciones solo si hay reseñas
              if (product.reviews_count > 0) {
                const { data: avgRating, error: ratingError } = await supabase.rpc('get_product_rating_avg', {
                  product_id_param: product.id
                });

                if (!ratingError && avgRating !== null) {
                  product.avg_rating = parseFloat(avgRating);
                } else {
                  product.avg_rating = null;
                }
              } else {
                product.avg_rating = null;
              }

              // Obtener perfil del artesano
              const { data: artisanProfile } = await supabase
                .from("artisan_profiles")
                .select("region, ciudad, specialties")
                .eq("user_id", product.user_id)
                .single();

              if (artisanProfile) {
                product.artisan_profiles = {
                  region: artisanProfile.region,
                  ciudad: artisanProfile.ciudad,
                  specialties: artisanProfile.specialties || []
                };
              } else {
                product.artisan_profiles = null;
              }
            } catch (e) {
              console.error(`[PRODUCTS] Error al obtener detalles para producto ${product.name}:`, e);
              product.artisan_name = null;
              product.avg_rating = null;
              product.reviews_count = 0;
              product.artisan_profiles = null;
            }
          } else {
            product.artisan_name = null;
            product.avg_rating = null;
            product.reviews_count = 0;
            product.artisan_profiles = null;
          }
          return product;
        })
      );

      // Ordenar por rating si se solicitó
      if (sortBy === "rating") {
        productsWithDetails.sort((a, b) => {
          const ratingA = a.avg_rating || 0;
          const ratingB = b.avg_rating || 0;
          return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
        });
      }

      // Ordenar por más vendidos si se solicitó (por ahora por reviews_count como proxy)
      if (sortBy === "sold") {
        productsWithDetails.sort((a, b) => {
          const soldA = a.reviews_count || 0;
          const soldB = b.reviews_count || 0;
          return sortOrder === "asc" ? soldA - soldB : soldB - soldA;
        });
      }

      return NextResponse.json(productsWithDetails, { status: 200 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener productos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    const body = await request.json();
    const {
      user_id,
      name,
      description,
      category,
      price,
      stock = 0,
      images = [],
      materials = [],
      dimensions,
      weight,
      is_active = true
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id es requerido" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "name es requerido" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "category es requerida" },
        { status: 400 }
      );
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: "price es requerido y debe ser mayor a 0" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          user_id,
          name,
          description: description || null,
          category,
          price: parseFloat(price),
          stock: stock || 0,
          images: Array.isArray(images) ? images : [],
          materials: Array.isArray(materials) ? materials : [],
          dimensions: dimensions || null,
          weight: weight ? parseFloat(weight) : null,
          is_active: is_active !== undefined ? is_active : true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al crear producto" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    const body = await request.json();
    const {
      id,
      user_id,
      name,
      description,
      category,
      price,
      stock,
      images,
      materials,
      dimensions,
      weight,
      is_active
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de producto es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el producto pertenece al usuario si se proporciona user_id
    if (user_id) {
      const { data: existingProduct, error: checkError } = await supabase
        .from("products")
        .select("user_id")
        .eq("id", id)
        .single();

      if (checkError) throw checkError;

      if (existingProduct?.user_id !== user_id) {
        return NextResponse.json(
          { error: "No tienes permiso para modificar este producto" },
          { status: 403 }
        );
      }
    }

    // Validar precio si se proporciona
    if (price !== undefined && price <= 0) {
      return NextResponse.json(
        { error: "price debe ser mayor a 0" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (stock !== undefined) updateData.stock = stock;
    if (images !== undefined) updateData.images = Array.isArray(images) ? images : [];
    if (materials !== undefined) updateData.materials = Array.isArray(materials) ? materials : [];
    if (dimensions !== undefined) updateData.dimensions = dimensions;
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al actualizar producto" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("user_id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de producto requerido" },
        { status: 400 }
      );
    }

    // Verificar que el producto pertenece al usuario si se proporciona user_id
    if (userId) {
      const { data: existingProduct, error: checkError } = await supabase
        .from("products")
        .select("user_id")
        .eq("id", id)
        .single();

      if (checkError) throw checkError;

      if (existingProduct?.user_id !== userId) {
        return NextResponse.json(
          { error: "No tienes permiso para eliminar este producto" },
          { status: 403 }
        );
      }
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al eliminar producto" },
      { status: 500 }
    );
  }
}

