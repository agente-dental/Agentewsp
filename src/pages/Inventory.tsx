import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import * as pdfjsLib from "pdfjs-dist";
import {
  Plus,
  Loader2,
  Trash2,
  Edit3,
  X,
  ImageIcon,
  FileText,
  Paperclip,
  CheckCircle2,
} from "lucide-react";

// Configuración robusta del worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

interface ArchivoAdjunto {
  id?: string;
  nombre_archivo: string;
  url: string;
  texto_extraido?: string;
}

interface Producto {
  id?: string;
  nombre: string;
  categoria: "sillones" | "scanners" | "equipamiento";
  precio: number | "";
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
    const { data } = await supabase
      .from("productos")
      .select("*, catalogos_archivos(*)")
      .order("created_at", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const deleteFile = async (fileId: string, fileUrl: string) => {
    if (
      !confirm(
        "¿Eliminar este manual? La IA perderá este conocimiento técnico.",
      )
    )
      return;
    try {
      const urlParts = fileUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      await supabase.storage.from("catalogos").remove([fileName]);
      const { error: dbError } = await supabase
        .from("catalogos_archivos")
        .delete()
        .eq("id", fileId);
      if (dbError) throw dbError;
      await fetchProducts();
    } catch (err: any) {
      alert("Error al borrar: " + err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0 || !editingId) return;

      const file = e.target.files[0];
      let extractedText = "";

      // Extracción de PDF protegida
      if (file.type === "application/pdf") {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          let fullText = "";
          const pagesToRead = Math.min(pdf.numPages, 3); // Bajamos a 3 para evitar bloqueos
          for (let i = 1; i <= pagesToRead; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText +=
              content.items.map((item: any) => (item as any).str).join(" ") +
              " ";
          }
          extractedText = fullText;
        } catch (pdfError) {
          console.error(
            "Error leyendo PDF (Worker), pero subiremos el archivo igual:",
            pdfError,
          );
          extractedText =
            "Error en lectura automática. Por favor, revisa el PDF manualmente.";
        }
      }

      // Proceso de subida estándar
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("catalogos")
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("catalogos")
        .getPublicUrl(fileName);

      await supabase.from("catalogos_archivos").insert([
        {
          producto_id: editingId,
          nombre_archivo: file.name,
          url: urlData.publicUrl,
          texto_extraido: extractedText,
        },
      ]);

      fetchProducts();
      alert("Subida exitosa");
    } catch (err: any) {
      alert("Error crítico en subida: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // ... Resto de funciones (handleSubmit, handleEdit) iguales a tu versión anterior
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nombre: formData.nombre,
      categoria: formData.categoria,
      precio: formData.precio === "" ? 0 : Number(formData.precio),
      stock: formData.stock === "" ? 0 : Number(formData.stock),
      descripcion_tecnica: formData.descripcion_tecnica,
    };
    if (editingId)
      await supabase.from("productos").update(payload).eq("id", editingId);
    else await supabase.from("productos").insert([payload]);
    setFormData(initialFormState);
    setEditingId(null);
    setShowForm(false);
    fetchProducts();
  };

  const handleEdit = (p: Producto) => {
    setFormData({ ...p, precio: p.precio || "", stock: p.stock || "" });
    setEditingId(p.id || null);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">
          Dental Boss Admin
        </h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData(initialFormState);
          }}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs hover:bg-blue-700"
        >
          Nuevo Registro
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-blue-50">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <input
              placeholder="Nombre Equipo"
              className="p-4 rounded-xl border font-bold"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              required
            />
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
            <input
              type="number"
              placeholder="Precio ($)"
              className="p-4 rounded-xl border font-bold"
              value={formData.precio}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  precio: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
            <input
              type="number"
              placeholder="Stock"
              className="p-4 rounded-xl border font-bold"
              value={formData.stock}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stock: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
            />
            <textarea
              className="md:col-span-2 p-4 rounded-xl border min-h-[100px]"
              placeholder="Instrucciones técnicas..."
              value={formData.descripcion_tecnica}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  descripcion_tecnica: e.target.value,
                })
              }
            />

            {editingId && (
              <div className="md:col-span-2 bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">
                  Documentos del Producto
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {products
                    .find((p) => p.id === editingId)
                    ?.catalogos_archivos?.map((file) => (
                      <div
                        key={file.id}
                        className="bg-white p-3 rounded-xl border flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {file.url.includes(".pdf") ? (
                            <FileText size={16} className="text-red-500" />
                          ) : (
                            <ImageIcon size={16} className="text-blue-500" />
                          )}
                          <span className="text-xs font-bold truncate text-slate-600">
                            {file.nombre_archivo}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteFile(file.id!, file.url)}
                          className="p-2 text-slate-300 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                </div>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <div className="bg-white p-4 rounded-xl border border-slate-300 flex justify-center gap-2 font-black text-xs uppercase text-slate-500">
                    {uploading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Paperclip size={18} />
                    )}
                    {uploading
                      ? "Analizando y subiendo..."
                      : "Añadir Archivo Técnico"}
                  </div>
                </div>
              </div>
            )}
            <button
              type="submit"
              className="md:col-span-2 bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest"
            >
              Guardar Producto
            </button>
          </form>
        </div>
      )}

      {/* Lista de productos... */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-6 text-[10px] font-black uppercase text-slate-400">
                Equipo Dental
              </th>
              <th className="p-6 text-[10px] font-black uppercase text-slate-400 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr
                key={p.id}
                className="border-b border-slate-50 hover:bg-slate-50/50"
              >
                <td className="p-6">
                  <p className="font-black text-slate-800 text-lg">
                    {p.nombre}
                  </p>
                  <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
                    {p.catalogos_archivos?.length || 0} archivos
                  </span>
                </td>
                <td className="p-6 text-right">
                  <button
                    onClick={() => handleEdit(p)}
                    className="p-4 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl"
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
  );
};
