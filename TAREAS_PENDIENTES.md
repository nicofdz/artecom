# 📋 LISTA DE TAREAS PENDIENTES

**Fecha de actualización:** Diciembre 2024  
**Proyecto:** Marketplace Artesanal - ArteCom

---

## 🔴 PRIORIDAD ALTA

### 1. Panel de Administración - Funcionalidades Avanzadas
**Estado actual:** Dashboard básico implementado

**Falta implementar:**
- [ ] **Gestión avanzada de usuarios:**
  - [ ] Banear/desbanear usuarios
  - [ ] Ver historial completo de usuario (todos sus pedidos, reseñas, etc.)
  - [ ] Editar información de usuario directamente
  - [ ] Cambiar roles de usuario (artesano ↔ comprador)
  
- [ ] **Moderación de productos:**
  - [ ] Aprobar/rechazar productos nuevos antes de publicarlos
  - [ ] Editar productos de cualquier artesano
  - [ ] Eliminar productos inapropiados con motivo
  - [ ] Marcar productos como destacados
  
- [ ] **Reportes y estadísticas avanzadas:**
  - [ ] Gráficos de ventas por período (diario, semanal, mensual)
  - [ ] Top productos más vendidos con gráficos
  - [ ] Top artesanos por ventas e ingresos
  - [ ] Ingresos por período con desglose
  - [ ] Exportar datos a CSV/Excel
  
- [ ] **Sistema de disputas:**
  - [ ] Ver pedidos con problemas o reclamos
  - [ ] Contactar comprador/artesano desde el panel
  - [ ] Procesar reembolsos manualmente
  - [ ] Marcar disputas como resueltas
  - [ ] Historial de disputas

**Archivos a modificar:**
- `app/admin/page.tsx` - Expandir funcionalidades
- `app/api/admin/route.ts` - Agregar nuevos endpoints
- Crear componentes: `app/admin/components/` (gráficos, tablas, etc.)

---

### 2. Sistema de Seguimiento de Envíos Mejorado
**Estado actual:** Campo `tracking_number` básico implementado

**Falta implementar:**
- [ ] **UI mejorada para tracking:**
  - [ ] Formulario mejorado para agregar/editar tracking_number
  - [ ] Validación de formato de tracking (según correo)
  - [ ] Búsqueda de tracking en tiempo real
  
- [ ] **Notificaciones automáticas:**
  - [ ] Email automático al comprador cuando se agrega tracking
  - [ ] Notificación cuando el estado cambia a "enviado"
  - [ ] Recordatorios si el pedido no se actualiza
  
- [ ] **Visualización mejorada:**
  - [ ] Mostrar tracking en página de pedidos del comprador de forma destacada
  - [ ] Timeline visual del estado del envío
  - [ ] Historial de cambios de estado de envío
  
- [ ] **Integración opcional:**
  - [ ] Integración con APIs de correos chilenos (Chilexpress, Correos de Chile)
  - [ ] Actualización automática del estado desde la API del correo

**Archivos a modificar:**
- `app/artesanos/pedidos/page.tsx` - Mejorar UI de tracking
- `app/pedidos/page.tsx` - Mostrar tracking destacado
- `app/api/orders/route.ts` - Agregar notificaciones
- `app/api/send-email/route.ts` - Templates de tracking

---

### 3. Sistema de Notificaciones Mejorado
**Estado actual:** Emails básicos implementados

**Falta implementar:**
- [ ] **Emails más completos:**
  - [ ] Templates HTML más atractivos y personalizados
  - [ ] Emails con imágenes y branding
  - [ ] Emails responsive para móviles
  
- [ ] **Notificaciones adicionales:**
  - [ ] Recordatorios de reseñas pendientes (después de X días de recibir pedido)
  - [ ] Notificaciones de cambios de estado de pedido (procesando → enviado → entregado)
  - [ ] Notificaciones al artesano de nuevas ventas
  - [ ] Notificaciones de nuevos productos de artesanos favoritos (si se implementa favoritos)
  - [ ] Notificaciones de ofertas y promociones
  
- [ ] **Sistema de notificaciones in-app (opcional):**
  - [ ] Crear tabla `notifications` en base de datos
  - [ ] API para notificaciones in-app
  - [ ] Componente de notificaciones en el navbar
  - [ ] Marcar como leídas
  
