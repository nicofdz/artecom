"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "../components/top-nav";
import { useAuth } from "../components/auth-provider";
import Footer from "../components/footer";
import { ProductModal } from "../components/product-modal";

type Artisan = {
  user_id: string;
  name: string | null;
  bio: string | null;
  region: string;
  ciudad: string | null;
  specialties: string[];
  certifications: string[];
  avatar_url: string | null;
  social_media: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  website: string | null;
  phone: string | null;
  avg_rating: number;
  products: Array<{
    id: string;
    name: string;
    price: number;
    images: string[];
    category: string;
    avg_rating?: number;
    reviews_count?: number;
  }>;
  total_products_count?: number;
  created_at: string;
};

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

type ArtisanProduct = {
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
  is_active: boolean;
  avg_rating?: number;
  reviews_count?: number;
  created_at: string;
};

export default function ArtesanosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isArtisanProductsModalOpen, setIsArtisanProductsModalOpen] = useState(false);
  const [artisanProducts, setArtisanProducts] = useState<ArtisanProduct[]>([]);
  const [loadingArtisanProducts, setLoadingArtisanProducts] = useState(false);

  const [selectedRegion, setSelectedRegion] = useState("Todas");
  const [selectedSpecialty, setSelectedSpecialty] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadArtisans();
  }, []);

  async function loadArtisans() {
    try {
      setLoading(true);
      const response = await fetch("/api/artisans");
      if (response.ok) {
        const data = await response.json();
        setArtisans(data.artisans || []);
      } else {
        console.error("Error al cargar artesanos");
      }
    } catch (error) {
      console.error("Error al cargar artesanos:", error);
    } finally {
      setLoading(false);
    }
  }

  // Extraer regiones y especialidades únicas para los filtros
  const uniqueRegions = ["Todas", ...new Set(artisans.map((a) => a.region).filter(Boolean))];

  // Extraer especialidades (categorías) de los productos de los artesanos
  const allSpecialtiesRaw = artisans.flatMap((a) => {
    if (a.products && a.products.length > 0) {
      return a.products.map(p => p.category);
    }
    return a.specialties || [];
  });
  const uniqueSpecialties = ["Todas", ...new Set(allSpecialtiesRaw.filter(Boolean))];

  // Filtrar artesanos
  const filteredArtisans = artisans.filter((artisan) => {
    const matchesRegion = selectedRegion === "Todas" || artisan.region === selectedRegion;

    // Obtener las categorías/especialidades de este artesano para el filtro
    const artisanCategories = (artisan.products && artisan.products.length > 0)
      ? artisan.products.map(p => p.category)
      : (artisan.specialties || []);

    const matchesSpecialty = selectedSpecialty === "Todas" ||
      artisanCategories.includes(selectedSpecialty);

    const matchesSearch = !searchQuery ||
      (artisan.name && artisan.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (artisan.bio && artisan.bio.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesRegion && matchesSpecialty && matchesSearch;
  });

  function openProductModal(product: CatalogItem) {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  }

  function closeProductModal() {
    setIsProductModalOpen(false);
    setSelectedProduct(null);
  }

  function getProductImage(product: { images: string[] }): string {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return "/next.svg";
  }

  async function openArtisanProductsModal(artisan: Artisan) {
    setSelectedArtisan(artisan);
    setIsArtisanProductsModalOpen(true);
    setLoadingArtisanProducts(true);

    try {
      // Cargar todos los productos activos del artesano
      const response = await fetch(`/api/products?user_id=${artisan.user_id}&only_active=true&sort_by=recent`);
      if (response.ok) {
        const data = await response.json();
        setArtisanProducts(data || []);
      } else {
        console.error("Error al cargar productos del artesano");
        setArtisanProducts([]);
      }
    } catch (error) {
      console.error("Error al cargar productos del artesano:", error);
      setArtisanProducts([]);
    } finally {
      setLoadingArtisanProducts(false);
    }
  }

  function closeArtisanProductsModal() {
    setIsArtisanProductsModalOpen(false);
    setSelectedArtisan(null);
    setArtisanProducts([]);
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      {/* Container Full Width */}
      <div className="mx-auto w-full max-w-[1920px] px-4 py-8 sm:px-6 lg:px-8">

        <header className="mb-8 pl-4">
          <p className="text-sm font-semibold text-emerald-600 mb-1">
            Comunidad
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Nuestros Artesanos
          </h1>
          <p className="max-w-2xl text-base text-slate-600 mt-2">
            Conoce a los creadores chilenos detrás de productos únicos y hechos a mano.
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 relative">
          {/* Sidebar FILTROS */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              {/* Buscador */}
              <div>
                <label htmlFor="search-artisan" className="text-xs font-bold uppercase text-slate-400">
                  Buscar
                </label>
                <div className="relative mt-2">
                  <input
                    id="search-artisan"
                    type="text"
                    placeholder="Nombre o biografía..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <svg
                    className="absolute right-3 top-2.5 h-4 w-4 text-slate-400"
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
              </div>

              {/* Filtro Región */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Región</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                  {uniqueRegions.map((region) => (
                    <label key={region} className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="radio"
                          name="region"
                          checked={selectedRegion === region}
                          onChange={() => setSelectedRegion(region)}
                          className="peer h-4 w-4 appearance-none rounded-full border border-slate-300 bg-white checked:border-emerald-500 checked:bg-emerald-500 focus:ring-1 focus:ring-emerald-500 group-hover:border-emerald-400"
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100">
                          <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                        </div>
                      </div>
                      <span className={`text-sm ${selectedRegion === region ? 'text-emerald-700 font-medium' : 'text-slate-600 group-hover:text-slate-900'}`}>
                        {region}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtro Especialidad */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Especialidad</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                  {uniqueSpecialties.map((specialty) => (
                    <label key={specialty} className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="radio"
                          name="specialty"
                          checked={selectedSpecialty === specialty}
                          onChange={() => setSelectedSpecialty(specialty)}
                          className="peer h-4 w-4 appearance-none rounded-full border border-slate-300 bg-white checked:border-emerald-500 checked:bg-emerald-500 focus:ring-1 focus:ring-emerald-500 group-hover:border-emerald-400"
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100">
                          <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                        </div>
                      </div>
                      <span className={`text-sm ${selectedSpecialty === specialty ? 'text-emerald-700 font-medium' : 'text-slate-600 group-hover:text-slate-900'}`}>
                        {specialty}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {(selectedRegion !== "Todas" || selectedSpecialty !== "Todas" || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedRegion("Todas");
                    setSelectedSpecialty("Todas");
                    setSearchQuery("");
                  }}
                  className="w-full rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </aside>

          {/* LISTA PRINCIPAL */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <p className="text-slate-600">Cargando artesanos...</p>
              </div>
            ) : filteredArtisans.length === 0 ? (
              <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <div className="mb-4 rounded-full bg-slate-50 p-6">
                  <span className="text-4xl">🧑‍🎨</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  No se encontraron artesanos
                </h3>
                <p className="text-slate-500 max-w-sm">
                  Prueba ajustando tus filtros de búsqueda.
                </p>
                <button
                  onClick={() => {
                    setSelectedRegion("Todas");
                    setSelectedSpecialty("Todas");
                    setSearchQuery("");
                  }}
                  className="mt-6 text-emerald-600 font-semibold hover:underline"
                >
                  Ver todos los artesanos
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredArtisans.map((artisan) => (
                  <div
                    key={artisan.user_id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-emerald-200"
                  >
                    <div className="flex flex-col gap-6 md:flex-row">
                      {/* Avatar y info básica */}
                      <div className="flex flex-col items-center gap-4 md:w-56 flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
                        <div className="relative h-40 w-40 overflow-hidden rounded-full bg-slate-100 ring-4 ring-white shadow-sm">
                          {artisan.avatar_url ? (
                            <Image
                              src={artisan.avatar_url}
                              alt={artisan.name || "Artesano"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-5xl text-slate-300 bg-slate-50">
                              {artisan.name ? artisan.name.charAt(0).toUpperCase() : "A"}
                            </div>
                          )}
                        </div>
                        <div className="text-center w-full">
                          <h3 className="text-xl font-bold text-slate-900">
                            {artisan.name || "Artesano"}
                          </h3>
                          <p className="text-sm font-medium text-emerald-600 mt-1">
                            {artisan.region}
                          </p>
                          {artisan.ciudad && (
                            <p className="text-xs text-slate-500">
                              {artisan.ciudad}
                            </p>
                          )}

                          {artisan.avg_rating > 0 && (
                            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 border border-amber-100">
                              <span className="text-amber-500 text-sm">★</span>
                              <span className="text-sm font-bold text-amber-700">
                                {artisan.avg_rating.toFixed(1)}
                              </span>
                            </div>
                          )}

                          {/* Redes Sociales compactas */}
                          {(artisan.website || artisan.social_media?.instagram || artisan.social_media?.facebook) && (
                            <div className="mt-4 flex justify-center gap-2">
                              {artisan.website && (
                                <a href={artisan.website} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors" title="Sitio Web">
                                  🌐
                                </a>
                              )}
                              {artisan.social_media?.instagram && (
                                <a href={`https://instagram.com/${artisan.social_media.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-colors" title="Instagram">
                                  📷
                                </a>
                              )}
                              {artisan.social_media?.facebook && (
                                <a href={artisan.social_media.facebook} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Facebook">
                                  👤
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Información detallada y Productos */}
                      <div className="flex-1 min-w-0">
                        {/* Bio y badges */}
                        <div className="mb-6">
                          {artisan.bio && (
                            <p className="text-slate-600 text-sm leading-relaxed mb-4">
                              "{artisan.bio}"
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {((artisan.products && artisan.products.length > 0)
                              ? Array.from(new Set(artisan.products.map(p => p.category)))
                              : (artisan.specialties || [])
                            ).map((category, idx) => (
                              <span key={idx} className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                {category}
                              </span>
                            ))}
                            {artisan.certifications?.map((cert, idx) => (
                              <span key={`cert-${idx}`} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                🏅 {cert}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Productos Preview Carousel */}
                        {artisan.products && artisan.products.length > 0 ? (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                                Productos Destacados
                              </h4>
                              {(artisan.total_products_count && artisan.total_products_count > 3) || (artisan.products.length > 3) ? (
                                <button
                                  onClick={() => openArtisanProductsModal(artisan)}
                                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                                >
                                  Ver todos ({artisan.total_products_count || artisan.products.length})
                                </button>
                              ) : null}
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {artisan.products.slice(0, 4).map((product) => (
                                <button
                                  key={product.id}
                                  onClick={() => {
                                    const catalogItem: CatalogItem = {
                                      id: product.id,
                                      name: product.name,
                                      description: null,
                                      category: product.category,
                                      price: product.price,
                                      stock: 0,
                                      images: product.images || [],
                                      materials: [],
                                      dimensions: null,
                                      weight: null,
                                      artisan_name: artisan.name || undefined,
                                      artisan_id: artisan.user_id,
                                      artisan_profiles: {
                                        region: artisan.region,
                                        ciudad: artisan.ciudad || null,
                                        specialties: artisan.specialties,
                                      },
                                      avg_rating: product.avg_rating,
                                      reviews_count: product.reviews_count,
                                    };
                                    openProductModal(catalogItem);
                                  }}
                                  className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-emerald-500 hover:shadow-md text-left h-full"
                                >
                                  <div className="aspect-square relative bg-slate-100">
                                    <Image
                                      src={getProductImage(product)}
                                      alt={product.name}
                                      fill
                                      className="object-cover transition duration-300 group-hover:scale-110"
                                    />
                                  </div>
                                  <div className="p-2.5 flex flex-col flex-1">
                                    <h5 className="text-xs font-semibold text-slate-900 group-hover:text-emerald-600 truncate mb-1">
                                      {product.name}
                                    </h5>
                                    <p className="text-xs font-bold text-emerald-700 mt-auto">
                                      ${product.price.toLocaleString('es-CL')}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center bg-slate-50">
                            <p className="text-sm text-slate-500 italic">Este artesano está preparando su colección.</p>
                          </div>
                        )}

                        <div className="mt-4 flex justify-end md:hidden">
                          <button
                            onClick={() => openArtisanProductsModal(artisan)}
                            className="text-sm font-semibold text-emerald-600 border border-emerald-200 bg-emerald-50 px-4 py-2 rounded-lg w-full"
                          >
                            Ver catálogo completo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <ProductModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={closeProductModal}
        cart={{}}
        onAddToCart={() => { }}
        onSetQuantity={() => { }}
        onDecrement={() => { }}
      />

      {/* Modal de productos del artesano */}
      {isArtisanProductsModalOpen && selectedArtisan && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeArtisanProductsModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      Productos de {selectedArtisan.name || "Artesano"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedArtisan.region}
                      {selectedArtisan.ciudad && `, ${selectedArtisan.ciudad}`}
                    </p>
                  </div>
                  <button
                    onClick={closeArtisanProductsModal}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {loadingArtisanProducts ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-slate-600">Cargando productos...</p>
                  </div>
                ) : artisanProducts.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-slate-600">
                      Este artesano aún no tiene productos disponibles.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {artisanProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          const catalogItem: CatalogItem = {
                            id: product.id,
                            name: product.name,
                            description: product.description,
                            category: product.category,
                            price: product.price,
                            stock: product.stock,
                            images: product.images || [],
                            materials: product.materials || [],
                            dimensions: product.dimensions,
                            weight: product.weight,
                            artisan_name: selectedArtisan.name || undefined,
                            artisan_id: selectedArtisan.user_id,
                            artisan_profiles: {
                              region: selectedArtisan.region,
                              ciudad: selectedArtisan.ciudad || null,
                              specialties: selectedArtisan.specialties,
                            },
                            avg_rating: product.avg_rating,
                            reviews_count: product.reviews_count,
                          };
                          closeArtisanProductsModal();
                          openProductModal(catalogItem);
                        }}
                        className="group rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-500 hover:shadow-md"
                      >
                        <div className="relative mb-3 h-40 w-full overflow-hidden rounded-lg bg-slate-100">
                          <Image
                            src={getProductImage(product)}
                            alt={product.name}
                            fill
                            className="object-cover transition group-hover:scale-105"
                          />
                        </div>
                        <h4 className="mb-1 font-semibold text-slate-900 group-hover:text-emerald-600">
                          {product.name}
                        </h4>
                        <p className="text-sm text-slate-600">{product.category}</p>
                        <p className="mt-1 text-lg font-semibold text-emerald-600">
                          ${product.price.toLocaleString('es-CL')}
                        </p>
                        {product.avg_rating && product.avg_rating > 0 && (
                          <div className="mt-2 flex items-center gap-1">
                            <span className="text-xs text-amber-500">★</span>
                            <span className="text-xs font-semibold text-slate-700">
                              {product.avg_rating.toFixed(1)}
                            </span>
                            {product.reviews_count && product.reviews_count > 0 && (
                              <span className="text-xs text-slate-500">
                                ({product.reviews_count})
                              </span>
                            )}
                          </div>
                        )}
                        {product.stock > 0 && (
                          <p className="mt-1 text-xs text-slate-500">
                            Stock: {product.stock} unidades
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}


