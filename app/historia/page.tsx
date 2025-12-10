"use client";

import Link from "next/link";
import { TopNav } from "../components/top-nav";
import Footer from "../components/footer";

export default function HistoriaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <TopNav />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-16 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
        >
          ← Volver al inicio
        </Link>

        <header className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
            Nuestra Historia
          </p>
          <h1 className="text-4xl font-semibold text-white">
            ArteCom: Conectando Artesanos con Compradores
          </h1>
        </header>

        <section className="space-y-6 rounded-3xl border border-white/10 bg-slate-900/40 px-6 py-10 sm:px-10">
          <div className="space-y-4 text-emerald-100">
            <p className="text-lg leading-relaxed">
              ArteCom nació de la necesidad de fortalecer la conexión entre los artesanos 
              chilenos y los compradores que valoran productos únicos, hechos a mano y con 
              identidad local. Buscamos crear un espacio donde la artesanía tradicional y 
              contemporánea encuentre su lugar en el mercado digital.
            </p>

            <p className="leading-relaxed">
              En un contexto donde los artesanos enfrentan desafíos como la falta de canales 
              de comercialización, intermediarios que reducen sus márgenes, y la dificultad 
              para llegar a compradores que aprecian el valor de lo artesanal, identificamos 
              la oportunidad de crear una plataforma que acorte distancias y genere valor tanto 
              para creadores como para compradores.
            </p>

            <p className="leading-relaxed">
              Nuestra misión es promover el comercio justo, preservar las técnicas artesanales 
              tradicionales, y mejorar los ingresos de los artesanos al eliminar intermediarios 
              innecesarios. Creemos firmemente que la tecnología puede ser un puente que conecte 
              de manera eficiente y sostenible a quienes crean productos únicos con quienes 
              buscan piezas auténticas y con historia.
            </p>

            <p className="leading-relaxed">
              ArteCom se posiciona como un marketplace especializado que no solo facilita 
              transacciones, sino que también promueve prácticas de comercio justo, preserva 
              el patrimonio artesanal chileno y fortalece la economía local y sostenible.
            </p>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-slate-900/40 px-6 py-10 sm:px-10 md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Nuestra Visión</h2>
            <p className="text-emerald-100 leading-relaxed">
              Ser la plataforma líder en Chile para la comercialización directa de productos 
              artesanales, contribuyendo a una economía más sostenible, justa y que preserve 
              el patrimonio cultural artesanal.
            </p>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Nuestros Valores</h2>
            <ul className="space-y-2 text-emerald-100">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Transparencia en precios y procesos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Comercio justo y apoyo a artesanos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Preservación del patrimonio artesanal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                <span>Sostenibilidad y economía circular</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}


