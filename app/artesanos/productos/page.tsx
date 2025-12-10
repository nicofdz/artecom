"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "../../components/top-nav";
import { useAuth } from "../../components/auth-provider";
import Footer from "../../components/footer";
import { supabase } from "../../lib/supabase";
import { ProductDetailsModal } from "../../components/product-details-modal";

type FormData = {
  name: string;
  description: string;
  category: string;
  price: string;
  stock: number;
  images: string[];
  materials: string[];
  dimensions: string;
  weight: string;
};

type Product = {
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
  created_at: string;
  avg_rating?: number;
  reviews_count?: number;
};

const categories = [
  "Cerámica",
  "Textil",
  "Joyería",
  "Madera",
  "Cuero",
  "Metal",
  "Vidrio",
  "Papel y cartón",
  "Otros",
];

const initialFormData: FormData = {
  name: "",
  description: "",
  category: "",
  price: "",
  stock: 0,
  images: [],
  materials: [],
  dimensions: "",
  weight: "",
};

export default function ArtesanosProductosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [materialInput, setMaterialInput] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login?redirect=/artesanos/productos");
      } else if (user.user_metadata?.user_type !== "artesano") {
        alert("Esta sección es solo para artesanos. Los compradores pueden ver productos desde el catálogo.");
        router.push("/catalogo");
      } else {
        loadProducts();
      }
    }
  }, [user, authLoading, router]);

  async function loadProducts() {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`/api/products?user_id=${user.id}`, {
        headers: {
          ...(token && { "Authorization": `Bearer ${token}` })
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error al cargar productos:", errorData);
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function uploadImage(file: File): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/upload-image", {
        method: "POST",
        headers: {
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        const errorData = await response.json();
        console.error("Error al subir imagen:", errorData);
        return null;
      }
    } catch (error: any) {
      console.error("Error al subir imagen:", error);
      return null;
    }
  }

  async function handleImageAdd() {
    if (!imageInput.trim()) return;

    if (imageInput.startsWith("http")) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, imageInput.trim()],
      }));
      setImagePreviews((prev) => [...prev, imageInput.trim()]);
      setImageInput("");
      return;
    }

    alert("Por favor, usa la opción de subir archivo para imágenes locales");
  }

  function removeImage(index: number) {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function addMaterial() {
    if (materialInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        materials: [...prev.materials, materialInput.trim()],
      }));
      setMaterialInput("");
    }
  }

  function removeMaterial(index: number) {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  }

  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadImage(file);
      if (url) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, url],
        }));
        setImagePreviews((prev) => [...prev, url]);
      }
    }
  }

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user?.id) return;

    if (!formData.name || !formData.category || !formData.price) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      const productData: any = {
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        price: parseFloat(formData.price),
        stock: formData.stock || 0,
        images: formData.images,
        materials: formData.materials,
        dimensions: formData.dimensions || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
      };

      if (editingProduct) {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch("/api/products", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
          },
          body: JSON.stringify({
            id: editingProduct.id,
            user_id: user.id,
            ...productData,
          }),
        });

        if (response.ok) {
          await loadProducts();
          closeModal();
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al actualizar producto");
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` })
          },
          body: JSON.stringify(productData),
        });

        if (response.ok) {
          await loadProducts();
          closeModal();
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al crear producto");
        }
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al guardar el producto. Por favor, intenta nuevamente.");
    }
  }

  function openModal(product?: Product) {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        category: product.category,
        price: product.price.toString(),
        stock: product.stock || 0,
        images: product.images || [],
        materials: product.materials || [],
        dimensions: product.dimensions || "",
        weight: product.weight ? product.weight.toString() : "",
      });
      setImagePreviews(product.images || []);
    } else {
      setEditingProduct(null);
      setFormData(initialFormData);
      setImagePreviews([]);
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(initialFormData);
    setMaterialInput("");
    setImageInput("");
    setImagePreviews([]);
  }

  async function removeProduct(id: string) {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      return;
    }

    if (!user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`/api/products?id=${id}&user_id=${user.id}`, {
        method: "DELETE",
        headers: {
          ...(token && { "Authorization": `Bearer ${token}` })
        },
      });

      if (response.ok) {
        await loadProducts();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar producto");
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al eliminar el producto. Por favor, intenta nuevamente.");
    }
  }

  async function toggleProductStatus(product: Product) {
    if (!user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify({
          id: product.id,
          user_id: user.id,
          is_active: !product.is_active,
        }),
      });

      if (response.ok) {
        await loadProducts();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar estado");
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al actualizar el estado del producto.");
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

  if (!user || user.user_metadata?.user_type !== "artesano") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <TopNav />

      <div className="flex gap-6 px-6 py-8">
        {/* Left Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h2 className="mb-4 text-lg font-bold text-slate-900">Menú</h2>
              <nav className="flex flex-col gap-2">
                <button
                  onClick={() => openModal()}
                  className="flex w-full items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
                >
                  <span className="text-lg">+</span> Agregar producto
                </button>
                <Link
                  href="/artesanos/perfil"
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600"
                >
                  👤 Mi Perfil
                </Link>
                <Link
                  href="/artesanos/pedidos"
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600"
                >
                  📦 Ver Pedidos
                </Link>
              </nav>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Resumen</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Total productos:</span>
                  <span className="font-medium text-slate-900">{products.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Activos:</span>
                  <span className="font-medium text-emerald-600">
                    {products.filter(p => p.is_active).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sin stock:</span>
                  <span className="font-medium text-red-600">
                    {products.filter(p => p.stock === 0).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Mis Productos</h1>
            <p className="text-slate-600">Gestiona tu inventario y catálogo.</p>
          </header>

          {showSuccess && (
            <div className="mb-6 rounded-xl border border-emerald-500/50 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              ✓ Operación realizada exitosamente
            </div>
          )}

          {products.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <div className="mb-4 text-4xl">🏺</div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">No tienes productos</h3>
              <p className="mb-6 max-w-sm text-slate-500">
                Comienza a subir tus creaciones para que los compradores puedan verlas.
              </p>
              <button
                onClick={() => openModal()}
                className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Agregar primer producto
              </button>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`group flex flex-col rounded-lg border bg-white transition hover:shadow-md ${product.is_active ? "border-slate-200" : "border-slate-200 bg-slate-50"
                    }`}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-slate-100">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className={`object-cover transition group-hover:scale-105 ${!product.is_active && "grayscale opacity-75"}`}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <span className="text-sm">Sin imagen</span>
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute right-3 top-3">
                      {product.is_active ? (
                        <span className="rounded-full bg-emerald-100/90 px-2 py-1 text-xs font-semibold text-emerald-700 backdrop-blur-sm">
                          Activo
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-200/90 px-2 py-1 text-xs font-semibold text-slate-600 backdrop-blur-sm">
                          Pausado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col p-3">
                    <div className="mb-2">
                      <h3 className={`font-semibold text-slate-900 line-clamp-1 ${!product.is_active && "text-slate-500"}`}>
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-500">{product.category}</p>
                    </div>

                    <div className="mb-4 flex items-end justify-between">
                      <div>
                        <p className="text-lg font-bold text-slate-900">
                          ${product.price.toLocaleString("es-CL")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${product.stock > 0 ? "text-slate-700" : "text-red-600"}`}>
                          Stock: {product.stock}
                        </p>
                      </div>
                    </div>

                    {product.avg_rating && (
                      <div className="mb-4 flex items-center gap-1 text-sm text-amber-500">
                        <span>★</span>
                        <span className="font-semibold text-slate-700">{product.avg_rating.toFixed(1)}</span>
                        <span className="text-slate-400">({product.reviews_count})</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => openModal(product)}
                        className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleProductStatus(product)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${product.is_active
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                      >
                        {product.is_active ? "Pausar" : "Activar"}
                      </button>
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="col-span-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700"
                      >
                        Eliminar producto
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {showModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-900">
                  {editingProduct ? "Editar producto" : "Agregar nuevo producto"}
                </h2>
                <button
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleProductSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Nombre del producto *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Ej: Jarra de cerámica artesanal"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Describe tu producto artesanal..."
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="category"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Categoría *
                    </label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      list="category-suggestions"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Selecciona o escribe una categoría"
                    />
                    <datalist id="category-suggestions">
                      {categories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                    <p className="mt-1 text-xs text-slate-500">
                      Puedes seleccionar de la lista o escribir una categoría personalizada
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="price"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Precio (CLP) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="stock"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Stock (unidades) *
                    </label>
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="dimensions"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Dimensiones
                    </label>
                    <input
                      type="text"
                      id="dimensions"
                      name="dimensions"
                      value={formData.dimensions}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Ej: 15cm x 10cm x 8cm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="weight"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Peso (gramos)
                  </label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Imágenes del producto
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={imageInput}
                        onChange={(e) => setImageInput(e.target.value)}
                        placeholder="URL de imagen"
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleImageAdd}
                        className="rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Agregar URL
                      </button>
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <p className="mt-1 text-xs text-slate-500">O sube una imagen desde tu computadora</p>
                    </div>
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {imagePreviews.map((img, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={img}
                              alt={`Preview ${index + 1}`}
                              width={100}
                              height={100}
                              className="h-20 w-full rounded-lg object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Materiales utilizados
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={materialInput}
                      onChange={(e) => setMaterialInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addMaterial();
                        }
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Ej: Arcilla, esmalte"
                    />
                    <button
                      type="button"
                      onClick={addMaterial}
                      className="rounded-xl border border-emerald-500 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      Agregar
                    </button>
                  </div>
                  {formData.materials.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {formData.materials.map((material, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                        >
                          <span>{material}</span>
                          <button
                            type="button"
                            onClick={() => removeMaterial(index)}
                            className="text-emerald-600 transition hover:text-red-600"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    {editingProduct ? "Guardar cambios" : "Agregar producto"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {selectedProductForDetails && (
        <ProductDetailsModal
          product={selectedProductForDetails}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedProductForDetails(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
