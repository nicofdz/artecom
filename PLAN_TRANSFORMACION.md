# 📋 PLAN DE TRANSFORMACIÓN
## Marketplace Agrícola → Marketplace de Productos Artesanales Chilenos

---

## ✅ FASE 1: BASE DE DATOS (COMPLETADA)

### Estado: ✅ COMPLETADO

**Tablas creadas:**
- ✅ `artisan_profiles` - Perfiles de artesanos
- ✅ `products` - Productos artesanales
- ✅ `orders` - Pedidos
- ✅ `order_items` - Items de pedidos
- ✅ `reviews` - Reseñas y valoraciones
- ✅ `payments` - Pagos

**Funciones SQL creadas:**
- ✅ `get_user_name()` - Obtener nombre de usuario
- ✅ `get_user_email()` - Obtener email de usuario
- ✅ `get_product_rating_avg()` - Promedio de valoraciones de producto
- ✅ `get_artisan_rating_avg()` - Promedio de valoraciones de artesano
- ✅ `update_updated_at_column()` - Trigger para actualizar timestamps

**Seguridad:**
- ✅ RLS (Row Level Security) configurado en todas las tablas
- ✅ Políticas de seguridad implementadas
- ✅ Índices creados para optimización
- ✅ Sin advertencias de seguridad

**Base de datos:** `https://ckggbmwcbaiyrwiapygv.supabase.co`

---

## 📝 FASE 2: ACTUALIZAR APIS (PENDIENTE)

### 2.1 Eliminar APIs no necesarias
- [ ] Eliminar `app/api/crops/route.ts`
- [ ] Eliminar `app/api/delivery-points/route.ts`
- [ ] Eliminar `app/api/farmer-profile/route.ts`

### 2.2 Crear nuevas APIs
- [ ] `app/api/artisans/route.ts` - CRUD de artesanos
- [ ] `app/api/artisan-profile/route.ts` - Perfil del artesano
- [ ] `app/api/reviews/route.ts` - Sistema de reseñas
- [ ] `app/api/payments/route.ts` - Integración de pagos
- [ ] `app/api/admin/route.ts` - Panel de administración

### 2.3 Modificar APIs existentes
- [ ] `app/api/products/route.ts` - Adaptar a productos artesanales
  - Eliminar campos: `harvest_window`, `price_range`, `availability` (calcular)
  - Agregar campos: `price` (fijo), `images` (array), `materials`, `dimensions`, `weight`
- [ ] `app/api/orders/route.ts` - Adaptar a pedidos artesanales
  - Cambiar `customer_name/email/phone` por `buyer_id`
  - Agregar campos de envío: `shipping_address`, `shipping_city`, `shipping_region`
  - Cambiar estados: `payment_status`, `order_status`
- [ ] `app/api/upload-image/route.ts` - Mantener (útil para productos)

---

## 📁 FASE 3: REORGANIZAR ESTRUCTURA (PENDIENTE)

### 3.1 Renombrar carpetas
- [ ] `app/agricultores/` → `app/artesanos/`
- [ ] `app/productores/` → Eliminar (no aplica)

### 3.2 Crear nuevas páginas
- [ ] `app/artesanos/page.tsx` - Dashboard de artesanos
- [ ] `app/artesanos/perfil/page.tsx` - Perfil del artesano
- [ ] `app/artesanos/productos/page.tsx` - Gestión de productos
- [ ] `app/artesanos/pedidos/page.tsx` - Pedidos recibidos
- [ ] `app/artesanos/resenas/page.tsx` - Ver reseñas recibidas
- [ ] `app/admin/page.tsx` - Panel de administración
- [ ] `app/admin/usuarios/page.tsx` - Gestión de usuarios
- [ ] `app/admin/productos/page.tsx` - Moderación de productos
- [ ] `app/admin/reportes/page.tsx` - Reportes del sistema

