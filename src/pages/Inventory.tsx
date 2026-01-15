import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Plus,
  Loader2,
  ClipboardList,
  AlertTriangle,
  Trash2,
  Edit3,
  X,
  Package,
  Tag,
  Database,
  Image as ImageIcon,
} from "lucide-react";

interface Producto {
  id?: string;
  sku: string;
  nombre: string;
  categoria: "sillones" | "scanners" | "equipamiento";
  precio_venta: number;
  stock_local: number;
  stock_mayorista: number;
  descripcion_tecnica: string;
  imagen_url?: string; // Campo para el catálogo
}

export const Inventory = () => {
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const initialFormState: Producto = {
    sku: "",
    nombre: "",
    categoria: "equipamiento",
    precio_venta: 0,
    stock_local: 0,
    stock_mayorista: 0,
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

    if (error) {
      console.error("Error fetching products:", error.message);
    } else if (data) {
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Función para subir imagen al bucket 'catalogos'
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("catalogos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("catalogos")
        .getPublicUrl(filePath);

      setFormData({ ...formData, imagen_url: data.publicUrl });
    } catch (error: any) {
      alert("Error subiendo imagen: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.stock_local < 0 ||
      formData.stock_mayorista < 0 ||
      formData.precio_venta < 0
    ) {
      alert("Valores negativos no permitidos");
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("productos")
        .update(formData)
        .eq("id", editingId);
      if (error) console.error("Update error:", error.message);
    } else {
      const { error } = await supabase.from("productos").insert([formData]);
      if (error) console.error("Insert error:", error.message);
    }

    setFormData(initialFormState);
    setEditingId(null);
    setShowForm(false);
    fetchProducts();
  };

  const handleEdit = (p: Producto) => {
    setFormData(p);
    setEditingId(p.id || null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar "${nombre}"?`)) {
      const { error } = await supabase.from("productos").delete().eq("id", id);
      if (!error) fetchProducts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 w-full sm:w-auto flex-1">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
            Total Productos
          </p>
          <p className="text-3xl font-bold text-slate-800">{products.length}</p>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingId(null);
              setFormData(initialFormState);
            }
          }}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg ${
            showForm ? "bg-slate-500" : "bg-blue-600 shadow-blue-200"
          }`}
        >
          {showForm ? (
            <>
              <X size={20} /> Cancelar
            </>
          ) : (
            <>
              <Plus size={20} /> Añadir Producto
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-blue-100 animate-in fade-in zoom-in duration-200">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            {editingId ? (
              <Edit3 className="text-orange-500" />
            ) : (
              <ClipboardList className="text-blue-600" />
            )}
            {editingId ? "Editar Producto" : "Nuevo Registro"}
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 px-1">
                SKU
              </label>
              <input
                required
                type="text"
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 px-1">
                Nombre
              </label>
              <input
                required
                type="text"
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 px-1">
                Pilar
              </label>
              <select
                className="w-full p-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 px-1 flex items-center gap-1">
                <Tag size={14} /> Precio ($)
              </label>
              <input
                required
                type="number"
                min="0"
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.precio_venta}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    precio_venta: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 px-1 text-green-600 flex items-center gap-1">
                <Package size={14} /> Stock Local
              </label>
              <input
                required
                type="number"
                min="0"
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.stock_local}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock_local: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 px-1 text-blue-600 flex items-center gap-1">
                <Database size={14} /> Stock Mayorista
              </label>
              <input
                required
                type="number"
                min="0"
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.stock_mayorista}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock_mayorista: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* Campo de Imagen / Catálogo */}
            <div className="md:col-span-3 space-y-2">
              <label className="text-sm font-bold text-slate-600 px-1 flex items-center gap-1">
                <ImageIcon size={14} /> Catálogo (Imagen)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-xl">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="text-sm w-full"
                />
                {uploading && (
                  <Loader2 className="animate-spin text-blue-500" />
                )}
                {formData.imagen_url && (
                  <img
                    src={formData.imagen_url}
                    alt="Vista previa"
                    className="h-20 w-20 object-cover rounded-lg shadow-md"
                  />
                )}
              </div>
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-sm font-bold text-slate-600 px-1">
                Descripción Técnica
              </label>
              <textarea
                required
                rows={3}
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.descripcion_tecnica}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    descripcion_tecnica: e.target.value,
                  })
                }
              />
            </div>
            <div className="md:col-span-3 flex justify-end pt-2">
              <button
                type="submit"
                disabled={uploading}
                className="w-full md:w-auto px-8 py-4 rounded-xl font-bold text-white bg-slate-900 hover:bg-black transition-colors shadow-lg disabled:opacity-50"
              >
                {editingId ? "Actualizar Producto" : "Guardar Producto"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTADO RESPONSIVO */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="animate-spin text-slate-300" />
          </div>
        ) : (
          <>
            {/* VISTA MÓVIL: CARDS */}
            <div className="grid grid-cols-1 md:hidden divide-y divide-slate-50">
              {products.map((p) => (
                <div key={p.id} className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      {p.imagen_url && (
                        <img
                          src={p.imagen_url}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase">
                          {p.sku}
                        </span>
                        <h4 className="font-bold text-slate-800 leading-tight">
                          {p.nombre}
                        </h4>
                      </div>
                    </div>
                    <p className="font-bold text-slate-900">
                      ${p.precio_venta.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`flex-1 text-center py-2 rounded-lg text-[10px] font-bold ${
                        p.stock_local > 5
                          ? "bg-green-50 text-green-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      Local: {p.stock_local}
                    </span>
                    <span className="flex-1 text-center py-2 rounded-lg bg-slate-50 text-slate-600 text-[10px] font-bold">
                      May: {p.stock_mayorista}
                    </span>
                  </div>
                  <div className="flex justify-end gap-4 pt-1">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-2 text-blue-600"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id!, p.nombre)}
                      className="p-2 text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* VISTA DESKTOP: TABLA */}
            <div className="hidden md:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-5 text-slate-600 font-bold uppercase text-xs">
                      Producto
                    </th>
                    <th className="p-5 text-slate-600 font-bold uppercase text-xs text-center">
                      Stock
                    </th>
                    <th className="p-5 text-slate-600 font-bold uppercase text-xs">
                      Precio
                    </th>
                    <th className="p-5 text-slate-600 font-bold uppercase text-xs text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-5 flex items-center gap-3">
                        {p.imagen_url && (
                          <img
                            src={p.imagen_url}
                            className="w-10 h-10 rounded-lg object-cover shadow-sm"
                          />
                        )}
                        <div>
                          <p className="text-[10px] text-blue-600 font-bold uppercase">
                            {p.sku}
                          </p>
                          <p className="font-bold text-slate-800">{p.nombre}</p>
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              p.stock_local > 5
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            Local: {p.stock_local}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">
                            Mayorista: {p.stock_mayorista}
                          </span>
                        </div>
                      </td>
                      <td className="p-5 font-bold text-slate-800">
                        ${p.precio_venta.toLocaleString()}
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-2 text-slate-400 hover:text-blue-600"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id!, p.nombre)}
                            className="p-2 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
