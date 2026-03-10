-- ============================================================
-- ARTECOM - Script de Migración Completo
-- Marketplace de Artesanía Chilena
-- ============================================================
-- Ejecutar en: Supabase → SQL Editor → New Query
-- ============================================================


-- ============================================================
-- 1. EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 2. TABLAS
-- ============================================================

-- 2.1 Perfiles de Artesanos
CREATE TABLE IF NOT EXISTS artisan_profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bio         TEXT,
  region      TEXT,
  ciudad      TEXT,
  phone       TEXT,
  website     TEXT,
  instagram   TEXT,
  specialties TEXT[] DEFAULT '{}',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Perfiles de Compradores
CREATE TABLE IF NOT EXISTS buyer_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone               TEXT,
  default_address     TEXT,
  default_city        TEXT,
  default_region      TEXT,
  addresses           JSONB DEFAULT '[]',
  preferences         JSONB DEFAULT '{}',
  notification_prefs  JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Productos
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL,
  price       NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  images      TEXT[] DEFAULT '{}',
  materials   TEXT[] DEFAULT '{}',
  dimensions  TEXT,
  weight      NUMERIC(10, 2),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Pedidos
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_amount        NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  shipping_address    TEXT NOT NULL,
  shipping_city       TEXT NOT NULL,
  shipping_region     TEXT NOT NULL,
  shipping_phone      TEXT NOT NULL,
  order_status        TEXT NOT NULL DEFAULT 'procesando'
                        CHECK (order_status IN ('procesando', 'enviado', 'entregado', 'cancelado')),
  payment_status      TEXT NOT NULL DEFAULT 'pendiente'
                        CHECK (payment_status IN ('pendiente', 'pagado', 'reembolsado')),
  payment_method      TEXT,
  tracking_number     TEXT,
  cancellation_reason TEXT,
  buyer_cancelled     BOOLEAN DEFAULT false,
  cancellation_viewed BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 Ítems de Pedido
CREATE TABLE IF NOT EXISTS order_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE SET NULL,
  artisan_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  price_at_purchase NUMERIC(12, 2) NOT NULL CHECK (price_at_purchase > 0),
  subtotal          NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 2.6 Reseñas
CREATE TABLE IF NOT EXISTS reviews (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id   UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, product_id)  -- Un usuario solo puede reseñar un producto una vez
);

