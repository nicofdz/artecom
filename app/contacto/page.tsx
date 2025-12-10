"use client";

import { TopNav } from "../components/top-nav";
import Footer from "../components/footer";
import { Mail, MapPin, Phone, MessageSquare, Send } from "lucide-react";

export default function ContactoPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white">
            <TopNav />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-24 pt-12 sm:px-8 lg:px-12">
                {/* Header Section */}
                <header className="text-center space-y-4">
                    <p className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.2em] text-emerald-300">
                        Contáctanos
                    </p>
                    <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                        Estamos aquí para ayudarte
                    </h1>
                    <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                        ¿Tienes preguntas sobre un producto o necesitas ayuda con un pedido?
                        Ponte en contacto con nuestro equipo.
                    </p>
                </header>

                <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
                    {/* Contact Information */}
                    <div className="space-y-8">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
                            <h2 className="text-2xl font-semibold text-white mb-6">Información de Contacto</h2>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">Correo Electrónico</h3>
                                        <p className="text-slate-400 mt-1">contacto@artecom.cl</p>
                                        <p className="text-sm text-slate-500 mt-1">Respondemos en menos de 24 horas</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                                        <Phone className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">Teléfono</h3>
                                        <p className="text-slate-400 mt-1">+56 9 1234 5678</p>
                                        <p className="text-sm text-slate-500 mt-1">Lunes a Viernes, 9:00 - 18:00</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">Ubicación</h3>
                                        <p className="text-slate-400 mt-1">Av. Providencia 1234, Oficina 505</p>
                                        <p className="text-sm text-slate-500 mt-1">Santiago, Chile</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FAQ Preview */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-white px-2">Preguntas Frecuentes</h3>
                            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                                <h4 className="font-medium text-emerald-300 mb-2">¿Cómo funcionan los envíos?</h4>
                                <p className="text-sm text-slate-400">
                                    Los envíos son coordinados directamente por cada artesano. Recibirás un número de seguimiento una vez despachado el producto.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
                                <h4 className="font-medium text-emerald-300 mb-2">¿Puedo devolver un producto?</h4>
                                <p className="text-sm text-slate-400">
                                    Sí, tienes 10 días desde la recepción para solicitar cambios o devoluciones si el producto no cumple con lo descrito.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="rounded-3xl border border-white/10 bg-white p-8 shadow-xl">
                        <h2 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
                            <MessageSquare className="h-6 w-6 text-emerald-600" />
                            Envíanos un mensaje
                        </h2>

                        <form className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium text-slate-700">
                                        Nombre completo
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        placeholder="Juan Pérez"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-slate-700">
                                        Correo electrónico
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        placeholder="juan@ejemplo.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="subject" className="text-sm font-medium text-slate-700">
                                    Asunto
                                </label>
                                <select
                                    id="subject"
                                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                                    required
                                >
                                    <option value="">Selecciona un asunto</option>
                                    <option value="pedido">Consulta sobre mi pedido</option>
                                    <option value="producto">Información de producto</option>
                                    <option value="artesano">Quiero ser artesano</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-medium text-slate-700">
                                    Mensaje
                                </label>
                                <textarea
                                    id="message"
                                    rows={5}
                                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                                    placeholder="Escribe tu mensaje aquí..."
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                                <Send className="h-5 w-5" />
                                Enviar Mensaje
                            </button>

                            <p className="text-xs text-center text-slate-500 mt-4">
                                Al enviar este formulario aceptas nuestra política de privacidad.
                            </p>
                        </form>
                    </div>
                </div>

                <Footer />
            </div>
        </div>
    );
}
