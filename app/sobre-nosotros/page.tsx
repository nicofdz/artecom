"use client";

import Link from "next/link";
import { TopNav } from "../components/top-nav";
import { useAuth } from "../components/auth-provider";
import Footer from "../components/footer";

const beneficios = [
    {
        title: "Para Artesanos",
        items: [
            "Publica tus productos artesanales y gestiona tu inventario fácilmente",
            "Conecta directamente con compradores que valoran lo artesanal",
            "Recibe pedidos organizados y gestiona tus ventas",
            "Aumenta tus ventas y promueve el comercio justo",
        ],
    },
    {
        title: "Para Compradores",
        items: [
            "Accede a productos artesanales únicos de artesanos chilenos",
            "Catálogo completo con precios transparentes",
            "Compra productos artesanales de calidad directamente del creador",
            "Gestiona tus compras y revisa tu historial de pedidos",
        ],
    },
];

const caracteristicas = [
    {
        icon: "🎨",
        title: "Productos Artesanales",
        description: "Conectamos artesanos chilenos con compradores que valoran productos únicos y hechos a mano.",
    },
    {
        icon: "💰",
        title: "Precios Transparentes",
        description: "Todos los precios son claros desde el inicio, sin sorpresas ni negociaciones complicadas.",
    },
    {
        icon: "⭐",
        title: "Sistema de Reseñas",
        description: "Valora y reseña productos y artesanos para ayudar a otros compradores a tomar decisiones informadas.",
    },
    {
        icon: "📱",
        title: "Fácil de Usar",
        description: "Plataforma intuitiva diseñada para que cualquier persona pueda usarla sin complicaciones.",
    },
];

export default function SobreNosotros() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-900 via-slate-950 to-black text-white">
            <TopNav />
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-24 pt-12 sm:px-8 lg:px-12">
                <header className="flex flex-col gap-8 rounded-3xl bg-white/5 px-6 py-10 backdrop-blur-md sm:px-10 lg:flex-row lg:items-center lg:gap-16">
                    <div className="flex-1 space-y-6">
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-blue-300">
                            Sobre Nosotros
                        </p>
                        <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                            Conectamos artesanos locales con compradores que valoran lo único y artesanal
                        </h1>
                        <p className="text-lg text-blue-200 sm:text-xl">
                            Plataforma digital que facilita la conexión entre artesanos chilenos y compradores interesados en productos artesanales únicos.
                            Nuestro objetivo es promover el comercio justo, reducir intermediarios y apoyar a los artesanos locales,
                            fomentando el consumo de productos sustentables y de calidad hechos a mano.
                        </p>
                        {!user && (
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Link
                                    href="/auth/registro"
                                    className="rounded-full bg-white px-6 py-3 text-center text-base font-semibold text-blue-900 transition hover:bg-blue-50"
                                >
                                    Crear cuenta
                                </Link>
                                <Link
                                    href="/auth/login"
                                    className="rounded-full border border-white/40 px-6 py-3 text-center text-base font-semibold text-white transition hover:bg-white/10"
                                >
                                    Iniciar sesión
                                </Link>
                            </div>
                        )}
                        {user && (
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Link
                                    href="/catalogo"
                                    className="rounded-full bg-white px-6 py-3 text-center text-base font-semibold text-blue-900 transition hover:bg-blue-50"
                                >
                                    Ver catálogo
                                </Link>
                                <Link
                                    href="/artesanos"
                                    className="rounded-full border border-white/40 px-6 py-3 text-center text-base font-semibold text-white transition hover:bg-white/10"
                                >
                                    Ver artesanos
                                </Link>
                            </div>
                        )}
                    </div>
                </header>

                <section className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 sm:px-10">
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-semibold text-white">¿Qué es nuestro Marketplace?</h2>
                        <p className="mt-4 text-lg text-blue-200">
                            Una plataforma digital que simplifica la compra y venta de productos artesanales chilenos
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {caracteristicas.map((feature) => (
                            <div
                                key={feature.title}
                                className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center"
                            >
                                <div className="mb-4 text-4xl">{feature.icon}</div>
                                <h3 className="mb-2 text-xl font-semibold text-white">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-blue-200">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="grid gap-6 rounded-3xl border border-white/10 bg-slate-900/40 px-6 py-10 sm:px-10 lg:grid-cols-2">
                    {beneficios.map((beneficio) => (
                        <article
                            key={beneficio.title}
                            className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl"
                        >
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">
                                    {beneficio.title}
                                </h2>
                            </div>
                            <ul className="space-y-3 text-sm text-slate-600">
                                {beneficio.items.map((item, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-blue-700" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 sm:px-10">
                    <div className="mb-8">
                        <h2 className="text-3xl font-semibold text-white">¿Cómo funciona?</h2>
                        <p className="mt-4 text-lg text-blue-200">
                            El proceso es simple y está diseñado para facilitar la conexión entre artesanos y compradores
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-lg font-semibold text-white">
                                    1
                                </div>
                                <h3 className="text-xl font-semibold text-white">
                                    Regístrate
                                </h3>
                            </div>
                            <p className="text-sm text-emerald-100">
                                Crea tu cuenta como artesano o comprador. El proceso es rápido y sencillo,
                                solo necesitas proporcionar información básica.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-lg font-semibold text-white">
                                    2
                                </div>
                                <h3 className="text-xl font-semibold text-white">
                                    Explora o Publica
                                </h3>
                            </div>
                            <p className="text-sm text-emerald-100">
                                Si eres artesano, publica tus productos con precios y disponibilidad.
                                Si eres comprador, explora el catálogo de productos artesanales disponibles.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-lg font-semibold text-white">
                                    3
                                </div>
                                <h3 className="text-xl font-semibold text-white">
                                    Realiza Pedidos
                                </h3>
                            </div>
                            <p className="text-sm text-emerald-100">
                                Los compradores pueden armar pedidos con múltiples productos de diferentes artesanos
                                en un solo lugar, simplificando el proceso de compra.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-lg font-semibold text-white">
                                    4
                                </div>
                                <h3 className="text-xl font-semibold text-white">
                                    Recibe y Entrega
                                </h3>
                            </div>
                            <p className="text-sm text-emerald-100">
                                Coordina la entrega de tus productos. Los artesanos envían directamente a tu dirección,
                                con seguimiento y notificaciones en cada paso.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 sm:px-10">
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-semibold text-white">¿Por qué elegir nuestro Marketplace?</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
                            <h3 className="mb-3 text-xl font-semibold text-white">
                                Economía Local
                            </h3>
                            <p className="text-sm text-emerald-100">
                                Fortalecemos la economía local conectando directamente a artesanos con compradores,
                                eliminando intermediarios y mejorando los ingresos de los artesanos.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
                            <h3 className="mb-3 text-xl font-semibold text-white">
                                Productos Únicos
                            </h3>
                            <p className="text-sm text-emerald-100">
                                Accede a productos artesanales únicos hechos a mano por artesanos chilenos.
                                Calidad y autenticidad garantizadas directamente del creador.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
                            <h3 className="mb-3 text-xl font-semibold text-white">
                                Sostenibilidad
                            </h3>
                            <p className="text-sm text-emerald-100">
                                Promovemos el comercio justo y productos sustentables, apoyando a artesanos locales
                                y fomentando el consumo responsable de productos artesanales.
                            </p>
                        </div>
                    </div>
                </section>

                <Footer />
            </div>
        </div>
    );
}
