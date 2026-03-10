import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Configuración de Supabase incompleta en el servidor." },
        { status: 500 }
      );
    }

    // Usar service role key para evitar problemas de permisos en Storage
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "La imagen no puede ser mayor a 5MB" },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Supabase Storage (bucket: product-images)
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("[upload-image] Error al subir imagen:", error);

      if (error.message?.includes("Bucket not found") || error.message?.includes("bucket")) {
        return NextResponse.json(
          {
            error:
              "El bucket 'product-images' no existe. Créalo en: Supabase Dashboard → Storage → New bucket → nombre: 'product-images' → activar 'Public bucket'.",
          },
          { status: 500 }
        );
      }

      if (error.message?.includes("not authorized") || error.message?.includes("Unauthorized")) {
        return NextResponse.json(
          { error: "Sin permisos para subir imágenes. Verifica que SUPABASE_SERVICE_ROLE_KEY esté configurado en .env.local" },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: error.message || "Error al subir la imagen" },
        { status: 500 }
      );
    }

    // Obtener URL pública de la imagen
    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    return NextResponse.json(
      { url: urlData.publicUrl, path: filePath },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[upload-image] Error inesperado:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la imagen" },
      { status: 500 }
    );
  }
}