### 3.3 Modificar páginas existentes
- [ ] `app/page.tsx` - Cambiar copy de agrícola a artesanal
- [ ] `app/catalogo/page.tsx` - Adaptar filtros (categoría, región, precio, valoración)
- [ ] `app/catalogo/[productId]/page.tsx` - Mostrar detalles, reseñas, valoraciones
- [ ] `app/carrito/page.tsx` - Integrar pasarela de pagos
- [ ] `app/pedidos/page.tsx` - Historial de pedidos del comprador
- [ ] `app/auth/registro/page.tsx` - Cambiar "agricultor/restaurante" por "artesano/comprador"
- [ ] `app/auth/login/page.tsx` - Actualizar textos

### 3.4 Eliminar páginas no necesarias
- [ ] `app/historia/page.tsx` - Evaluar si mantener o eliminar

---

## 🧩 FASE 4: COMPONENTES (PENDIENTE)

### 4.1 Eliminar componentes
- [ ] `app/components/delivery-points-map.tsx`

### 4.2 Crear nuevos componentes
- [ ] `app/components/product-card.tsx` - Tarjeta de producto artesanal
- [ ] `app/components/review-card.tsx` - Mostrar reseñas
- [ ] `app/components/rating-stars.tsx` - Estrellas de valoración
- [ ] `app/components/payment-modal.tsx` - Modal de pago
- [ ] `app/components/filters-sidebar.tsx` - Filtros de búsqueda
- [ ] `app/components/artisan-card.tsx` - Tarjeta de perfil de artesano

### 4.3 Modificar componentes existentes
- [ ] `app/components/product-modal.tsx` - Adaptar a productos artesanales
- [ ] `app/components/top-nav.tsx` - Cambiar enlaces y navegación
- [ ] `app/components/footer.tsx` - Actualizar información
- [ ] `app/components/protected-route.tsx` - Adaptar roles (artesano/comprador/admin)
- [ ] `app/components/auth-provider.tsx` - Actualizar tipos de usuario

---

## 💳 FASE 5: SISTEMA DE PAGOS (PENDIENTE)

### 5.1 Integrar pasarela de pagos
- [ ] Investigar y elegir: Webpay Plus (Transbank) o MercadoPago Chile
- [ ] Crear `app/api/payments/create-payment/route.ts`
- [ ] Crear `app/api/payments/confirm-payment/route.ts`
- [ ] Crear `app/api/payments/webhook/route.ts` (notificaciones)
- [ ] Crear componente de checkout
- [ ] Integrar en flujo de carrito

### 5.2 Configuración
- [ ] Obtener credenciales de la pasarela elegida
- [ ] Configurar variables de entorno
- [ ] Probar en modo sandbox

---

## ⭐ FASE 6: SISTEMA DE VALORACIONES (PENDIENTE)

### 6.1 Funcionalidades
- [ ] Formulario de reseña después de recibir pedido
- [ ] Mostrar promedio de valoraciones por producto
- [ ] Mostrar promedio de valoraciones por artesano
- [ ] Validar que solo compradores que recibieron el producto puedan opinar
- [ ] Permitir editar/eliminar reseñas propias
- [ ] Mostrar reseñas en página de producto
- [ ] Mostrar reseñas en perfil de artesano

---

## 👨‍💼 FASE 7: PANEL DE ADMINISTRACIÓN (PENDIENTE)

### 7.1 Dashboard
- [ ] Métricas generales (ventas, usuarios, productos)
- [ ] Gráficos de ventas por período
- [ ] Top productos más vendidos
- [ ] Top artesanos

### 7.2 Gestión de usuarios
- [ ] Listar usuarios
- [ ] Banear/desbanear usuarios
- [ ] Ver perfil de usuario
- [ ] Ver historial de pedidos de usuario

### 7.3 Moderación de productos
- [ ] Aprobar/rechazar productos nuevos
- [ ] Editar productos
- [ ] Eliminar productos inapropiados

### 7.4 Resolución de disputas
- [ ] Ver pedidos con problemas
- [ ] Contactar comprador/artesano
- [ ] Resolver disputas
- [ ] Procesar reembolsos

