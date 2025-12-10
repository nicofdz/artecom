"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TopNav } from "./components/top-nav";
import Footer from "./components/footer";
import { ArrowRight, ShoppingBag, Star, Tag } from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  artisan_name?: string;
};

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products?sort_by=recent&limit=12");
        const data = await res.json();
        if (Array.isArray(data)) {
          setFeaturedProducts(data.slice(0, 12));
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopNav />

      {/* Hero Section - Carousel */}
      <section className="relative h-[500px] w-full overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-40">
          {/* Placeholder for hero image if we had one, using gradient for now */}
          <div className="h-full w-full bg-gradient-to-r from-blue-900 to-emerald-900" />
        </div>
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Artesanía Chilena <br />
              <span className="text-emerald-400">Única y Auténtica</span>
            </h1>
            <p className="mb-8 text-xl text-slate-200">
              Descubre productos hechos a mano por talentosos artesanos locales.
              Apoya el comercio justo y lleva a casa un pedazo de nuestra cultura.
            </p>
            <div className="flex gap-4">
              <Link
                href="/catalogo"
                className="inline-flex items-center rounded-full bg-emerald-500 px-8 py-3 text-base font-semibold text-white transition hover:bg-emerald-600"
              >
                Ver Catálogo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/sobre-nosotros"
                className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Conócenos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="px-6 py-16">
        <h2 className="mb-8 text-2xl font-bold text-slate-900">Categorías Populares</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {[
            { name: "Textiles", color: "bg-orange-100 text-orange-800" },
            { name: "Cerámica", color: "bg-blue-100 text-blue-800" },
            { name: "Madera", color: "bg-amber-100 text-amber-800" },
            { name: "Joyería", color: "bg-purple-100 text-purple-800" },
            { name: "Cestería", color: "bg-green-100 text-green-800" },
            { name: "Cuero", color: "bg-yellow-100 text-yellow-800" },
          ].map((cat) => (
            <Link
              key={cat.name}
              href={`/catalogo?category=${cat.name}`}
              className={`flex h-32 items-center justify-center rounded-2xl ${cat.color} text-xl font-bold transition hover:scale-105 hover:shadow-lg`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-white py-16">
        <div className="px-6">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Novedades</h2>
            <Link href="/catalogo" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Ver todo &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/producto/${product.id}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-xl"
                >
                  <div className="aspect-square w-full overflow-hidden bg-slate-100">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ShoppingBag className="h-12 w-12 opacity-20" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-xs font-medium text-emerald-600">{product.category}</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-slate-500">{product.artisan_name || "Artesano Local"}</p>
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-900">
                        ${product.price.toLocaleString("es-CL")}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition group-hover:bg-emerald-500 group-hover:text-white">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Offers / Banner */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-emerald-900 px-6 py-16 shadow-2xl sm:px-12 sm:py-24 lg:px-16">
          <div className="relative z-10 flex flex-col items-center text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Ofertas de Temporada
            </h2>
            <p className="mb-8 max-w-2xl text-lg text-emerald-100">
              Aprovecha descuentos especiales en productos seleccionados.
              Apoya a nuestros artesanos y lleva calidad a tu hogar.
            </p>
            <Link
              href="/catalogo?sort_by=price_asc"
              className="inline-flex items-center rounded-full bg-white px-8 py-3 text-base font-bold text-emerald-900 transition hover:bg-emerald-50"
            >
              Ver Ofertas
              <Tag className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {/* Decorative circles */}
          <div className="absolute left-0 top-0 -ml-24 -mt-24 h-96 w-96 rounded-full bg-emerald-800 opacity-50 blur-3xl" />
          <div className="absolute bottom-0 right-0 -mb-24 -mr-24 h-96 w-96 rounded-full bg-blue-900 opacity-50 blur-3xl" />
        </div>
      </section>

      <Footer />
    </div>
  );
}
