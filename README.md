# 🪆 ArteCom — Marketplace de Artesanía Chilena

**ArteCom** es una plataforma e-commerce que conecta **artesanos locales chilenos** con compradores, promoviendo el comercio justo y los productos hechos a mano.

---

## 🚀 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript 5 |
| Estilos | Tailwind CSS v4 |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Autenticación | Supabase Auth |
| Storage | Supabase Storage |
| IA — Chatbot | Groq API · Llama 3.3-70b |
| IA — Recomendaciones | Motor propio con Supabase |
| Email | Resend API |
| Iconos | Lucide React |
| Mapas | Leaflet + React-Leaflet |

---

## ✨ Funcionalidades del Sistema

### 🏪 Marketplace & Catálogo
- Catálogo de productos artesanales con imágenes múltiples
- Filtros por categoría: Textiles, Cerámica, Madera, Joyería, Cestería, Cuero
- Detalle de producto con galería, información del artesano, reseñas y valoraciones
- Sección "También te puede interesar" con recomendaciones inteligentes

### 🛒 Carrito y Checkout
- Carrito persistente en `localStorage` (funciona sin login)
- Checkout completo: dirección de envío + método de pago
- Validación de stock en tiempo real antes de procesar
- Pagos simulados: Webpay, Transbank, MercadoPago
- Comprobante de pago con envío de email automático

### 🔐 Autenticación y Roles
- Registro e inicio de sesión con Supabase Auth
- Tres roles diferenciados: **artesano**, **comprador**, **admin**
- Navegación dinámica según el rol del usuario
- Protección de rutas con `ProtectedRoute`

### 👨‍🎨 Panel de Artesanos (`/artesanos`)
- Dashboard con resumen de actividad
- CRUD de productos: crear, editar, activar/desactivar, eliminar
- Subida de imágenes múltiples por producto
- Gestión de pedidos recibidos: cambiar estado, agregar número de tracking, cancelar con motivo
- Edición de perfil público

### 🧑‍💼 Panel de Compradores
- Historial de pedidos con estados (procesando, enviado, entregado, cancelado)
- Badge rojo en navbar cuando hay pedidos cancelados no vistos (polling cada 30 s)
- Cancelación de pedidos propios
- Perfil extendido: múltiples direcciones de envío, preferencias, configuración de notificaciones

### ⭐ Sistema de Reseñas
- Crear reseñas post-compra (1-5 estrellas + comentario)
- Promedio de valoraciones calculado en la BD con función SQL `get_product_rating_avg()`
- Promedio por artesano con `get_artisan_rating_avg()`

### 🛠️ Panel de Administración (`/admin`)
- Estadísticas globales: usuarios, productos, pedidos, ingresos
- Listado y gestión de usuarios
- Listado y moderación de productos

---

## 🤖 Implementación de Inteligencia Artificial

### 1. Chatbot Asistente Virtual (`/api/chat`)
El asistente está integrado como un **componente flotante global** (`Chatbot`) disponible en toda la aplicación a través del `layout.tsx`.

