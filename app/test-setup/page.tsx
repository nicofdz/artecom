"use client";

import { useState } from "react";
import { TopNav } from "../components/top-nav";
import Footer from "../components/footer";

export default function TestSetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function createTestUsers() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/test-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || "Error al crear usuarios");
      }
    } catch (err: any) {
      setError(err.message || "Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-emerald-600">
            Configuración de Pruebas
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Crear Usuarios de Prueba
          </h1>
          <p className="text-base text-slate-600">
            Crea cuentas de comprador y artesano para probar el marketplace.
          </p>
        </header>

        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 sm:px-10">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Usuarios que se crearán:
              </h2>
              
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <h3 className="font-semibold text-emerald-900 mb-2">Comprador</h3>
                  <p className="text-sm text-emerald-700">
                    <strong>Email:</strong> comprador@test.com<br />
                    <strong>Contraseña:</strong> comprador123
                  </p>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Artesano</h3>
                  <p className="text-sm text-blue-700">
                    <strong>Email:</strong> artesano@test.com<br />
                    <strong>Contraseña:</strong> artesano123
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={createTestUsers}
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Creando usuarios..." : "Crear Usuarios de Prueba"}
            </button>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <strong>Error:</strong> {error}
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <strong>¡Usuarios creados exitosamente!</strong>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Credenciales:</h3>
                  
                  {result.results?.buyer?.created && (
                    <div className="mb-4 p-3 rounded-lg bg-white">
                      <p className="font-semibold text-slate-900 mb-1">Comprador:</p>
                      <p className="text-sm text-slate-700">Email: comprador@test.com</p>
                      <p className="text-sm text-slate-700">Contraseña: comprador123</p>
                    </div>
                  )}

                  {result.results?.artisan?.created && (
                    <div className="mb-4 p-3 rounded-lg bg-white">
                      <p className="font-semibold text-slate-900 mb-1">Artesano:</p>
                      <p className="text-sm text-slate-700">Email: artesano@test.com</p>
                      <p className="text-sm text-slate-700">Contraseña: artesano123</p>
                    </div>
                  )}

                  {result.results?.buyer?.exists && (
                    <div className="mb-2 p-2 rounded-lg bg-yellow-50 text-yellow-700 text-sm">
                      ⚠️ El comprador ya existe
                    </div>
                  )}

                  {result.results?.artisan?.exists && (
                    <div className="mb-2 p-2 rounded-lg bg-yellow-50 text-yellow-700 text-sm">
                      ⚠️ El artesano ya existe
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">
                      Puedes iniciar sesión con estas credenciales en <a href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">/auth/login</a>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}