-- 2.7 Pagos
CREATE TABLE IF NOT EXISTS payments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount         NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pendiente'
                   CHECK (status IN ('pendiente', 'completado', 'fallido', 'reembolsado')),
  transaction_id TEXT,
  metadata       JSONB DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 3. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_user_id    ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active  ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id     ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_artisan ON order_items(artisan_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product     ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user        ON reviews(user_id);


-- ============================================================
-- 4. FUNCIONES SQL
-- ============================================================

-- Obtener nombre del usuario (desde auth.users metadata)
CREATE OR REPLACE FUNCTION get_user_name(user_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
BEGIN
  SELECT COALESCE(
    raw_user_meta_data->>'name',
    raw_user_meta_data->>'full_name',
    email
  )
  INTO user_name
  FROM auth.users
  WHERE id = user_id_param;
  RETURN user_name;
END;
$$;

-- Obtener email del usuario
CREATE OR REPLACE FUNCTION get_user_email(user_id_param UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email
  INTO user_email
  FROM auth.users
  WHERE id = user_id_param;
  RETURN user_email;
END;
$$;

-- Calcular promedio de valoraciones de un producto
CREATE OR REPLACE FUNCTION get_product_rating_avg(product_id_param UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  SELECT ROUND(AVG(rating)::NUMERIC, 1)
  INTO avg_rating
  FROM reviews
  WHERE product_id = product_id_param;
  RETURN avg_rating;
END;
$$;

-- Calcular promedio de valoraciones de un artesano
CREATE OR REPLACE FUNCTION get_artisan_rating_avg(artisan_id_param UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  SELECT ROUND(AVG(r.rating)::NUMERIC, 1)
  INTO avg_rating
  FROM reviews r
  JOIN products p ON p.id = r.product_id
  WHERE p.user_id = artisan_id_param;
  RETURN avg_rating;
END;
$$;

-- Verificar si el usuario es administrador
CREATE OR REPLACE FUNCTION check_is_admin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT COALESCE((raw_user_meta_data->>'is_admin')::BOOLEAN, false)
  INTO is_admin
  FROM auth.users
  WHERE id = user_id_param;
  RETURN COALESCE(is_admin, false);
END;
$$;

-- Promover a un usuario a administrador
CREATE OR REPLACE FUNCTION make_user_admin(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
  WHERE id = user_id_param;
END;
$$;


-- ============================================================
-- 5. TRIGGERS (updated_at automático)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_artisan_profiles_updated
  BEFORE UPDATE ON artisan_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_buyer_profiles_updated
  BEFORE UPDATE ON buyer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_products_updated
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_orders_updated
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_reviews_updated
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_payments_updated
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE artisan_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments         ENABLE ROW LEVEL SECURITY;

-- ---- artisan_profiles ----
CREATE POLICY "Cualquiera puede ver perfiles de artesanos"
  ON artisan_profiles FOR SELECT USING (true);

CREATE POLICY "Artesanos pueden crear su perfil"
  ON artisan_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Artesanos pueden actualizar su propio perfil"
  ON artisan_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ---- buyer_profiles ----
CREATE POLICY "Compradores pueden ver su propio perfil"
  ON buyer_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Compradores pueden crear su perfil"
  ON buyer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Compradores pueden actualizar su propio perfil"
  ON buyer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ---- products ----
CREATE POLICY "Cualquiera puede ver productos activos"
  ON products FOR SELECT USING (true);

CREATE POLICY "Artesanos pueden crear sus productos"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Artesanos pueden actualizar sus propios productos"
  ON products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Artesanos pueden eliminar sus propios productos"
  ON products FOR DELETE
  USING (auth.uid() = user_id);

-- ---- orders ----
CREATE POLICY "Compradores pueden ver sus propios pedidos"
  ON orders FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Usuarios autenticados pueden crear pedidos"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Compradores pueden actualizar sus propios pedidos"
  ON orders FOR UPDATE
  USING (auth.uid() = buyer_id);

CREATE POLICY "Compradores pueden eliminar sus pedidos cancelados"
  ON orders FOR DELETE
  USING (auth.uid() = buyer_id);

-- ---- order_items ----
CREATE POLICY "Artesanos y compradores pueden ver sus order_items"
  ON order_items FOR SELECT
  USING (
    auth.uid() = artisan_id
    OR EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_id AND o.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Sistema puede crear order_items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- ---- reviews ----
CREATE POLICY "Cualquiera puede ver reseñas"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados pueden crear reseñas"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias reseñas"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias reseñas"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ---- payments ----
CREATE POLICY "Compradores pueden ver sus propios pagos"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_id AND o.buyer_id = auth.uid()
    )
  );

CREATE POLICY "Sistema puede insertar pagos"
  ON payments FOR INSERT WITH CHECK (true);


-- ============================================================
-- 7. STORAGE (ejecutar por separado si es necesario)
-- ============================================================
-- En Supabase Dashboard → Storage → New bucket:
--
-- Nombre del bucket: "product-images"
-- Public: SI
--
-- O con SQL:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('product-images', 'product-images', true)
-- ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- ✅ MIGRACIÓN COMPLETA
-- Tablas creadas: artisan_profiles, buyer_profiles, products,
--                 orders, order_items, reviews, payments
-- Funciones:      get_user_name, get_user_email,
--                 get_product_rating_avg, get_artisan_rating_avg,
--                 check_is_admin, make_user_admin
-- RLS:            Habilitada en todas las tablas
-- ============================================================
