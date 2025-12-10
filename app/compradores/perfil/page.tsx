"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "../../components/top-nav";
import { useAuth } from "../../components/auth-provider";
import Footer from "../../components/footer";
import { Modal } from "../../components/modal";
import { supabase } from "../../lib/supabase";

type BuyerProfile = {
  id?: string;
  user_id: string;
  phone: string | null;
  avatar_url: string | null;
  shipping_addresses: Array<{
    address: string;
    city: string;
    region: string;
    phone: string;
    is_default?: boolean;
  }>;
  preferences: {
    favorite_categories: string[];
    price_range: { min: number | null; max: number | null };
    materials: string[];
    regions: string[];
  };
  notification_preferences: {
    email: boolean;
    new_products: boolean;
    order_updates: boolean;
    promotions: boolean;
  };
};

const chileanRegions = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana",
  "O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén",
  "Magallanes",
];

const productCategories = [
  "Cerámica",
  "Textil",
  "Joyería",
  "Madera",
  "Cuero",
  "Metal",
  "Vidrio",
  "Otro",
];

type ModalType = "contact" | "addresses" | "preferences" | "notifications" | null;

export default function CompradorPerfilPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const [profile, setProfile] = useState<BuyerProfile | null>(null);

  // Estado para nueva dirección (temporal mientras se edita)
  const [newAddress, setNewAddress] = useState({
    address: "",
    city: "",
    region: "Los Lagos",
    phone: "",
    is_default: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/compradores/perfil");
    } else if (user && user.user_metadata?.user_type !== "comprador") {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  async function loadProfile() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/buyer-profile?user_id=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setProfile({
            ...data,
            preferences: {
              favorite_categories: [],
              materials: [],
              regions: [],
              ...(data.preferences || {}),
              // Ensure critical nested objects exist
              price_range: data.preferences?.price_range || { min: null, max: null },
            },
            notification_preferences: {
              email: true,
              new_products: true,
              order_updates: true,
              promotions: false,
              ...(data.notification_preferences || {})
            }
          });
        } else {
          setProfile({
            user_id: user?.id || "",
            phone: null,
            shipping_addresses: [],
            preferences: {
              favorite_categories: [],
              price_range: { min: null, max: null },
              materials: [],
              regions: [],
            },
            notification_preferences: {
              email: true,
              new_products: true,
              order_updates: true,
              promotions: false,
            },
            avatar_url: null,
          });
        }
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!user || !profile) return;

    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/buyer-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({
          user_id: user.id,
          phone: profile.phone,
          shipping_addresses: profile.shipping_addresses,
          preferences: profile.preferences,
          notification_preferences: profile.notification_preferences,
        }),
      });

      if (response.ok) {
        await loadProfile(); // Recargar para confirmar y limpiar estados
        closeModal();
      } else {
        const error = await response.json();
        alert(error.error || "Error al guardar perfil");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar perfil");
    } finally {
      setSaving(false);
    }
  }

  function closeModal() {
    setActiveModal(null);
    // Opcional: Recargar perfil para descartar cambios no guardados
    // loadProfile(); // Esto se hace si cancelan explícitamente, pero cerrar modal == cancelar? 
    // Si queremos que "Cerrar" sea "Cancelar", deberíamos recargar.
    // Pero si el usuario cierra con X, asumiremos que cancela.
    // Sin embargo, como el estado 'profile' ya se mutó con los inputs, SIEMPRE debemos recargar al cancelar/cerrar.
    if (!saving) loadProfile();
  }

  function addAddress() {
    if (!newAddress.address || !newAddress.city || !newAddress.region || !newAddress.phone) {
      alert("Por favor completa todos los campos de la dirección");
      return;
    }

    if (!profile) return;

    const addresses = [...profile.shipping_addresses];

    if (addresses.length === 0 || newAddress.is_default) {
      addresses.forEach(addr => addr.is_default = false);
      newAddress.is_default = true;
    }

    addresses.push({ ...newAddress });
    setProfile({ ...profile, shipping_addresses: addresses });
    setNewAddress({
      address: "",
      city: "",
      region: "Los Lagos",
      phone: "",
      is_default: false,
    });
  }

  function removeAddress(index: number) {
    if (!profile) return;
    const addresses = [...profile.shipping_addresses];
    addresses.splice(index, 1);
    setProfile({ ...profile, shipping_addresses: addresses });
  }

  function toggleCategory(category: string) {
    if (!profile) return;
    const categories = [...profile.preferences.favorite_categories];
    const index = categories.indexOf(category);
    if (index > -1) {
      categories.splice(index, 1);
    } else {
      categories.push(category);
    }
    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        favorite_categories: categories,
      },
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0 || !user || !profile) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    try {
      setUploadingImage(true);
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Actualizar estado local
      const updatedProfile = { ...profile, avatar_url: publicUrl };
      setProfile(updatedProfile);

      // Guardar en BD inmediatamente (solo la URL si fuera posible, pero usamos saveProfile completo o fetch directo)
      // Usaremos un fetch directo ligero para no disparar todo el saveProfile que podría ser pesado o tener datos stale
      // Pero como saveProfile usa el estado 'profile', y acabamos de actualizar 'profile', podríamos llamar saveProfile?
      // No, setProfile es asíncrono, 'updatedProfile' lo tenemos aquí.

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/buyer-profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({
          ...updatedProfile,
          // Asegurar campos requeridos
          user_id: user.id,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error updating profile image");
      }

    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir la imagen.");
    } finally {
      setUploadingImage(false);
    }
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

  if (!user || user.user_metadata?.user_type !== "comprador") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8 lg:px-12">
        <header className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-emerald-600">
              Mi Perfil
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Configuración de Perfil
            </h1>
            <p className="text-base text-slate-600">
              Gestiona tu información personal, direcciones y preferencias.
            </p>
          </div>

          {/* Avatar Upload */}
          {profile && (
            <div className="relative group shrink-0">
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg bg-slate-100">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition hover:bg-emerald-700 hover:scale-105"
                title="Cambiar foto de perfil"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              </label>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
            </div>
          )}
        </header>

        {profile && (
          <div className="grid gap-6 md:grid-cols-2">

            {/* Tarjeta Contacto - SOLO LECTURA */}
            <section className="col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Información de Contacto</h2>
                <button
                  onClick={() => setActiveModal('contact')}
                  className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-600"
                  title="Editar Información de Contacto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</p>
                  <p className="text-sm font-medium text-slate-900 break-all">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Teléfono</p>
                  <p className="text-sm font-medium text-slate-900">
                    {profile.phone || <span className="text-slate-400 italic">No registrado</span>}
                  </p>
                </div>
              </div>
            </section>

            {/* Tarjeta Direcciones - SOLO LECTURA */}
            <section className="col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Direcciones de Envío</h2>
                <button
                  onClick={() => setActiveModal('addresses')}
                  className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-600"
                  title="Gestionar Direcciones"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                {profile.shipping_addresses.length > 0 ? (
                  profile.shipping_addresses.slice(0, 2).map((addr, idx) => (
                    <div key={idx} className="relative rounded-lg bg-slate-50 p-3 border border-slate-100">
                      {addr.is_default && (
                        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                      )}
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{addr.address}</p>
                      <p className="text-xs text-slate-500">{addr.city}, {addr.region}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic">No tienes direcciones guardadas.</p>
                )}
                {profile.shipping_addresses.length > 2 && (
                  <p className="text-xs text-emerald-600 font-medium">+ {profile.shipping_addresses.length - 2} direcciones más</p>
                )}
              </div>
            </section>

            {/* Tarjeta Preferencias - SOLO LECTURA */}
            <section className="col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Preferencias</h2>
                <button
                  onClick={() => setActiveModal('preferences')}
                  className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-600"
                  title="Editar Preferencias"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Categorías Favoritas</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.preferences.favorite_categories.length > 0 ? (
                      profile.preferences.favorite_categories.map(cat => (
                        <span key={cat} className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
                          {cat}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500 italic">Sin categorías favoritas</span>
                    )}
                  </div>
                </div>
                {(profile.preferences.price_range.min || profile.preferences.price_range.max) && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Rango de Precios</p>
                    <p className="text-sm font-medium text-slate-700">
                      {profile.preferences.price_range.min ? `$${profile.preferences.price_range.min.toLocaleString()}` : "0"}
                      {" - "}
                      {profile.preferences.price_range.max ? `$${profile.preferences.price_range.max.toLocaleString()}` : "Sin límite"}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Tarjeta Notificaciones - SOLO LECTURA */}
            <section className="col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Notificaciones</h2>
                <button
                  onClick={() => setActiveModal('notifications')}
                  className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-600"
                  title="Configurar Notificaciones"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
              </div>
              <ul className="space-y-2">
                {Object.entries(profile.notification_preferences).map(([key, value]) => (
                  value && (
                    <li key={key} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="text-emerald-500">✓</span>
                      {key === "email" && "Notificaciones por email"}
                      {key === "new_products" && "Nuevos productos"}
                      {key === "order_updates" && "Actualizaciones de pedidos"}
                      {key === "promotions" && "Promociones"}
                    </li>
                  )
                ))}
                {!Object.values(profile.notification_preferences).some(Boolean) && (
                  <li className="text-sm text-slate-500 italic">Todas las notificaciones desactivadas</li>
                )}
              </ul>
            </section>
          </div>
        )}

        {/* MODALES */}
        {/* Modal Contacto */}
        <Modal
          isOpen={activeModal === 'contact'}
          onClose={closeModal}
          title="Editar Información de Contacto"
        >
          {profile && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Teléfono</label>
                <input
                  type="tel"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="+569..."
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input type="email" value={user.email || ""} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500" />
                <p className="mt-1 text-xs text-slate-500">El email no es editable.</p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={closeModal} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button onClick={saveProfile} disabled={saving} className="rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal Direcciones */}
        <Modal
          isOpen={activeModal === 'addresses'}
          onClose={closeModal}
          title="Gestionar Direcciones de Envío"
        >
          {profile && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              <div className="space-y-3">
                {profile.shipping_addresses.map((addr, index) => (
                  <div key={index} className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      {addr.is_default && <span className="mb-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Principal</span>}
                      <p className="font-semibold text-slate-900">{addr.address}</p>
                      <p className="text-xs text-slate-600">{addr.city}, {addr.region}</p>
                    </div>
                    <button onClick={() => removeAddress(index)} className="ml-2 text-red-500 hover:text-red-700 text-sm font-semibold">Eliminar</button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-900">Agregar Nueva Dirección</h4>
                <div className="space-y-3">
                  <input type="text" value={newAddress.address} onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })} placeholder="Dirección" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} placeholder="Ciudad" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    <select value={newAddress.region} onChange={(e) => setNewAddress({ ...newAddress, region: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      {chileanRegions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <input type="tel" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} placeholder="Teléfono de contacto" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="is_default_new" checked={newAddress.is_default} onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })} className="rounded border-slate-300 text-emerald-600" />
                    <label htmlFor="is_default_new" className="text-xs text-slate-700">Marcar como principal</label>
                  </div>
                  <button onClick={addAddress} className="w-full rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900">Agregar a la lista</button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={closeModal} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button onClick={saveProfile} disabled={saving} className="rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{saving ? "Guardando..." : "Guardar Cambios"}</button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal Preferencias */}
        <Modal
          isOpen={activeModal === 'preferences'}
          onClose={closeModal}
          title="Editar Preferencias"
        >
          {profile && (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Categorías Favoritas</label>
                <div className="flex flex-wrap gap-2">
                  {productCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${profile.preferences.favorite_categories.includes(cat) ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Precio Mínimo</label>
                  <input
                    type="number"
                    value={profile.preferences.price_range.min || ""}
                    onChange={(e) => setProfile({ ...profile, preferences: { ...profile.preferences, price_range: { ...profile.preferences.price_range, min: e.target.value ? parseInt(e.target.value) : null } } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="0"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Precio Máximo</label>
                  <input
                    type="number"
                    value={profile.preferences.price_range.max || ""}
                    onChange={(e) => setProfile({ ...profile, preferences: { ...profile.preferences, price_range: { ...profile.preferences.price_range, max: e.target.value ? parseInt(e.target.value) : null } } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Sin límite"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={closeModal} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button onClick={saveProfile} disabled={saving} className="rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal Notificaciones */}
        <Modal
          isOpen={activeModal === 'notifications'}
          onClose={closeModal}
          title="Preferencias de Notificaciones"
        >
          {profile && (
            <div className="space-y-4">
              {Object.entries(profile.notification_preferences).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setProfile({ ...profile, notification_preferences: { ...profile.notification_preferences, [key]: e.target.checked } })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {key === "email" && "Recibir emails"}
                    {key === "new_products" && "Alertas de nuevos productos"}
                    {key === "order_updates" && "Estados del pedido"}
                    {key === "promotions" && "Ofertas y promociones"}
                  </span>
                </label>
              ))}
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={closeModal} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button onClick={saveProfile} disabled={saving} className="rounded-xl bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button>
              </div>
            </div>
          )}
        </Modal>

      </div>
      <Footer />
    </div>
  );
}
