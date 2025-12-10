# Guía para Pruebas del Marketplace ArteCom

## Resumen del Sistema

El marketplace ArteCom está completamente funcional con:
- ✅ Sistema de carrito (localStorage)
- ✅ Checkout con dirección de envío
- ✅ Sistema de pagos simulado (Webpay, Transbank, Mercado Pago)
- ✅ Generación de comprobantes
- ✅ Gestión de pedidos para compradores
- ✅ Panel de artesanos para gestionar productos y pedidos
- ✅ Sistema de reseñas

## Crear Cuentas de Prueba

### 1. Crear Cuenta de Comprador

1. Ve a `/auth/registro`
2. Completa el formulario:
   - **Email**: `comprador@test.com` (o cualquier email)
   - **Nombre**: `Comprador Prueba`
   - **Contraseña**: (cualquier contraseña segura)
   - **Tipo de usuario**: Selecciona **"Comprador"**
3. Haz clic en "Registrarse"
4. Serás redirigido al catálogo

### 2. Crear Cuenta de Artesano (Vendedor)

1. Ve a `/auth/registro`
2. Completa el formulario:
   - **Email**: `artesano@test.com` (o cualquier email)
   - **Nombre**: `Artesano Prueba`
   - **Contraseña**: (cualquier contraseña segura)
   - **Tipo de usuario**: Selecciona **"Artesano"**
3. Haz clic en "Registrarse"
4. Ve a `/artesanos/perfil` para completar tu perfil de artesano
5. Ve a `/artesanos` para agregar productos

### 3. Crear Productos de Prueba (Como Artesano)

1. Inicia sesión con la cuenta de artesano
2. Ve a `/artesanos` (o haz clic en "Mis productos" en el menú)
3. Haz clic en "Agregar Producto"
4. Completa el formulario:
   - **Nombre**: Ej: "Jarrón de Cerámica Artesanal"
   - **Descripción**: Ej: "Jarrón hecho a mano con técnicas tradicionales"
   - **Categoría**: Selecciona una (Cerámica, Textil, Joyería, etc.)
   - **Precio**: Ej: `25000`
   - **Stock**: Ej: `10`
   - **Materiales**: Ej: `["Arcilla", "Esmalte"]`
   - **Dimensiones**: Ej: `"20x15x25 cm"`
   - **Peso**: Ej: `1.5`
   - **Imágenes**: Sube al menos una imagen
5. Haz clic en "Guardar Producto"
6. El producto aparecerá en el catálogo público

## Flujo de Compra Completo (Como Comprador)

### Paso 1: Explorar el Catálogo
1. Inicia sesión como comprador
2. Ve a `/catalogo`
3. Explora los productos disponibles
4. Puedes filtrar por categoría, buscar por nombre, etc.

### Paso 2: Agregar Productos al Carrito
1. Haz clic en un producto para ver detalles
2. O directamente desde el catálogo, haz clic en "Agregar al carrito"
3. Puedes ajustar la cantidad
4. El contador del carrito en la navegación se actualizará

### Paso 3: Ver el Carrito
1. Haz clic en "Carrito" en la navegación (o ve a `/carrito`)
2. Revisa los productos agregados
3. Puedes modificar cantidades o eliminar productos
4. Haz clic en "Continuar con checkout"

### Paso 4: Checkout
1. Serás redirigido a `/checkout`
2. **Paso 1 - Productos**: Revisa los productos en el carrito
3. **Paso 2 - Envío**: Completa la dirección de envío:
   - Dirección
   - Ciudad
   - Región
   - Teléfono de contacto
4. **Paso 3 - Pago**: Selecciona método de pago (simulado):
   - Webpay (Simulado)
   - Transbank (Simulado)
   - Mercado Pago (Simulado)
5. Haz clic en "Pagar [monto]"
6. El sistema procesará el pago simulado automáticamente

### Paso 5: Ver Comprobante
1. Después del pago, serás redirigido a `/comprobante/[orderId]`
2. Verás el comprobante de pago con todos los detalles
3. También recibirás un email con el comprobante (si RESEND_API_KEY está configurado)