### 7.5 Reportes
- [ ] Reportes de ventas
- [ ] Reportes de usuarios
- [ ] Exportar datos

---

## 🎨 FASE 8: TEXTOS Y BRANDING (PENDIENTE)

### 8.1 Cambiar textos
- [ ] "AgroLink" → Nombre del nuevo marketplace
- [ ] "Agricultor" → "Artesano"
- [ ] "Restaurante" → "Comprador"
- [ ] "Productos agrícolas" → "Productos artesanales"
- [ ] Actualizar todos los textos en componentes y páginas

### 8.2 Actualizar imágenes
- [ ] Eliminar fotos de productos agrícolas de `public/`
- [ ] Agregar imágenes de productos artesanales
- [ ] Actualizar favicon si es necesario

### 8.3 Actualizar documentación
- [ ] `README.md` - Nueva documentación
- [ ] `DEPLOY.md` - Actualizar guía de despliegue
- [ ] `package.json` - Cambiar nombre del proyecto

---

## 🔍 FASE 9: FUNCIONALIDADES ADICIONALES (PENDIENTE)

### 9.1 Búsqueda y filtros
- [ ] Búsqueda por nombre, categoría, región
- [ ] Filtros por: precio, valoración, disponibilidad, región
- [ ] Ordenar por: más vendidos, mejor valorados, más recientes, precio

### 9.2 Notificaciones
- [ ] Emails de confirmación de pedido
- [ ] Emails de cambio de estado
- [ ] Notificaciones al artesano de nuevas ventas
- [ ] Notificaciones al comprador de envío

### 9.3 Gestión de envíos
- [ ] Integrar con correos chilenos (opcional)
- [ ] Sistema de seguimiento de envíos
- [ ] Cálculo de costos de envío por región
- [ ] Campo `tracking_number` en orders

---

## 🧪 FASE 10: TESTING Y DEPLOYMENT (PENDIENTE)

### 10.1 Testing
- [ ] Probar flujo completo de compra
- [ ] Probar sistema de pagos en modo sandbox
- [ ] Probar sistema de valoraciones
- [ ] Probar panel de administración
- [ ] Probar permisos y RLS
- [ ] Probar en diferentes navegadores

### 10.2 Deployment
- [ ] Actualizar variables de entorno
- [ ] Verificar que build funciona
- [ ] Desplegar en Vercel
- [ ] Verificar que todo funciona en producción

---

## 📊 RESUMEN DE PROGRESO

- ✅ **Fase 1: Base de datos** - COMPLETADA
- ⏳ **Fase 2: APIs** - PENDIENTE
- ⏳ **Fase 3: Estructura** - PENDIENTE
- ⏳ **Fase 4: Componentes** - PENDIENTE
- ⏳ **Fase 5: Pagos** - PENDIENTE
- ⏳ **Fase 6: Valoraciones** - PENDIENTE
- ⏳ **Fase 7: Admin** - PENDIENTE
- ⏳ **Fase 8: Branding** - PENDIENTE
- ⏳ **Fase 9: Funcionalidades** - PENDIENTE
- ⏳ **Fase 10: Testing** - PENDIENTE

**Progreso total: 10% completado**

---

## 🔗 RECURSOS

- **Base de datos:** https://ckggbmwcbaiyrwiapygv.supabase.co
- **Documentación Supabase:** https://supabase.com/docs
- **Webpay Transbank:** https://www.transbank.cl
- **MercadoPago Chile:** https://www.mercadopago.cl

---

## 📝 NOTAS IMPORTANTES

1. La base de datos está lista y funcionando correctamente
2. Todas las tablas tienen RLS configurado
3. Las funciones SQL están seguras (sin advertencias)
4. El siguiente paso es actualizar las APIs para que funcionen con el nuevo esquema
5. Recordar actualizar los tipos TypeScript cuando se modifiquen las APIs

