"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "../../components/top-nav";
import { useAuth } from "../../components/auth-provider";
import Footer from "../../components/footer";
import { supabase } from "../../lib/supabase";

type ArtisanProfile = {
  id?: string;
  user_id: string;
  bio: string | null;
  region: string;
  ciudad: string | null;
  phone: string | null;
  website: string | null;
  social_media: Record<string, string> | null;
  certifications: string[] | null;
  specialties: string[] | null;
  avatar_url: string | null;
};

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  is_active: boolean;
  images: string[];
  created_at: string;
};

type Order = {
  id: string;
  buyer_id: string;
  total_amount: number;
  order_status: string;
  payment_status: string;
  created_at: string;
  order_items: Array<{
    quantity: number;
    products: {
      name: string;
    };
  }>;
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

export default function PerfilArtesanoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ArtisanProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    bio: "",
    region: "Los Lagos",
    ciudad: "",
    phone: "",
    website: "",
    certifications: [] as string[],
    specialties: [] as string[],
    certificationInput: "",
    specialtyInput: "",
    social_media: {
      instagram: "",
      facebook: "",
      twitter: "",
    },
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login?redirect=/artesanos/perfil");
      } else if (user.user_metadata?.user_type !== "artesano") {
        alert("Esta sección es solo para artesanos.");
        router.push("/catalogo");
      } else {
        loadData();
      }
    }
  }, [user, authLoading, router]);

  async function loadData() {
    if (!user?.id) return;

    try {
      setLoading(true);
      await Promise.all([loadProfile(), loadProducts(), loadOrders()]);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile() {
    if (!user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/artisan-profile?user_id=${user.id}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setProfile(data);
          setFormData({
            bio: data.bio || "",
            region: data.region || "Los Lagos",
            ciudad: data.ciudad || "",
            phone: data.phone || "",
            website: data.website || "",
            certifications: data.certifications || [],
            specialties: data.specialties || [],
            certificationInput: "",
            specialtyInput: "",
            social_media: data.social_media || { instagram: "", facebook: "", twitter: "" },
          });
        }
      }
    } catch (error) {
      console.error("Error al cargar perfil:", error);
    }
  }

  async function loadProducts() {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/products?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data || []);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  }

  async function loadOrders() {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/orders?artisan_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data || []);
      }
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/artisan-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`
        },
        body: JSON.stringify({
          user_id: user.id,
          bio: formData.bio || null,
          region: formData.region,
          ciudad: formData.ciudad || null,
          phone: formData.phone || null,
          website: formData.website || null,
          certifications: formData.certifications,
          specialties: formData.specialties,
          social_media: formData.social_media,
          avatar_url: profile?.avatar_url,
        }),
      });

      if (response.ok) {
        await loadProfile();
        setEditing(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar perfil");
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al guardar el perfil. Por favor, intenta nuevamente.");
    }
  }

  function addCertification() {
    if (formData.certificationInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, prev.certificationInput.trim()],
        certificationInput: "",
      }));
    }
  }

  function removeCertification(index: number) {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  }

  function addSpecialty() {
    if (formData.specialtyInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        specialties: [...prev.specialties, prev.specialtyInput.trim()],
        specialtyInput: "",
      }));
    }
  }

  function removeSpecialty(index: number) {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index),
    }));
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

      // Guardar URL en BD
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/artisan-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`
        },
        // Enviamos todo el formData también para no perder cambios no guardados si hubiera
        body: JSON.stringify({
          user_id: user.id,
          bio: formData.bio || null,
          region: formData.region,
          ciudad: formData.ciudad || null,
          phone: formData.phone || null,
          website: formData.website || null,
          certifications: formData.certifications,
          specialties: formData.specialties,
          social_media: formData.social_media,
          avatar_url: publicUrl,
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

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.is_active).length,
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.order_status === "procesando").length,
    completedOrders: orders.filter((o) => o.order_status === "entregado").length,
    totalRevenue: orders
      .filter((order) => order.order_status === "entregado" && order.payment_status === "pagado")
      .reduce((sum, order) => sum + order.total_amount, 0),
  };

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

  if (!user || user.user_metadata?.user_type !== "artesano") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 lg:px-12">
        <header className="mb-8 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-lg bg-slate-100">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {uploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  </div>
                )}
              </div>
              <label
                htmlFor="artisan-avatar-upload"
                className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition hover:bg-emerald-700 hover:scale-105"
                title="Cambiar foto de perfil"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              </label>
              <input
                type="file"
                id="artisan-avatar-upload"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Panel de artesanos
              </p>
              <h1 className="text-3xl font-semibold text-slate-900">
                Mi perfil
              </h1>
              <p className="text-base text-slate-600">
                Administra tu información y visualiza tus estadísticas.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/artesanos/productos"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600"
            >
              Mis productos
            </Link>
            <Link
              href="/artesanos/pedidos"
              className="rounded-xl border border-emerald-500 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Ver pedidos recibidos
            </Link>
          </div>
        </header>

        {showSuccess && (
          <div className="mb-6 rounded-xl border border-emerald-500/50 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            ✓ Perfil actualizado exitosamente
          </div>
        )}

        {/* Estadísticas */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">Total productos</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {stats.totalProducts}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.activeProducts} activos
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">Total pedidos</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {stats.totalOrders}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {stats.pendingOrders} pendientes
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">Pedidos completados</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600">
              {stats.completedOrders}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-600">Ingresos totales</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600">
              ${stats.totalRevenue.toLocaleString('es-CL')}
            </p>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Información del perfil */}
          <section className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900">
                Información del perfil
              </h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Editar perfil
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={user.user_metadata?.name || user.user_metadata?.full_name || ""}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    El nombre se actualiza desde tu cuenta de usuario
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Biografía
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Cuéntanos sobre ti y tu trabajo artesanal..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Región *
                    </label>
                    <select
                      value={formData.region}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, region: e.target.value }))
                      }
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      {chileanRegions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={formData.ciudad}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, ciudad: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Ej: Osorno"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="+56912345678"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Sitio web
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, website: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Redes sociales
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.social_media.instagram}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          social_media: { ...prev.social_media, instagram: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Instagram: @usuario"
                    />
                    <input
                      type="text"
                      value={formData.social_media.facebook}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          social_media: { ...prev.social_media, facebook: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Facebook: usuario"
                    />
                    <input
                      type="text"
                      value={formData.social_media.twitter}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          social_media: { ...prev.social_media, twitter: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Twitter: @usuario"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Certificaciones
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.certificationInput}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          certificationInput: e.target.value,
                        }))
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCertification();
                        }
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Ej: Certificación artesanal"
                    />
                    <button
                      type="button"
                      onClick={addCertification}
                      className="rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Agregar
                    </button>
                  </div>
                  {formData.certifications.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.certifications.map((cert, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                        >
                          {cert}
                          <button
                            type="button"
                            onClick={() => removeCertification(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Especialidades (tipos de artesanía)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.specialtyInput}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          specialtyInput: e.target.value,
                        }))
                      }
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSpecialty();
                        }
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Ej: Cerámica, Textil"
                    />
                    <button
                      type="button"
                      onClick={addSpecialty}
                      className="rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Agregar
                    </button>
                  </div>
                  {formData.specialties.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                        >
                          {specialty}
                          <button
                            type="button"
                            onClick={() => removeSpecialty(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      loadProfile();
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Nombre</p>
                  <p className="mt-1 text-slate-900">
                    {user.user_metadata?.name || user.user_metadata?.full_name || "No especificado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Email</p>
                  <p className="mt-1 text-slate-900">{user.email}</p>
                </div>
                {profile?.bio && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Biografía
                    </p>
                    <p className="mt-1 text-slate-600">{profile.bio}</p>
                  </div>
                )}
                {(profile?.region || profile?.ciudad || profile?.phone || profile?.website) && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {profile.region && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          Región
                        </p>
                        <p className="mt-1 text-slate-600">{profile.region}</p>
                      </div>
                    )}
                    {profile.ciudad && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          Ciudad
                        </p>
                        <p className="mt-1 text-slate-600">{profile.ciudad}</p>
                      </div>
                    )}
                    {profile.phone && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          Teléfono
                        </p>
                        <p className="mt-1 text-slate-600">{profile.phone}</p>
                      </div>
                    )}
                    {profile.website && (
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          Sitio web
                        </p>
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-emerald-600 hover:underline"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                {profile?.social_media && Object.values(profile.social_media).some(v => v) && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Redes sociales
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.social_media.instagram && (
                        <a
                          href={`https://instagram.com/${profile.social_media.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-pink-200 bg-pink-50 px-3 py-1 text-sm text-pink-700 hover:bg-pink-100"
                        >
                          Instagram: {profile.social_media.instagram}
                        </a>
                      )}
                      {profile.social_media.facebook && (
                        <a
                          href={`https://facebook.com/${profile.social_media.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700 hover:bg-blue-100"
                        >
                          Facebook: {profile.social_media.facebook}
                        </a>
                      )}
                      {profile.social_media.twitter && (
                        <a
                          href={`https://twitter.com/${profile.social_media.twitter.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1 text-sm text-sky-700 hover:bg-sky-100"
                        >
                          Twitter: {profile.social_media.twitter}
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {profile?.certifications && profile.certifications.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Certificaciones
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.certifications.map((cert, index) => (
                        <span
                          key={index}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile?.specialties && profile.specialties.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Especialidades
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {!profile && (
                  <p className="text-sm text-slate-500">
                    Haz clic en "Editar perfil" para agregar información sobre ti.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Resumen de productos y pedidos */}
          <aside className="space-y-6">
            {/* Productos recientes */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Mis productos
                </h3>
                <Link
                  href="/artesanos/productos"
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Ver todos
                </Link>
              </div>
              {products.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aún no has agregado productos.
                </p>
              ) : (
                <div className="space-y-3">
                  {products.slice(0, 3).map((product) => (
                    <div
                      key={product.id}
                      className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      {product.images && product.images.length > 0 && (
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-600">
                          Stock: {product.stock} unidades
                        </p>
                        <p className="text-xs text-slate-500">
                          {product.is_active ? "Activo" : "Desactivado"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Pedidos recientes */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  Pedidos recientes
                </h3>
                <Link
                  href="/artesanos/pedidos"
                  className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Ver todos
                </Link>
              </div>
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aún no has recibido pedidos.
                </p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">
                          Pedido #{order.id.substring(0, 8)}
                        </p>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${order.order_status === "entregado"
                            ? "bg-emerald-100 text-emerald-700"
                            : order.order_status === "cancelado"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                          {order.order_status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        ${order.total_amount.toLocaleString('es-CL')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}

