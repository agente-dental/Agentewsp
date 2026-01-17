import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Plus,
  Loader2,
  ClipboardList,
  Trash2,
  Edit3,
  X,
  ImageIcon,
  DollarSign,
  Box,
  FileText,
  CheckCircle2,
} from "lucide-react";

interface Producto {
  id?: string;
  nombre: string;
  categoria: "sillones" | "scanners" | "equipamiento";
  precio: number | "";
  stock: number | "";
  descripcion_tecnica: string;
  imagen_url?: string;
}

export const Inventory = () => {
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const initialFormState: Producto = {
    nombre: "",
    categoria: "equipamiento",
    precio: "",
    stock: "",
    descripcion_tecnica: "",
    imagen_url: "",
  };

  const [formData, setFormData] = useState<Producto>(initialFormState);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error:", error.message);
    else if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // MEJORA: Función de carga con vínculo inmediato a la DB si existe editingId
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];

      // Sanitización de nombre de archivo
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const cleanFileName = `${Date.now()}-${file.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("catalogos")
        .upload(cleanFileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("catalogos")
        .getPublicUrl(cleanFileName);
      const publicUrl = data.publicUrl;

      // Actualizar estado local
      setFormData((prev) => ({ ...prev, imagen_url: publicUrl }));

      // Vínculo inmediato si estamos editando
      if (editingId) {
        await supabase
          .from("productos")
          .update({ imagen_url: publicUrl })
          .eq("id", editingId);
        fetchProducts(); // Refrescar lista
      }
    } catch (err: any) {
      console.error("Error:", err.message);
      alert("Error al subir: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      precio: formData.precio === "" ? 0 : Number(formData.precio),
      stock: formData.stock === "" ? 0 : Number(formData.stock),
    };

    if (editingId) {
      await supabase.from("productos").update(payload).eq("id", editingId);
    } else {
      await supabase.from("productos").insert([payload]);
    }
    setFormData(initialFormState);
    setEditingId(null);
    setShowForm(false);
    fetchProducts();
  };

  const handleEdit = (p: Producto) => {
    setFormData({
      ...p,
      precio: p.precio === 0 ? "" : (p.precio ?? ""),
      stock: p.stock === 0 ? "" : (p.stock ?? ""),
    });
    setEditingId(p.id || null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (confirm(`¿Eliminar ${nombre}?`)) {
      const { error } = await supabase.from("productos").delete().eq("id", id);
      if (!error) fetchProducts();
    }
  };

  const isPDF = (url?: string) => url?.toLowerCase().includes(".pdf");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 w-full sm:w-auto flex-1">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
            Inventario Digital
          </p>
          <p className="text-3xl font-black text-slate-800">
            {products.length} Equipos
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData(initialFormState);
          }}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-tighter shadow-xl transition-all ${showForm ? "bg-slate-500" : "bg-blue-600 hover:scale-105"}`}
        >
          {showForm ? (
            <>
              <X size={20} /> Cancelar
            </>
          ) : (
            <>
              <Plus size={20} /> Nuevo Equipo
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-blue-100 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
            {editingId ? (
              <Edit3 className="text-orange-500" />
            ) : (
              <ClipboardList className="text-blue-600" />
            )}
            {editingId ? "Actualizar Equipo" : "Nuevo Registro Dental"}
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Nombre
              </label>
              <input
                required
                className="p-4 rounded-2xl border border-slate-200 font-bold"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Pilar
              </label>
              <select
                className="p-4 rounded-2xl border border-slate-200 bg-white font-bold"
                value={formData.categoria}
                onChange={(e) =>
                  setFormData({ ...formData, categoria: e.target.value as any })
                }
              >
                <option value="sillones">Sillones</option>
                <option value="scanners">Scanners</option>
                <option value="equipamiento">Equipamiento</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Precio ($)
              </label>
              <div className="relative">
                <DollarSign
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="number"
                  required
                  className="w-full pl-12 p-4 rounded-2xl border border-slate-200 font-bold"
                  value={formData.precio}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      precio:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Stock
              </label>
              <div className="relative">
                <Box
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="number"
                  required
                  className="w-full pl-12 p-4 rounded-2xl border border-slate-200 font-bold"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Archivo (Imagen/PDF)
              </label>
              <div
                className={`p-3 border-2 border-dashed rounded-2xl flex items-center gap-4 transition-all ${formData.imagen_url ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"} relative`}
              >
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="text-xs flex-1 cursor-pointer opacity-0 absolute inset-0 z-10"
                />
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  {isPDF(formData.imagen_url) ? (
                    <FileText className="text-red-500" />
                  ) : (
                    <ImageIcon className="text-blue-600" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    Estado
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {uploading
                      ? "Subiendo..."
                      : formData.imagen_url
                        ? "Archivo listo"
                        : "Seleccionar"}
                  </span>
                </div>
                {formData.imagen_url && (
                  <CheckCircle2 className="ml-auto text-green-500" size={20} />
                )}
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Especificaciones Técnicas
              </label>
              <textarea
                className="w-full p-4 rounded-2xl border border-slate-200 font-medium"
                rows={3}
                value={formData.descripcion_tecnica}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    descripcion_tecnica: e.target.value,
                  })
                }
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="lg:col-span-3 bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 shadow-2xl"
            >
              {editingId ? "Guardar Cambios" : "Crear Producto"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400">
                    Equipo
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 text-center">
                    Stock
                  </th>
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="p-6 flex items-center gap-5">
                      <div className="h-14 w-14 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center">
                        {p.imagen_url ? (
                          isPDF(p.imagen_url) ? (
                            <FileText size={24} className="text-red-500" />
                          ) : (
                            <img
                              src={p.imagen_url}
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <ImageIcon size={24} className="text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-lg leading-tight">
                          {p.nombre}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">
                          ${(Number(p.precio) || 0).toLocaleString()} •{" "}
                          {p.categoria}
                        </p>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <span
                        className={`px-4 py-2 rounded-xl text-[10px] font-black ${Number(p.stock) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {Number(p.stock) || 0} UNID.
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-3 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all"
                        >
                          <Edit3 size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id!, p.nombre)}
                          className="p-3 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