- [ ] **Preferencias de notificaciones:**
  - [ ] Permitir a usuarios configurar qué notificaciones recibir
  - [ ] Frecuencia de recordatorios
  - [ ] Método preferido (email, in-app, ambos)

**Archivos a modificar:**
- `app/api/send-email/route.ts` - Mejorar templates
- Crear `app/api/notifications/route.ts` (si se implementa in-app)
- `app/components/top-nav.tsx` - Agregar badge de notificaciones
- `app/compradores/perfil/page.tsx` - Agregar preferencias

---

## 🟡 PRIORIDAD MEDIA

### 4. Mejoras de UX/UI
**Estado actual:** UI funcional pero básica

**Falta implementar:**
- [ ] **Validación de formularios:**
  - [ ] Validación más robusta en todos los formularios
  - [ ] Mensajes de error más claros y específicos
  - [ ] Validación en tiempo real
  
- [ ] **Loading states mejorados:**
  - [ ] Skeleton loaders en lugar de spinners simples
  - [ ] Loading states específicos para cada acción
  - [ ] Transiciones suaves
  
- [ ] **Confirmaciones y feedback:**
  - [ ] Confirmaciones antes de acciones destructivas (eliminar, cancelar)
  - [ ] Toast notifications para acciones exitosas
  - [ ] Mensajes de éxito/error más visibles
  
- [ ] **Responsive design:**
  - [ ] Mejorar responsive en todas las páginas
  - [ ] Optimizar para tablets
  - [ ] Mejorar experiencia móvil
  
- [ ] **Accesibilidad:**
  - [ ] ARIA labels en todos los elementos interactivos
  - [ ] Navegación por teclado completa
  - [ ] Contraste de colores adecuado
  - [ ] Screen reader friendly
  
- [ ] **Optimización de imágenes:**
  - [ ] Lazy loading de imágenes
  - [ ] Optimización automática de imágenes
  - [ ] Placeholders mientras cargan

**Archivos a modificar:**
- Todos los componentes y páginas
- Crear `app/components/ui/` para componentes reutilizables (Toast, Modal, etc.)

---

### 5. Funcionalidades Adicionales - Favoritos
**Estado actual:** No implementado

**Falta implementar:**
- [ ] **Sistema de favoritos de productos:**
  - [ ] Botón de favorito en cada producto
  - [ ] Página de favoritos (`/favoritos`)
  - [ ] API para gestionar favoritos
  - [ ] Tabla `favorites` en base de datos
  
- [ ] **Favoritos de artesanos:**
  - [ ] Seguir artesanos
  - [ ] Notificaciones de nuevos productos de artesanos seguidos
  - [ ] Página de artesanos seguidos

**Archivos a crear:**
- `app/api/favorites/route.ts`
- `app/favoritos/page.tsx`
- `app/components/favorite-button.tsx`

---

### 6. Sistema de Códigos de Descuento
**Estado actual:** No implementado

**Falta implementar:**
- [ ] **Gestión de códigos:**
  - [ ] Crear códigos de descuento (admin)
  - [ ] Tipos: porcentaje o monto fijo
  - [ ] Límites: fecha de expiración, uso máximo, mínimo de compra
  - [ ] Aplicar a productos específicos o todo el catálogo
  
- [ ] **Aplicación en checkout:**
  - [ ] Campo para ingresar código
  - [ ] Validación del código
  - [ ] Cálculo de descuento
  - [ ] Mostrar descuento aplicado

**Archivos a crear:**
- `app/api/discounts/route.ts`
- Tabla `discount_codes` en base de datos
- Modificar `app/checkout/page.tsx`

---

## 🟢 PRIORIDAD BAJA

### 7. Integración de Pagos Reales
**Estado actual:** Sistema de pagos simulado funcionando

**Falta implementar:**
- [ ] **Elegir pasarela:**
  - [ ] Webpay Plus (Transbank) - Recomendado para Chile
  - [ ] MercadoPago Chile - Alternativa
  
- [ ] **Implementar integración:**
  - [ ] Obtener credenciales de la pasarela
  - [ ] Crear `app/api/payments/create-payment/route.ts`
  - [ ] Crear `app/api/payments/confirm-payment/route.ts`
  - [ ] Crear `app/api/payments/webhook/route.ts` (notificaciones)
  - [ ] Integrar en `app/checkout/page.tsx`
  
- [ ] **Testing:**
  - [ ] Probar en modo sandbox
  - [ ] Configurar para producción
  - [ ] Manejo de errores de pago