### Paso 6: Ver Mis Pedidos
1. Ve a `/pedidos` (o haz clic en "Mis pedidos" si eres comprador)
2. Verás todos tus pedidos con su estado
3. Puedes cancelar pedidos en estado "procesando"
4. Cuando un pedido esté "entregado", podrás dejar una reseña

## Flujo de Vendedor (Artesano)

### Ver Pedidos Recibidos
1. Inicia sesión como artesano
2. Ve a `/artesanos/pedidos`
3. Verás todos los pedidos que contienen tus productos
4. Puedes actualizar el estado del pedido:
   - **Procesando**: El pedido está siendo preparado
   - **Enviado**: El pedido ha sido enviado (puedes agregar número de seguimiento)
   - **Entregado**: El pedido fue entregado

### Gestionar Productos
1. Ve a `/artesanos`
2. Verás todos tus productos
3. Puedes:
   - Agregar nuevos productos
   - Editar productos existentes
   - Activar/desactivar productos
   - Ver estadísticas básicas

### Completar Perfil
1. Ve a `/artesanos/perfil`
2. Completa tu información:
   - Biografía
   - Región y ciudad
   - Teléfono
   - Website (opcional)
   - Redes sociales (opcional)
   - Certificaciones (opcional)
   - Especialidades
   - Avatar

## Sistema de Reseñas

### Dejar una Reseña (Como Comprador)
1. Después de que un pedido esté "entregado"
2. Ve a `/pedidos`
3. Haz clic en "Dejar una reseña" en el producto entregado
4. Serás redirigido a la página del producto
5. Completa:
   - Calificación (1-5 estrellas)
   - Comentario (opcional)
6. Haz clic en "Enviar reseña"

### Ver Reseñas
- Las reseñas aparecen en la página de detalle del producto
- Se muestra el promedio de calificaciones
- Los artesanos pueden ver reseñas de sus productos

## Notas Importantes

### Pagos Simulados
- Todos los pagos son **simulados** (no se procesan pagos reales)
- Los pagos siempre se aprueban automáticamente
- Se genera un comprobante con un ID de transacción único

### Stock
- El stock se reduce automáticamente al crear un pedido
- Si cancelas un pedido, el stock se restaura automáticamente
- No puedes comprar más productos de los disponibles en stock

### Emails
- Los emails solo se envían si `RESEND_API_KEY` está configurado
- Si no está configurado, los emails se muestran en la consola del servidor

### Service Role Key
- Para que el panel de administración funcione correctamente, necesitas configurar `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`
- Sin esto, puede haber errores de recursión en RLS

## Solución de Problemas

### El carrito está vacío
- Verifica que estés logueado
- Los productos se guardan en localStorage del navegador
- Si cambias de navegador o limpias el cache, perderás el carrito

### No puedo ver pedidos
- Verifica que el Service Role Key esté configurado
- Verifica que tengas permisos (comprador ve sus pedidos, artesano ve pedidos con sus productos)

### Error al procesar pago
- Verifica que todos los campos de envío estén completos
- Verifica que haya stock suficiente
- Revisa la consola del navegador para ver errores específicos

## Datos de Prueba Sugeridos

### Productos de Ejemplo
- **Cerámica**: Jarrón, Taza, Plato decorativo
- **Textil**: Chal, Manta, Bolso
- **Joyería**: Collar, Pulsera, Aretes
- **Madera**: Cuchara, Tabla, Caja decorativa
- **Cuero**: Billetera, Cinturón, Bolso

### Precios Sugeridos
- Productos pequeños: $5,000 - $15,000
- Productos medianos: $15,000 - $50,000
- Productos grandes: $50,000 - $150,000

### Direcciones de Prueba
- Dirección: "Av. Principal 123"
- Ciudad: "Santiago" (o cualquier ciudad)
- Región: Cualquier región de Chile
- Teléfono: "+56912345678"



