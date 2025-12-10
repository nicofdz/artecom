"use client";

import { useState } from "react";
import { TopNav } from "../../components/top-nav";

export default function SeedPage() {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    async function handleSeed() {
        if (!confirm("¿Estás seguro? Esto creará nuevos usuarios de prueba.")) return;

        setLoading(true);
        setLogs([]);
        try {
            const response = await fetch("/api/seed", {
                method: "POST",
            });

            const reader = response.body?.getReader();
            if (!reader) return;

            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const text = decoder.decode(value);
                // Split by newlines in case multiple chunks come together
                const lines = text.split("\n").filter(Boolean);
                setLogs((prev) => [...prev, ...lines]);
            }
        } catch (error) {
            console.error(error);
            setLogs((prev) => [...prev, "Error fatal al ejecutar el seed."]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            <TopNav />
            <div className="mx-auto max-w-2xl px-4 py-12">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h1 className="mb-2 text-2xl font-bold text-slate-900">
                        Generador de Datos de Prueba
                    </h1>
                    <p className="mb-6 text-slate-600">
                        Esta herramienta creará 4 compradores y 4 artesanos con perfiles completos para pruebas.
                    </p>

                    <div className="mb-8 rounded-lg bg-amber-50 p-4 text-sm text-amber-800 border border-amber-200">
                        <strong>Nota:</strong> Requiere <code>SUPABASE_SERVICE_ROLE_KEY</code> configurada en el servidor.
                    </div>

                    <button
                        onClick={handleSeed}
                        disabled={loading}
                        className="w-full rounded-xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-emerald-600/30 disabled:opacity-50"
                    >
                        {loading ? "Generando datos..." : "Generar Datos de Prueba"}
                    </button>

                    {logs.length > 0 && (
                        <div className="mt-8 rounded-xl bg-slate-900 p-4 font-mono text-xs text-emerald-400 shadow-inner max-h-96 overflow-y-auto">
                            {logs.map((log, i) => (
                                <div key={i} className="mb-1 border-b border-slate-800/50 pb-1 last:border-0">
                                    {log}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
