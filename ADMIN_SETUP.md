# Configuración del Panel de Administración

## Problema de Recursión en RLS

Las políticas RLS (Row Level Security) para administradores causan recursión infinita cuando intentan acceder a la tabla `orders` porque:

1. Las políticas de `order_items` consultan `orders`
2. Las políticas de `orders` consultan `order_items` (para artesanos)
3. Esto crea un ciclo de recursión

## Solución: Service Role Key

Para evitar este problema, el panel de administración usa el **Service Role Key** de Supabase, que omite completamente RLS.

### Configuración

1. Obtén tu Service Role Key desde el dashboard de Supabase:
   - Ve a tu proyecto en https://supabase.com
   - Settings → API
   - Copia el "service_role" key (NO el "anon" key)

2. Agrega la variable de entorno en tu archivo `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
   ```

3. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

### Verificación

Una vez configurado, el panel de administración debería funcionar sin errores de recursión. El service role key permite que la API de admin acceda a todas las tablas sin restricciones RLS.

### Nota de Seguridad

⚠️ **IMPORTANTE**: El Service Role Key tiene acceso completo a tu base de datos y omite todas las políticas RLS. NUNCA lo expongas en el frontend o en código del cliente. Solo debe usarse en rutas API del servidor.