---

### 8. Testing Automatizado
**Estado actual:** No hay tests

**Falta implementar:**
- [ ] **Configuración:**
  - [ ] Configurar Jest o Vitest
  - [ ] Configurar Testing Library para React
  - [ ] Configurar Playwright o Cypress para E2E
  
- [ ] **Tests a crear:**
  - [ ] Unit tests para componentes
  - [ ] Unit tests para funciones de utilidad (`lib/cart.ts`, etc.)
  - [ ] Integration tests para APIs
  - [ ] E2E tests para flujo de compra completo
  - [ ] Tests de autenticación
  - [ ] Tests de permisos y RLS
  
- [ ] **CI/CD:**
  - [ ] Configurar GitHub Actions o similar
  - [ ] Ejecutar tests automáticamente en PRs

---

### 9. Documentación
**Estado actual:** Documentación básica

**Falta implementar:**
- [ ] **Documentación de usuario:**
  - [ ] `GUIA_ARTESANOS.md` - Cómo usar la plataforma como artesano
  - [ ] `GUIA_COMPRADORES.md` - Cómo usar la plataforma como comprador
  
- [ ] **Documentación técnica:**
  - [ ] `API_DOCUMENTATION.md` - Documentación de todas las APIs
  - [ ] `DEVELOPMENT.md` - Guía para desarrolladores
  - [ ] `README.md` - Actualizar con información completa del proyecto
  
- [ ] **Documentación de despliegue:**
  - [ ] `DEPLOY.md` - Actualizar guía de despliegue
  - [ ] Variables de entorno documentadas
  - [ ] Troubleshooting común

---

### 10. Funcionalidades Opcionales Avanzadas
**Estado actual:** No implementado

**Falta implementar:**
- [ ] **Comparación de productos:**
  - [ ] Seleccionar productos para comparar
  - [ ] Página de comparación lado a lado
  
- [ ] **Recomendaciones personalizadas:**
  - [ ] Basadas en historial de compras
  - [ ] Basadas en productos vistos
  - [ ] Basadas en artesanos favoritos
  
- [ ] **Wishlist:**
  - [ ] Lista de deseos separada de favoritos
  - [ ] Compartir wishlist
  - [ ] Notificaciones de precio/stock
  
- [ ] **Programa de fidelidad:**
  - [ ] Puntos por compras
  - [ ] Canjear puntos por descuentos
  - [ ] Niveles de membresía
  
- [ ] **Chat entre comprador y artesano:**
  - [ ] Sistema de mensajería
  - [ ] Notificaciones de mensajes
  - [ ] Historial de conversaciones
  
- [ ] **Sistema de preguntas y respuestas:**
  - [ ] Preguntas en productos
  - [ ] Respuestas del artesano
  - [ ] Votos útiles

---

## 📊 RESUMEN POR PRIORIDAD

### 🔴 Prioridad Alta (3 tareas principales)
1. Panel de Administración - Funcionalidades Avanzadas
2. Sistema de Seguimiento de Envíos Mejorado
3. Sistema de Notificaciones Mejorado

### 🟡 Prioridad Media (3 tareas)
4. Mejoras de UX/UI
5. Funcionalidades Adicionales - Favoritos
6. Sistema de Códigos de Descuento

### 🟢 Prioridad Baja (4 tareas)
7. Integración de Pagos Reales
8. Testing Automatizado
9. Documentación
10. Funcionalidades Opcionales Avanzadas

---

## 🎯 RECOMENDACIÓN DE ORDEN DE IMPLEMENTACIÓN

1. **Primero:** Panel de Administración - Funcionalidades Avanzadas (crítico para gestión)
2. **Segundo:** Sistema de Notificaciones Mejorado (mejora experiencia de usuario)
3. **Tercero:** Sistema de Seguimiento de Envíos Mejorado (importante para compradores)
4. **Cuarto:** Mejoras de UX/UI (mejora general de la plataforma)
5. **Quinto:** Funcionalidades Adicionales (favoritos, códigos de descuento)
6. **Sexto:** Testing y Documentación (calidad y mantenibilidad)
7. **Último:** Pagos reales y funcionalidades opcionales avanzadas

---

**Nota:** Muchas funcionalidades básicas ya están implementadas y funcionando. Esta lista se enfoca en mejoras y funcionalidades avanzadas que agregarían valor significativo a la plataforma.

