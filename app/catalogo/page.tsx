"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopNav } from "../components/top-nav";
import { ProductModal } from "../components/product-modal";
import { useAuth } from "../components/auth-provider";
import Footer from "../components/footer";
import { getCart, saveCart, setCartItem, clearCart as clearCartStorage, type Cart } from "../lib/cart";

type CatalogItem = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  images: string[];
  materials: string[];
  dimensions: string | null;
  weight: number | null;
  artisan_name?: string;
  artisan_id?: string;
  artisan_profiles?: {
    region: string;
    ciudad: string | null;
    specialties: string[];
  };
  avg_rating?: number;
  reviews_count?: number;
};

// Mapeo de IDs de productos a imágenes
const productImages: Record<string, string> = {
  "rv-espinaca": "/espinaca-baby.jpg",
  "rv-betarraga": "/betarraga.jpg",
  "gt-huevoazul": "/huevos-azules.jpg",
  "hk-tomate": "/TOMATE.jpg",
  "hk-zapallo": "/ZAPALLO.jpg",
};

function getProductImage(product: CatalogItem): string {
  // Si tiene imágenes en la base de datos, usar la primera
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  return "/next.svg";
}

function CatalogoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart>({});
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedRegion, setSelectedRegion] = useState(searchParams.get("region") || "all");
  const [selectedMaterial, setSelectedMaterial] = useState(searchParams.get("material") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "recent");
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  // filtersInitialized ya no es necesario con la inicialización directa
  const [quantityInputs, setQuantityInputs] = useState<Record<string, { show: boolean; value: number }>>({});

  // Leer query params de la URL al cargar (solo una vez)
  useEffect(() => {
    const category = searchParams.get("category") || "all";
    const search = searchParams.get("search") || "";
    const region = searchParams.get("region") || "all";
    const material = searchParams.get("material") || "all";
    const sort = searchParams.get("sort") || "recent";

    // Solo actualizar si hay cambios reales para evitar bucles
    if (category !== selectedCategory) setSelectedCategory(category);
    if (search !== searchQuery) setSearchQuery(search);
    if (region !== selectedRegion) setSelectedRegion(region);
    if (material !== selectedMaterial) setSelectedMaterial(material);
    if (sort !== sortBy) setSortBy(sort);
  }, [searchParams]);

  // Auth check removed to allow public access
  // useEffect(() => {
  //   if (!authLoading && !user) {
  //     router.push("/auth/login?redirect=/catalogo");
  //   }
  // }, [user, authLoading, router]);

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    const savedCart = getCart();
    setCart(savedCart);
  }, []);

  // Actualizar URL cuando cambien los filtros
  // Actualizar URL cuando cambian los filtros (sin recargar la página)
  useEffect(() => {
    // No necesitamos bloqueo de inicialización porque el estado ya nace inicializado
    const params = new URLSearchParams();
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (selectedRegion !== "all") params.set("region", selectedRegion);
    if (selectedMaterial !== "all") params.set("material", selectedMaterial);
    if (sortBy !== "recent") params.set("sort", sortBy);

    const newUrl = params.toString()
      ? `/catalogo?${params.toString()}`
      : "/catalogo";

    // Usar router.replace con scroll: false para evitar recargas
    router.replace(newUrl, { scroll: false });
  }, [selectedCategory, searchQuery, selectedRegion, selectedMaterial, sortBy, router]);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery, selectedRegion, selectedMaterial, sortBy]);

  const cartItems = Object.entries(cart);
  const cartCount = cartItems.reduce((total, [, qty]) => total + qty, 0);
  const cartHref = useMemo(() => {
    if (cartItems.length === 0) {
      return "";
    }
    const serialized = cartItems
      .map(([id, qty]) => `${id}:${qty}`)
      .join(",");
    return `/carrito?items=${encodeURIComponent(serialized)}`;
  }, [cartItems]);

  function addToCart(id: string, quantity: number = 1) {
    const product = catalogItems.find((item) => item.id === id);
    if (!product) return;

    const currentCartQuantity = cart[id] || 0;
    const totalQuantity = currentCartQuantity + quantity;
    const availableStock = product.stock || 0;

    // Validar que no se exceda el stock disponible
    if (totalQuantity > availableStock) {
      alert(`No hay suficiente stock disponible. Stock disponible: ${availableStock} unidades. Ya tienes ${currentCartQuantity} en el carrito.`);
      return;
    }

    const newCart = setCartItem(id, totalQuantity);
    setCart(newCart);
    // Disparar evento después del render
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("cart-updated"));
    }, 0);
  }

  function setCartQuantity(id: string, quantity: number) {
    const product = catalogItems.find((item) => item.id === id);
    if (!product) return;

    const availableStock = product.stock || 0;

    // Validar que no se exceda el stock disponible
    if (quantity > availableStock) {
      alert(`No hay suficiente stock disponible. Stock disponible: ${availableStock} unidades.`);
      return;
    }

    const newCart = setCartItem(id, quantity);
    setCart(newCart);
    // Disparar evento después del render
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("cart-updated"));
    }, 0);
  }

  function decrement(id: string) {
    const current = cart[id] || 0;
    if (current <= 1) {
      const newCart = { ...cart };
      delete newCart[id];
      setCart(newCart);
      saveCart(newCart);
    } else {
      const newCart = setCartItem(id, current - 1);
      setCart(newCart);
    }
    // Disparar evento después del render
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("cart-updated"));
    }, 0);
  }

  function clearCart() {
    clearCartStorage();
    setCart({});
    // Disparar evento después del render
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("cart-updated"));
    }, 0);
  }

  function openProductModal(product: CatalogItem) {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }

  function closeProductModal() {
    setIsModalOpen(false);
    setSelectedProduct(null);
  }

  async function loadProducts() {
    try {
      // Solo mostrar loading de pantalla completa en la carga inicial
      if (initialLoad) {
        setLoading(true);
      }
      const params = new URLSearchParams();
      params.set("only_active", "true");

      if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      if (selectedRegion !== "all") {
        params.set("region", selectedRegion);
      }

      if (selectedMaterial !== "all") {
        params.set("material", selectedMaterial);
      }

      // Mapear sortBy a sort_by de la API
      let apiSortBy = "recent";
      let apiSortOrder = "desc";

      switch (sortBy) {
        case "price_asc":
          apiSortBy = "price_asc";
          apiSortOrder = "asc";
          break;
        case "price_desc":
          apiSortBy = "price_desc";
          apiSortOrder = "desc";
          break;
        case "rating":
          apiSortBy = "rating";
          apiSortOrder = "desc";
          break;
        case "sold":
          apiSortBy = "sold";
          apiSortOrder = "desc";
          break;
        default:
          apiSortBy = "recent";
          apiSortOrder = "desc";
      }

      params.set("sort_by", apiSortBy);
      params.set("sort_order", apiSortOrder);

      const response = await fetch(`/api/products?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCatalogItems(data || []);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      if (initialLoad) {
        setLoading(false);
        setInitialLoad(false);
      }
    }
  }

  // Obtener opciones de filtros únicas de los productos disponibles
  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set(catalogItems.map((item) => item.category))
    ).sort();
    return [
      { value: "all", label: "Todas las categorías" },
      ...categories.map((category) => ({ value: category, label: category })),
    ];
  }, [catalogItems]);

  const regionOptions = useMemo(() => {
    const regions = Array.from(
      new Set(
        catalogItems
          .map((item) => item.artisan_profiles?.region)
          .filter((r): r is string => Boolean(r))
      )
    ).sort();
    return [
      { value: "all", label: "Todas las regiones" },
      ...regions.map((region) => ({ value: region, label: region })),
    ];
  }, [catalogItems]);

  const materialOptions = useMemo(() => {
    const materials = new Set<string>();
    catalogItems.forEach((item) => {
      if (item.materials && Array.isArray(item.materials)) {
        item.materials.forEach((m) => materials.add(m));
      }
    });
    return [
      { value: "all", label: "Todos los materiales" },
      ...Array.from(materials).sort().map((material) => ({ value: material, label: material })),
    ];
  }, [catalogItems]);

  const sortOptions = [
    { value: "recent", label: "Más recientes" },
    { value: "price_asc", label: "Precio: menor a mayor" },
    { value: "price_desc", label: "Precio: mayor a menor" },
    { value: "rating", label: "Mejor valorados" },
    { value: "sold", label: "Más vendidos" },
  ];

  // Los productos ya vienen filtrados desde la API, solo agrupar por región
  const productsByRegion = useMemo(() => {
    const grouped: Record<string, CatalogItem[]> = {};
    catalogItems.forEach((item) => {
      const region = item.artisan_profiles?.region || "Sin región";
      if (!grouped[region]) {
        grouped[region] = [];
      }
      grouped[region].push(item);
    });
    return grouped;
  }, [catalogItems]);

  // if (!user) {
  //   return null; // El useEffect redirigirá
  // }

  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 30;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, selectedRegion, selectedMaterial, sortBy]);

  const totalPages = Math.ceil(catalogItems.length / PRODUCTS_PER_PAGE);
  const displayedItems = catalogItems.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav cartCount={cartCount} cartHref={cartHref || undefined} />

      {/* Full-width container */}
      <div className="flex gap-6 px-6 py-8">
        {/* Left Sidebar - Filters */}
        <aside className="w-64 flex-shrink-0">
          <div className="sticky top-8 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Catálogo</h1>
              <p className="mt-1 text-sm text-slate-600">
                {catalogItems.length} productos
              </p>
            </div>

            {/* Search */}
            <div>
              <label htmlFor="search" className="mb-2 block text-sm font-semibold text-slate-700">
                Buscar
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="h-4 w-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-emerald-600"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category-filter" className="mb-2 block text-sm font-semibold text-slate-700">
                Categoría
              </label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label htmlFor="region-filter" className="mb-2 block text-sm font-semibold text-slate-700">
                Región
              </label>
              <select
                id="region-filter"
                value={selectedRegion}
                onChange={(event) => setSelectedRegion(event.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {regionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Material Filter */}
            <div>
              <label htmlFor="material-filter" className="mb-2 block text-sm font-semibold text-slate-700">
                Material
              </label>
              <select
                id="material-filter"
                value={selectedMaterial}
                onChange={(event) => setSelectedMaterial(event.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {materialOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label htmlFor="sort-filter" className="mb-2 block text-sm font-semibold text-slate-700">
                Ordenar por
              </label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(selectedCategory !== "all" || searchQuery || selectedRegion !== "all" || selectedMaterial !== "all" || sortBy !== "recent") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                  setSelectedRegion("all");
                  setSelectedMaterial("all");
                  setSortBy("recent");
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </aside>

        {/* Main Content - Products Grid */}
        <main className="flex-1">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-lg bg-slate-200" />
              ))}
            </div>
          ) : catalogItems.length === 0 ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white">
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">No se encontraron productos</p>
                <p className="mt-1 text-sm text-slate-600">Intenta ajustar los filtros o la búsqueda</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {displayedItems.map((item) => (
                  <article
                    key={item.id}
                    className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:shadow-lg"
                  >
                    <button
                      onClick={() => openProductModal(item)}
                      className="flex w-full flex-col text-left"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                        <Image
                          src={getProductImage(item)}
                          alt={item.name}
                          fill
                          className="object-cover transition group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-3">
                        <Link
                          href={`/catalogo/${item.id}`}
                          className="text-sm font-semibold text-slate-900 line-clamp-2 hover:text-emerald-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.name}
                        </Link>

                        {item.avg_rating != null && item.avg_rating > 0 && item.reviews_count != null && item.reviews_count > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-amber-500 text-sm">★</span>
                            <span className="text-xs font-medium text-slate-700">
                              {item.avg_rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({item.reviews_count})
                            </span>
                          </div>
                        )}

                        <div className="mt-auto">
                          <p className="text-lg font-bold text-slate-900">
                            ${item.price.toLocaleString('es-CL')}
                          </p>
                          <p className="text-xs text-slate-600">
                            {item.artisan_name || "Artesano Local"}
                          </p>
                          <p className={`text-xs font-medium mt-1 ${item.stock > 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {item.stock > 0 ? `Stock: ${item.stock}` : "Sin stock"}
                          </p>
                        </div>
                      </div>
                    </button>

                    <div className="border-t border-slate-100 p-3">
                      {cart[item.id] ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1">
                            <button
                              type="button"
                              onClick={() => decrement(item.id)}
                              className="flex h-6 w-6 items-center justify-center rounded text-emerald-700 hover:bg-emerald-100"
                            >
                              −
                            </button>
                            <span className="min-w-[20px] text-center text-sm font-semibold text-emerald-700">
                              {cart[item.id]}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(item.id)}
                              disabled={(cart[item.id] || 0) >= (item.stock || 0)}
                              className="flex h-6 w-6 items-center justify-center rounded text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if ((item.stock || 0) > 0) {
                              addToCart(item.id, 1);
                            } else {
                              alert("Este producto no tiene stock disponible.");
                            }
                          }}
                          disabled={(item.stock || 0) <= 0}
                          className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                        >
                          {(item.stock || 0) > 0 ? "Agregar" : "Sin stock"}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                  <button
                    onClick={() => {
                      setCurrentPage(p => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="text-sm font-medium text-slate-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => {
                      setCurrentPage(p => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}

          <ProductModal
            product={selectedProduct}
            isOpen={isModalOpen}
            onClose={closeProductModal}
            cart={cart}
            onAddToCart={addToCart}
            onSetQuantity={setCartQuantity}
            onDecrement={decrement}
          />

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
            <button
              type="button"
              onClick={clearCart}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-40"
              disabled={cartItems.length === 0}
            >
              Vaciar carrito
            </button>
            {cartItems.length > 0 && (
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-700">
                {cartCount} unidades listas para envío
              </span>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <TopNav />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-slate-600">Cargando catálogo...</p>
        </div>
      </div>
    }>
      <CatalogoContent />
    </Suspense>
  );
}