**Tecnología:** [Groq API](https://groq.com) — modelo **Llama 3.3-70b-versatile**

**Funcionamiento:**
- El componente mantiene el historial de mensajes en estado local de React
- Al enviar un mensaje, hace `POST /api/chat` con todo el historial
- La API construye el contexto con un **system prompt** específico de ArteCom:
  - Conoce las categorías de productos, política de envíos y valores de la plataforma
  - Instruido para no inventar precios ni stock, y derivar al catálogo
  - Respuestas concisas (máx. 2-3 oraciones)
- **UI:** Ventana flotante en bottom-right, burbujas diferenciadas por rol (usuario/bot), indicador de escritura animado (3 puntos bouncing), auto-scroll al último mensaje

```
POST /api/chat
Body: { messages: [{ role: "user"|"assistant", content: string }] }
Response: { message: string }
Model: llama-3.3-70b-versatile @ Groq (temperature: 0.7, max_tokens: 200)
```

> ⚠️ Requiere variable de entorno `GROQ_API_KEY`

---

### 2. Sistema de Recomendaciones (`/api/recommendations`)
Motor de recomendaciones contextual basado en similitud de productos.

**Lógica de recomendación (prioridad):**
1. **Productos del mismo artesano** (hasta 3) — muestra el trabajo del creador
2. **Productos de la misma categoría** de otros artesanos (hasta 3) — amplía el descubrimiento
3. **Productos aleatorios activos** como relleno si hay menos de 4 recomendaciones

**Filtros aplicados:** solo productos `status = 'active'` con `stock > 0`, excluyendo el producto actual.

**UI:** Componente `Recommendations` con skeleton loader animado, grid responsivo 2→4 columnas, hover con escala y borde verde.

---

## 🎨 Diseño Visual (UI/UX)

### Paleta de Colores
- **Primario:** Emerald (`emerald-500/600/700`) — identidad de la marca
- **Fondo:** Slate oscuro (`slate-900/950`) en navbar, claro (`slate-50`) en contenido
- **Acento admin:** Purple (`purple-500/20`)

### Componentes Destacados

| Componente | Descripción Visual |
|---|---|
| **TopNav** | Sticky con glassmorphism (`backdrop-blur`, `bg-slate-950/70`), badge de pedidos cancelados |
| **Hero Section** | Gradiente `blue-900 → emerald-900`, tipografía bold en blanco con span verde |
| **Cards de producto** | Rounded-2xl, hover shadow-xl + scale-110 en imagen |
| **Chatbot** | Ventana flotante con `ring-1 ring-slate-900/5`, slide-in animation |
| **Loading states** | Skeleton loaders con `animate-pulse` en productos y recomendaciones |
| **Categorías** | Grid de pills coloreados con hover scale-105 |

### Tipografía
- **Sans:** Geist Sans (Google Fonts) — cuerpo y UI
- **Mono:** Geist Mono — código y datos

### Responsive Design
- Mobile-first con Tailwind breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`)
- Navbar colapsable en móvil con menú hamburguesa
- Grid de productos: 1→2→3→4→5→6 columnas según viewport

---

## 🗄️ Base de Datos (Supabase)

### Tablas
```
artisan_profiles   → datos extendidos del artesano
buyer_profiles     → datos extendidos del comprador
products           → catálogo (name, price, category, images[], stock, status)
orders             → pedidos (buyer_id, status, total, tracking_number)
order_items        → ítem de pedido (order_id, product_id, quantity, price)
reviews            → reseñas (user_id, product_id, rating, comment)
payments           → registro de pagos
```

### Funciones SQL
```sql
get_user_name(uid)              → nombre del usuario
get_user_email(uid)             → email del usuario
get_product_rating_avg(pid)     → promedio de estrellas del producto
get_artisan_rating_avg(aid)     → promedio de estrellas del artesano
check_is_admin(uid)             → verifica si el usuario es admin
make_user_admin(uid)            → promueve un usuario a admin
```

### Seguridad
- **Row Level Security (RLS)** habilitado en todas las tablas
- Los artesanos solo pueden ver/modificar sus propios productos y pedidos
- Los compradores solo pueden ver sus propios pedidos y reseñas
- Los administradores tienen acceso completo vía `service_role_key`

---

## 📁 Estructura del Proyecto

```
artecom/
├── app/
│   ├── layout.tsx              # Layout global: AuthProvider + Chatbot
│   ├── page.tsx                # Home: hero, categorías, novedades
│   ├── globals.css
│   │
│   ├── components/             # Componentes reutilizables
│   │   ├── auth-provider.tsx   # Contexto de autenticación
│   │   ├── protected-route.tsx # HOC para rutas protegidas
│   │   ├── top-nav.tsx         # Navbar global adaptativo por rol
│   │   ├── footer.tsx
│   │   ├── chatbot.tsx         # 🤖 Chatbot IA flotante (Groq)
│   │   ├── recommendations.tsx # 🤖 Widget de recomendaciones
│   │   ├── product-modal.tsx   # Modal de producto en catálogo
│   │   ├── product-details-modal.tsx
│   │   ├── reviews-section.tsx
│   │   └── modal.tsx
│   │
│   ├── lib/
│   │   ├── supabase.ts         # Cliente Supabase (anon)
│   │   └── cart.ts             # Utilidades de carrito (localStorage)
│   │
│   ├── api/                    # API Routes (Next.js)
│   │   ├── chat/               # 🤖 Chatbot (Groq / Llama 3.3)
│   │   ├── recommendations/    # 🤖 Motor de recomendaciones
│   │   ├── products/           # CRUD de productos
│   │   ├── orders/             # CRUD de pedidos + cancel-count
│   │   ├── artisan-profile/    # Perfil artesano
│   │   ├── buyer-profile/      # Perfil comprador
│   │   ├── reviews/            # Reseñas
│   │   ├── payments/           # Proceso y comprobante de pago
│   │   ├── send-email/         # Emails (Resend)
│   │   ├── upload-image/       # Subida a Supabase Storage
│   │   ├── admin/              # Endpoints de administración
│   │   └── artisans/           # Listado público de artesanos
│   │
│   ├── auth/                   # Login y registro
│   ├── catalogo/               # Catálogo + detalle de producto
│   ├── carrito/                # Carrito de compras
│   ├── checkout/               # Proceso de pago
│   ├── pedidos/                # Historial de pedidos (comprador)
│   ├── comprobante/[orderId]/  # Comprobante de pago
│   ├── artesanos/              # Dashboard, pedidos y perfil del artesano
│   ├── compradores/perfil/     # Perfil del comprador
│   ├── admin/                  # Panel de administración
│   ├── historia/               # Historia del proyecto
│   ├── sobre-nosotros/
│   └── contacto/
│
├── migrations/                 # Migraciones SQL para Supabase
├── .env.local                  # Variables de entorno (NO subir a Git)
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## ⚙️ Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <url-del-repo>
cd artecom
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
# Supabase (requerido)
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Groq - Chatbot IA (requerido para el chatbot)
GROQ_API_KEY=<tu-groq-api-key>

# Resend - Emails (opcional)
RESEND_API_KEY=re_<tu-resend-key>
```

> Las keys de Supabase las encuentras en: **supabase.com → tu proyecto → Settings → API**  
> La key de Groq en: **console.groq.com → API Keys**

### 4. Ejecutar en desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 5. Build para producción
```bash
npm run build
npm start
```

---

## 🌐 Rutas Principales

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Público | Home con hero, categorías y novedades |
| `/catalogo` | Público | Catálogo de productos con filtros |
| `/catalogo/[productId]` | Público | Detalle de producto + reseñas + recomendaciones |
| `/auth/login` | Público | Inicio de sesión |
| `/auth/registro` | Público | Registro de usuario |
| `/carrito` | Público | Carrito de compras |
| `/checkout` | Autenticado | Proceso de pago |
| `/pedidos` | Comprador | Historial de pedidos |
| `/compradores/perfil` | Comprador | Perfil y direcciones |
| `/artesanos` | Artesano | Dashboard |
| `/artesanos/productos` | Artesano | Gestión de productos |
| `/artesanos/pedidos` | Artesano | Pedidos recibidos |
| `/artesanos/perfil` | Artesano | Perfil público |
| `/admin` | Admin | Panel de administración |
| `/comprobante/[orderId]` | Autenticado | Comprobante de pago |

---

## 🔮 Próximas Mejoras

- [ ] Búsqueda por texto y filtros avanzados en catálogo
- [ ] Panel de admin con gráficos (Recharts) y moderación
- [ ] Sistema de notificaciones in-app
- [ ] Favoritos de productos y artesanos
- [ ] Códigos de descuento
- [ ] Integración con Webpay Plus (Transbank) real
- [ ] Tests automatizados (Vitest + Playwright)

---

## 📄 Licencia

Proyecto académico — ArteCom © 2025
