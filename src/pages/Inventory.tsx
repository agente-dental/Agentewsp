import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Plus,
  Loader2,
  Package,
  Tag,
  Database,
  ClipboardList,
  AlertTriangle,
  Trash2,
  Edit3,
  X,
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
}

export const Inventory = () => {
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialFormState: Producto = {
    sku: "",
    nombre: "",
    categoria: "equipamiento",
    precio_venta: 0,
    stock_local: 0,
    stock_mayorista: 0,
    descripcion_tecnica: "",
  };

  const [formData, setFormData] = useState<Producto>(initialFormState);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
      // Lógica de Actualización
      const { error } = await supabase
        .from("productos")
        .update(formData)
        .eq("id", editingId);
      if (!error) alert("Producto actualizado con éxito");
    } else {
      // Lógica de Inserción
      const { error } = await supabase.from("productos").insert([formData]);
      if (!error) alert("Producto guardado con éxito");
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
    if (
      confirm(
        `¿Estás seguro de eliminar "${nombre}"? Esta acción no se puede deshacer.`
      )
    ) {
      const { error } = await supabase.from("productos").delete().eq("id", id);
      if (!error) fetchProducts();
      else alert("Error al eliminar: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-w-50">
          <p className="text-slate-500 text-sm font-medium">Total Productos</p>
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
          className={`flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
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
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 animate-in fade-in zoom-in duration-200">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            {editingId ? (
              <Edit3 className="text-orange-500" />
            ) : (
              <ClipboardList className="text-blue-600" />
            )}
            {editingId ? "Editando Producto" : "Registro de Nuevo Stock"}
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
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
              <label className="text-sm font-bold text-slate-600 px-1">
                Precio ($)
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
              <label className="text-sm font-bold text-slate-600 px-1 text-green-600">
                Stock Local
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
              <label className="text-sm font-bold text-slate-600 px-1 text-blue-600">
                Stock Mayorista
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
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-colors ${
                  editingId
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-slate-900 hover:bg-black"
                }`}
              >
                {editingId ? "Actualizar Cambios" : "Guardar Producto"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="animate-spin text-slate-300" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-5 text-slate-600 font-bold uppercase text-xs">
                  SKU / Producto
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
                  <td className="p-5">
                    <p className="font-mono text-[10px] text-blue-600 font-bold">
                      {p.sku}
                    </p>
                    <p className="font-bold text-slate-800">{p.nombre}</p>
                    <span className="text-[10px] uppercase font-black text-slate-400">
                      {p.categoria}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col items-center gap-1">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                          p.stock_local > 5
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {p.stock_local <= 5 && <AlertTriangle size={12} />}{" "}
                        Local: {p.stock_local}
                      </span>
                      <span className="text-[10px] text-slate-400">
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
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id!, p.nombre)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
