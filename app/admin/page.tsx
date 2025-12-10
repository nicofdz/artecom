"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "../components/top-nav";
import { useAuth } from "../components/auth-provider";
import Footer from "../components/footer";
import { supabase } from "../lib/supabase";

type Stats = {
  users: {
    artisans: number;
  };
  products: {
    total: number;
    active: number;
    inactive: number;
  };
  orders: {
    total: number;
    byStatus: Record<string, number>;
  };
  reviews: {
    total: number;
    averageRating: number;
  };
  revenue: {
    total: number;
    history?: { date: string; amount: number }[];
  };
};

type User = {
  id: string;
  email: string;
  name: string | null;
  user_type: string | null;
  is_admin: boolean;
  banned_until?: string | null;
  created_at: string;
};

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  user_id: string;
};

type Order = {
  id: string;
  buyer_id: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "products" | "orders">("dashboard");
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/admin");
    } else if (user && !user.user_metadata?.is_admin) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.user_metadata?.is_admin) {
      loadData();
    }
  }, [user, activeTab]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const token = session.access_token;

      // Cargar estadísticas
      if (activeTab === "dashboard") {
        const statsResponse = await fetch("/api/admin?action=stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (statsResponse.ok) {
          const data = await statsResponse.json();
          if (data.stats) {
            setStats(data.stats);
          } else {
            throw new Error("Formato de respuesta inválido");
          }
        } else {
          const errorData = await statsResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${statsResponse.status}: ${statsResponse.statusText}`);
        }
      }

      // Cargar usuarios
      if (activeTab === "users") {
        const usersResponse = await fetch("/api/admin?action=users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (usersResponse.ok) {
          const data = await usersResponse.json();
          setUsers(data.users || []);
        } else {
          const errorData = await usersResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${usersResponse.status}: ${usersResponse.statusText}`);
        }
      }

      // Cargar productos
      if (activeTab === "products") {
        const productsResponse = await fetch("/api/admin?action=products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (productsResponse.ok) {
          const data = await productsResponse.json();
          setProducts(data.products || []);
        } else {
          const errorData = await productsResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${productsResponse.status}: ${productsResponse.statusText}`);
        }
      }

      // Cargar pedidos
      if (activeTab === "orders") {
        const ordersResponse = await fetch("/api/admin?action=orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (ordersResponse.ok) {
          const data = await ordersResponse.json();
          setOrders(data.orders || []);
        } else {
          const errorData = await ordersResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Error ${ordersResponse.status}: ${ordersResponse.statusText}`);
        }
      }
    } catch (err: any) {
      console.error("Error:", err);
      const errorMessage = err.message || "Error al cargar datos";
      setError(errorMessage);

      // Si es error de autorización, redirigir
      if (errorMessage.includes("No autorizado") || errorMessage.includes("403")) {
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  }

  async function toggleProductStatus(productId: string, currentStatus: boolean) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: "product",
          id: productId,
          updates: { is_active: !currentStatus },
        }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Error al actualizar producto");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar producto");
    }
  }

  async function deleteProduct(productId: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: "delete_product",
          id: productId,
        }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Error al eliminar producto");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar producto");
    }
  }

  async function toggleUserAdmin(userId: string, currentAdminStatus: boolean) {
    if (!confirm(`¿Estás seguro de que deseas ${currentAdminStatus ? "quitar" : "otorgar"} permisos de administrador a este usuario?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: "user",
          id: userId,
          updates: { is_admin: !currentAdminStatus },
        }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Error al actualizar usuario");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar usuario");
    }
  }

  async function toggleUserBan(userId: string, isBanned: boolean) {
    if (!confirm(`¿Estás seguro de que deseas ${isBanned ? "desbanear" : "banear"} a este usuario?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Si vamos a banear, establecemos una fecha muy lejana (100 años)
      // Si vamos a desbanear, establecemos "none"
      const banDuration = isBanned ? "none" : "876000h"; // 100 años

      const response = await fetch("/api/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: "user",
          id: userId,
          updates: { ban_duration: banDuration },
        }),
      });

      if (response.ok) {
        await loadData();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Error al actualizar estado de baneo");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar estado de baneo");
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <TopNav />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.user_metadata?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-emerald-600">
            Panel de Administración
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Gestión del Marketplace
          </h1>
          <p className="text-base text-slate-600">
            Administra usuarios, productos, pedidos y revisa estadísticas del sistema.
          </p>
        </header>

        {/* Tabs */}
        <nav className="flex gap-2 border-b border-slate-200">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "users", label: "Usuarios" },
            { id: "products", label: "Productos" },
            { id: "orders", label: "Pedidos" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-semibold transition ${activeTab === tab.id
                ? "border-b-2 border-emerald-500 text-emerald-600"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">{error}</p>
            <button
              onClick={loadData}
              className="mt-2 rounded-lg border border-red-500 bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Dashboard */}
        {activeTab === "dashboard" && stats && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">Artesanos Registrados</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.users.artisans}</p>
              <p className="mt-1 text-xs text-slate-500">Con perfil completo</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">Productos</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.products.total}</p>
              <p className="mt-1 text-xs text-slate-500">
                {stats.products.active} activos, {stats.products.inactive} inactivos
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">Pedidos</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.orders.total}</p>
              <p className="mt-1 text-xs text-slate-500">
                {Object.entries(stats.orders.byStatus).map(([status, count]) => (
                  <span key={status} className="mr-2">
                    {status}: {count}
                  </span>
                ))}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">Ingresos Totales</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                ${stats.revenue.total.toLocaleString("es-CL")}
              </p>
              <p className="mt-1 text-xs text-slate-500">Pedidos pagados</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-600">Reseñas</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.reviews.total}</p>
              <p className="mt-1 text-xs text-slate-500">
                Valoración promedio: {stats.reviews.averageRating.toFixed(1)} ⭐
              </p>
            </div>

            {/* Sales Chart */}
            <div className="col-span-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Ventas (Últimos 7 días)</h3>
              <div className="flex h-48 items-end gap-2">
                {stats.revenue.history?.map((day: any) => {
                  const maxAmount = Math.max(...(stats.revenue.history?.map((d: any) => d.amount) || [1]));
                  const heightPercentage = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;

                  return (
                    <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t bg-emerald-500 transition-all hover:bg-emerald-600"
                        style={{ height: `${Math.max(heightPercentage, 2)}%` }}
                        title={`$${day.amount.toLocaleString("es-CL")}`}
                      ></div>
                      <span className="text-xs text-slate-500">
                        {new Date(day.date).toLocaleDateString("es-CL", { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
                {(!stats.revenue.history || stats.revenue.history.length === 0) && (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    No hay datos de ventas recientes
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Usuarios */}
        {activeTab === "users" && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Lista de Usuarios</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Admin</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Registro</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-900">
                        {u.email || "—"}
                        {u.banned_until && new Date(u.banned_until) > new Date() && (
                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                            Baneado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{u.name || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{u.user_type || "—"}</td>
                      <td className="px-6 py-4 text-sm">
                        {u.is_admin ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Sí
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(u.created_at)}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleUserAdmin(u.id, u.is_admin)}
                            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${u.is_admin
                              ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            disabled={u.id === user?.id}
                            title={u.id === user?.id ? "No puedes cambiar tus propios permisos" : ""}
                          >
                            {u.is_admin ? "Quitar Admin" : "Hacer Admin"}
                          </button>

                          <button
                            onClick={() => toggleUserBan(u.id, !!(u.banned_until && new Date(u.banned_until) > new Date()))}
                            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${u.banned_until && new Date(u.banned_until) > new Date()
                              ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                              }`}
                            disabled={u.id === user?.id || u.is_admin}
                            title={u.id === user?.id ? "No puedes banearte a ti mismo" : u.is_admin ? "No puedes banear a un administrador" : ""}
                          >
                            {u.banned_until && new Date(u.banned_until) > new Date() ? "Desbanear" : "Banear"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Productos */}
        {activeTab === "products" && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Lista de Productos</h2>
              <div className="flex gap-2">
                <select
                  className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-600"
                  onChange={(e) => {
                    const val = e.target.value;
                    // Filter logic would go here if we had client-side filtering or reload
                    // For now, let's just implement client-side filtering
                    const rows = document.querySelectorAll(".product-row");
                    rows.forEach((row: any) => {
                      if (val === "all") row.style.display = "";
                      else if (val === "active" && row.dataset.status === "true") row.style.display = "";
                      else if (val === "inactive" && row.dataset.status === "false") row.style.display = "";
                      else row.style.display = "none";
                    });
                  }}
                >
                  <option value="all">Todos</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Categoría</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Precio</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {products.map((p) => (
                    <tr key={p.id} className="product-row hover:bg-slate-50" data-status={p.is_active}>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{p.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{p.category}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">${p.price.toLocaleString("es-CL")}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{p.stock}</td>
                      <td className="px-6 py-4 text-sm">
                        {p.is_active ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Activo
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleProductStatus(p.id, p.is_active)}
                            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${p.is_active
                              ? "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                              : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                          >
                            {p.is_active ? "Desactivar" : "Activar"}
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pedidos */}
        {activeTab === "orders" && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Lista de Pedidos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-mono text-slate-600">{o.id.slice(0, 8)}...</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                        ${o.total_amount.toLocaleString("es-CL")}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                          {o.order_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {o.payment_status === "pagado" ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Pagado
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

