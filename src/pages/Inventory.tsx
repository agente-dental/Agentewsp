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
  ExternalLink,
  Paperclip,
} from "lucide-react";

interface ArchivoAdjunto {
  id?: string;
  nombre_archivo: string;
  url: string;
}

interface Producto {
  id?: string;
  nombre: string;
  categoria: "sillones" | "scanners" | "equipamiento";
  precio: number | ""; // Permitimos "" para el manejo del input
  stock: number | "";
  descripcion_tecnica: string;
  catalogos_archivos?: ArchivoAdjunto[];
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
  };

  const [formData, setFormData] = useState<Producto>(initialFormState);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("productos")
      .select("*, catalogos_archivos(*)")
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
      if (!e.target.files || e.target.files.length === 0 || !editingId) {
        alert("Primero guarda el producto para poder añadirle catálogos.");
        return;
      }

      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("catalogos")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("catalogos")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("catalogos_archivos")
        .insert([
          {
            producto_id: editingId,
            nombre_archivo: file.name,
            url: data.publicUrl,
          },
        ]);

      if (insertError) throw insertError;
      fetchProducts();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (id: string) => {
    if (confirm("¿Eliminar este archivo?")) {
      await supabase.from("catalogos_archivos").delete().eq("id", id);
      fetchProducts();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Limpieza de datos antes de enviar a Supabase
    const payload = {
      nombre: formData.nombre,
      categoria: formData.categoria,
      precio: formData.precio === "" ? 0 : Number(formData.precio),
      stock: formData.stock === "" ? 0 : Number(formData.stock),
      descripcion_tecnica: formData.descripcion_tecnica,
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
      precio: p.precio === 0 ? "" : p.precio,
      stock: p.stock === 0 ? "" : p.stock,
    });
    setEditingId(p.id || null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
        <div>
          <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">
            Panel de Control
          </p>
          <h2 className="text-3xl font-black text-slate-800">
            Inventario Dental
          </h2>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData(initialFormState);
          }}
          className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all flex gap-2"
        >
          <Plus size={18} /> Nuevo Equipo
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-blue-50 animate-in fade-in slide-in-from-top-4">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Nombre
              </label>
              <input
                className="p-4 rounded-xl border font-bold outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Pilar
              </label>
              <select
                className="p-4 rounded-xl border font-bold bg-white"
                value={formData.categoria}
                onChange={(e) =>
                  setFormData({ ...formData, categoria: e.target.value as any })
                }
              >
                <option value="scanners">Scanners</option>
                <option value="sillones">Sillones</option>
                <option value="equipamiento">Equipamiento</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Precio ($)
              </label>
              <input
                type="number"
                className="p-4 rounded-xl border font-bold"
                value={formData.precio}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    precio: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Stock
              </label>
              <input
                type="number"
                className="p-4 rounded-xl border font-bold"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                Descripción técnica (Agente IA)
              </label>
              <textarea
                className="p-4 rounded-xl border min-h-[100px]"
                value={formData.descripcion_tecnica}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    descripcion_tecnica: e.target.value,
                  })
                }
              />
            </div>

            {editingId && (
              <div className="md:col-span-2 bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200">
                <h4 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest flex items-center gap-2">
                  <Paperclip size={14} /> Gestión de Catálogos y Archivos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {products
                    .find((p) => p.id === editingId)
                    ?.catalogos_archivos?.map((file) => (
                      <div
                        key={file.id}
                        className="bg-white p-4 rounded-2xl border flex justify-between items-center group shadow-sm"
                      >
                        <div className="flex items-center gap-3 truncate">
                          {file.url.includes(".pdf") ? (
                            <FileText size={18} className="text-red-500" />
                          ) : (
                            <ImageIcon size={18} className="text-blue-500" />
                          )}
                          <span className="text-xs font-bold truncate text-slate-700">
                            {file.nombre_archivo}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={file.url}
                            target="_blank"
                            className="p-2 text-slate-400 hover:text-blue-600 bg-slate-50 rounded-lg"
                          >
                            <ExternalLink size={16} />
                          </a>
                          <button
                            type="button"
                            onClick={() => deleteFile(file.id!)}
                            className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="relative group">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={uploading}
                  />
                  <div className="bg-white text-slate-600 p-8 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 group-hover:border-blue-400 group-hover:bg-blue-50 transition-all">
                    {uploading ? (
                      <Loader2
                        className="animate-spin text-blue-600"
                        size={32}
                      />
                    ) : (
                      <Plus className="text-slate-400" size={32} />
                    )}
                    <span className="text-xs font-black uppercase tracking-widest">
                      {uploading
                        ? "Subiendo archivo..."
                        : "Click para añadir manual o foto"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-2 flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
              >
                {editingId ? "Actualizar Producto" : "Guardar Producto"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-8 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs"
              >
                Cerrar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400">
                  Equipo y Archivos
                </th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400">
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
                  <td className="p-6">
                    <p className="font-black text-slate-800 text-lg">
                      {p.nombre}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded-md uppercase tracking-tighter">
                        {p.categoria}
                      </span>
                      {p.catalogos_archivos &&
                        p.catalogos_archivos.length > 0 && (
                          <span className="text-[10px] font-black px-2 py-1 bg-blue-100 text-blue-600 rounded-md uppercase tracking-tighter flex items-center gap-1">
                            <Paperclip size={10} />{" "}
                            {p.catalogos_archivos.length} archivos
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="p-6">
                    <span
                      className={`px-4 py-2 rounded-xl text-[10px] font-black ${Number(p.stock) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {p.stock} UNIDADES
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-4 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl transition-all"
                    >
                      <Edit3 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
