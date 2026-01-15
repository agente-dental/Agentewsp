import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Package, Plus, Loader2, AlertCircle } from "lucide-react";

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
  const [formData, setFormData] = useState<Producto>({
    sku: "",
    nombre: "",
    categoria: "equipamiento",
    precio_venta: 0,
    stock_local: 0,
    stock_mayorista: 0,
    descripcion_tecnica: "",
  });

  // 1. Cargar productos de Supabase
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

  // 2. Manejar envío del formulario (Solo Humano)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("productos").insert([formData]);

    if (!error) {
      setFormData({
        sku: "",
        nombre: "",
        categoria: "equipamiento",
        precio_venta: 0,
        stock_local: 0,
        stock_mayorista: 0,
        descripcion_tecnica: "",
      });
      setShowForm(false);
      fetchProducts();
    } else {
      alert("Error al cargar producto: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con Botón de Acción */}
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-w-[200px]">
            <p className="text-slate-500 text-sm font-medium">
              Total Productos
            </p>
            <p className="text-3xl font-bold text-slate-800">
              {products.length}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200"
        >
          {showForm ? (
            "Cerrar Formulario"
          ) : (
            <>
              <Plus size={20} /> Añadir Producto
            </>
          )}
        </button>
      </div>

      {/* Formulario de Carga (Visibilidad Controlada) */}
      {showForm && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-100 animate-in fade-in zoom-in duration-200">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Plus className="text-blue-600" /> Registro de Nuevo Stock
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 px-1">
                SKU / Código
              </label>
              <input
                required
                type="text"
                placeholder="Ej: SIL-001"
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 px-1">
                Nombre del Producto
              </label>
              <input
                required
                type="text"
                placeholder="Ej: Scanner Intraoral A7"
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 px-1">
                Pilar / Categoría
              </label>
              <select
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
                Precio Venta ($)
              </label>
              <input
                required
                type="number"
                className="w-full p-3 rounded-xl border border-slate-200"
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
              <label className="text-sm font-bold text-slate-600 px-1">
                Stock Local
              </label>
              <input
                required
                type="number"
                className="w-full p-3 rounded-xl border border-slate-200"
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
              <label className="text-sm font-bold text-slate-600 px-1">
                Stock Mayorista
              </label>
              <input
                required
                type="number"
                className="w-full p-3 rounded-xl border border-slate-200"
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
                Descripción Técnica (Para el Agente Groq)
              </label>
              <textarea
                required
                rows={3}
                placeholder="Detalla especificaciones que el agente usará para vender..."
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors"
              >
                Guardar en Base de Datos
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de Inventario Real-time */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center text-slate-400">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-5 text-slate-600 font-bold uppercase text-xs">
                  SKU
                </th>
                <th className="p-5 text-slate-600 font-bold uppercase text-xs">
                  Producto / Pilar
                </th>
                <th className="p-5 text-slate-600 font-bold uppercase text-xs text-center">
                  Stock Local
                </th>
                <th className="p-5 text-slate-600 font-bold uppercase text-xs text-center">
                  Stock Mayorista
                </th>
                <th className="p-5 text-slate-600 font-bold uppercase text-xs">
                  Precio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="p-5 font-mono text-xs text-blue-600 font-bold">
                    {p.sku}
                  </td>
                  <td className="p-5">
                    <p className="font-bold text-slate-800">{p.nombre}</p>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                      {p.categoria}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        p.stock_local > 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {p.stock_local} uds
                    </span>
                  </td>
                  <td className="p-5 text-center text-slate-500 font-medium">
                    {p.stock_mayorista} uds
                  </td>
                  <td className="p-5 font-bold text-slate-800">
                    ${p.precio_venta.toLocaleString()}
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
