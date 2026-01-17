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
  FileText, // Icono para PDF
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];

      // Validación simple de extensión
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("catalogos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("catalogos")
        .getPublicUrl(fileName);

      setFormData({ ...formData, imagen_url: data.publicUrl });
    } catch (err: any) {
      console.error("Error subiendo archivo:", err.message);
      alert("Error al subir el archivo: " + err.message);
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

  // Función auxiliar para detectar si es PDF
  const isPDF = (url?: string) =>
    url?.toLowerCase().includes(".pdf") ||
    url?.toLowerCase().includes("application/pdf");

  return (
    <div className="space-y-6">
      {/* Resumen Superior */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 w-full sm:w-auto flex-1">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
            Equipos Registrados
          </p>
          <p className="text-3xl font-black text-slate-800">
            {products.length}
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData(initialFormState);
          }}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-tighter shadow-xl transition-all ${showForm ? "bg-slate-500" : "bg-blue-600 shadow-blue-200 hover:scale-105"}`}
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
            {editingId ? "Editar Información" : "Nuevo Registro Dental"}
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Nombre Comercial del Equipo
              </label>
              <input
                placeholder="Ej: Scanner Intraoral Fussen S6000"
                required
                className="p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Pilar de Negocio
              </label>
              <select
                className="p-4 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
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
                Precio Final ($)
              </label>
              <div className="relative">
                <DollarSign
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="number"
                  placeholder="0"
                  required
                  className="w-full pl-12 p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
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
                Cantidad en Stock
              </label>
              <div className="relative">
                <Box
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="number"
                  placeholder="0"
                  required
                  className="w-full pl-12 p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
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

            {/* CARGA DE ARCHIVO (IMAGEN O PDF) */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Documentación / Imagen
              </label>
              <div className="p-3 border-2 border-dashed rounded-2xl flex items-center gap-4 border-slate-200 bg-slate-50 relative">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="text-xs flex-1 cursor-pointer opacity-0 absolute inset-0 z-10"
                />
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    {isPDF(formData.imagen_url) ? (
                      <FileText className="text-red-500" size={20} />
                    ) : (
                      <ImageIcon className="text-blue-600" size={20} />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {uploading
                      ? "Subiendo..."
                      : isPDF(formData.imagen_url)
                        ? "PDF Cargado"
                        : "Imagen Cargada"}
                  </span>
                </div>
                {formData.imagen_url && !isPDF(formData.imagen_url) && (
                  <img
                    src={formData.imagen_url}
                    className="h-10 w-10 object-cover rounded-xl ml-auto"
                    alt="Preview"
                  />
                )}
                {isPDF(formData.imagen_url) && (
                  <div className="ml-auto bg-red-100 text-red-600 p-1 rounded text-[10px] font-black">
                    PDF
                  </div>
                )}
                {uploading && (
                  <Loader2
                    className="animate-spin text-blue-500 ml-auto"
                    size={20}
                  />
                )}
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Especificaciones Técnicas (Agente IA)
              </label>
              <textarea
                placeholder="Detalles que el Agente usará..."
                className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
              className="lg:col-span-3 bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-black transition-all disabled:opacity-50 shadow-2xl mt-2"
            >
              {editingId ? "Actualizar Equipo" : "Registrar en Base de Datos"}
            </button>
          </form>
        </div>
      )}

      {/* Lista de Productos */}
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
                  <th className="p-6 text-[10px] font-black uppercase text-slate-400">
                    Precio
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
                      <div className="h-14 w-14 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 shadow-inner flex items-center justify-center">
                        {p.imagen_url ? (
                          isPDF(p.imagen_url) ? (
                            <FileText size={24} className="text-red-500" />
                          ) : (
                            <img
                              src={p.imagen_url}
                              className="w-full h-full object-cover"
                              alt={p.nombre}
                            />
                          )
                        ) : (
                          <ImageIcon size={24} className="text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                          {p.nombre}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                          {p.categoria}
                        </p>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <span
                        className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest ${Number(p.stock) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {Number(p.stock) || 0} DISPONIBLES
                      </span>
                    </td>
                    <td className="p-6 font-black text-slate-800 text-lg">
                      ${(Number(p.precio) || 0).toLocaleString()}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-3">
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
