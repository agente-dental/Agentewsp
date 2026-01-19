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
  Package,
  Eye,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

export const Inventory = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);

  const [formData, setFormData] = useState<any>({
    nombre: "",
    categoria: "equipamiento",
    precio: "",
    stock: "",
    descripcion_tecnica: "",
  });

  const fetchProducts = async () => {
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

  const deleteProduct = async (id: string) => {
    if (!confirm("¿Eliminar este producto y sus archivos?")) return;
    try {
      await supabase.from("productos").delete().eq("id", id);
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteSingleFile = async (fileId: string, filePath: string) => {
    if (!confirm("¿Eliminar este archivo?")) return;
    try {
      const storagePath = filePath.split("catalogos/")[1];
      if (storagePath)
        await supabase.storage.from("catalogos").remove([storagePath]);
      await supabase.from("catalogos_archivos").delete().eq("id", fileId);
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFileUpload = async (productId: string, files: FileList) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
      const filePath = `${productId}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("catalogos")
        .upload(filePath, file);
      if (uploadError) continue;
      const {
        data: { publicUrl },
      } = supabase.storage.from("catalogos").getPublicUrl(filePath);

      let extraido = "";
      if (file.type === "application/pdf") {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = "";
          for (let i = 1; i <= Math.min(pdf.numPages, 40); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText +=
              content.items.map((item: any) => item.str).join(" ") + " ";
          }
          extraido = fullText;
        } catch (e) {
          console.error(e);
        }
      }
      await supabase.from("catalogos_archivos").insert([
        {
          producto_id: productId,
          nombre_archivo: file.name,
          url: publicUrl,
          texto_extraido: extraido,
        },
      ]);
    }
    setUploading(false);
    fetchProducts();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nombre: formData.nombre,
      categoria: formData.categoria,
      precio: formData.precio === "" ? 0 : Number(formData.precio),
      stock: formData.stock === "" ? 0 : Number(formData.stock),
      descripcion_tecnica: formData.descripcion_tecnica,
    };

    try {
      let productId = editingId;
      if (editingId) {
        await supabase.from("productos").update(payload).eq("id", editingId);
      } else {
        const { data } = await supabase
          .from("productos")
          .insert([payload])
          .select();
        productId = data?.[0].id;
      }
      const fileInput = document.getElementById(
        "file-upload",
      ) as HTMLInputElement;
      if (fileInput?.files?.length && productId)
        await handleFileUpload(productId, fileInput.files);
      setShowForm(false);
      setEditingId(null);
      setFormData({
        nombre: "",
        categoria: "equipamiento",
        precio: "",
        stock: "",
        descripcion_tecnica: "",
      });
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (p: any) => {
    setFormData({
      nombre: p.nombre,
      categoria: p.categoria,
      precio: p.precio,
      stock: p.stock,
      descripcion_tecnica: p.descripcion_tecnica,
    });
    setEditingId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="glass-card apple-shadow p-4 sm:p-6 lg:p-8 rounded-[24px] sm:rounded-[28px] lg:rounded-[32px] flex justify-between items-center">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-800">
          Inventario
        </h2>
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs apple-transition hover:scale-105"
        >
          {showForm ? "Cerrar" : "Nuevo Registro"}
        </button>
      </div>

      {showForm && (
        <div className="glass-card apple-shadow p-4 sm:p-6 lg:p-8 rounded-[24px] sm:rounded-[28px] lg:rounded-[32px] space-y-4 sm:space-y-6 animate-in slide-in-from-top-4 duration-300">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 sm:gap-6"
          >
            <input
              placeholder="Nombre..."
              className="p-4 rounded-xl bg-slate-50 border-none font-bold outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              required
            />
            <select
              className="w-full p-4 rounded-xl bg-slate-50 border-none font-bold"
              value={formData.categoria}
              onChange={(e) =>
                setFormData({ ...formData, categoria: e.target.value })
              }
            >
              <option value="scanners">Scanners</option>
              <option value="sillones">Sillones</option>
              <option value="equipamiento">Equipamiento</option>
            </select>
            <input
              type="text"
              placeholder="Nombre del equipo"
              className="w-full p-4 rounded-xl bg-slate-50 border-none font-bold outline-none"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Precio ($)"
              className="w-full p-4 rounded-xl bg-slate-50 border-none font-bold outline-none"
              value={formData.precio}
              onChange={(e) =>
                setFormData({ ...formData, precio: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Stock"
              className="w-full p-4 rounded-xl bg-slate-50 border-none font-bold outline-none"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: e.target.value })
              }
            />

            {editingId &&
              products.find((p) => p.id === editingId)?.catalogos_archivos
                ?.length > 0 && (
                <div className="md:col-span-2 space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400">
                    Archivos actuales
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {products
                      .find((p) => p.id === editingId)
                      .catalogos_archivos.map((file: any) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-white"
                        >
                          <div className="flex items-center gap-2 truncate text-xs font-bold flex-1">
                            <FileText size={14} /> {file.nombre_archivo}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewFile(file)}
                              className="text-slate-300 hover:text-blue-500"
                              title="Previsualizar"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                deleteSingleFile(file.id, file.url)
                              }
                              className="text-slate-300 hover:text-red-500"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            <div className="md:col-span-2 border-2 border-dashed border-slate-200 p-6 rounded-2xl text-center relative hover:bg-blue-50/50">
              <input
                type="file"
                id="file-upload"
                multiple
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Paperclip className="mx-auto text-blue-500 mb-2" />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Añadir catálogos o fotos
              </p>
            </div>

            <textarea
              placeholder="Descripción IA..."
              className="md:col-span-2 w-full p-4 rounded-xl bg-slate-50 border-none min-h-[100px]"
              value={formData.descripcion_tecnica}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  descripcion_tecnica: e.target.value,
                })
              }
            />
            <button
              disabled={uploading}
              type="submit"
              className="md:col-span-2 bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest apple-transition hover:bg-black"
            >
              {uploading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : editingId ? (
                "Actualizar"
              ) : (
                "Guardar"
              )}
            </button>
          </form>
        </div>
      )}

      {/* TABLA RESPONSIVA - CARDS EN MÓVILES */}
      <div className="glass-card apple-shadow rounded-[24px] sm:rounded-[32px] overflow-hidden border border-slate-100">
        {/* Vista Desktop - Tabla */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="p-3 sm:p-4 md:p-6 text-[10px] font-black uppercase text-slate-400 italic">
                  Equipo
                </th>
                <th className="p-3 sm:p-4 md:p-6 text-[10px] font-black uppercase text-slate-400 italic">
                  Precio
                </th>
                <th className="p-3 sm:p-4 md:p-6 text-[10px] font-black uppercase text-slate-400 italic">
                  Stock
                </th>
                <th className="p-3 sm:p-4 md:p-6 text-[10px] font-black uppercase text-slate-400 italic text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 apple-transition"
                >
                  <td className="p-3 sm:p-4 md:p-6">
                    <p className="font-black text-slate-800 text-lg uppercase italic tracking-tighter">
                      {p.nombre}
                    </p>
                    <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1 w-fit mt-1">
                      <FileText size={10} /> {p.catalogos_archivos?.length || 0}{" "}
                      Archivos
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 md:p-6 font-bold text-slate-600">
                    $
                    {Number(p.precio).toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${Number(p.stock) > 0 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500"}`}
                      ></div>
                      <span className="font-black text-slate-700 text-sm tracking-tight">
                        {p.stock || "0"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 sm:p-4 md:p-6 text-right flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-4 bg-slate-50/50 text-slate-400 hover:text-blue-600 rounded-2xl apple-transition border border-white shadow-sm"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="p-4 bg-slate-50/50 text-slate-300 hover:text-red-500 rounded-2xl apple-transition border border-white shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista Mobile - Cards */}
        <div className="md:hidden p-4 space-y-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md apple-transition"
            >
              {/* Header del Card */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-black text-slate-800 text-lg uppercase italic tracking-tighter mb-2">
                    {p.nombre}
                  </h3>
                  <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                    <FileText size={10} /> {p.catalogos_archivos?.length || 0}{" "}
                    Archivos
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(p)}
                    className="w-10 h-10 bg-slate-50/50 text-slate-400 hover:text-blue-600 rounded-xl apple-transition border border-white shadow-sm flex items-center justify-center"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="w-10 h-10 bg-slate-50/50 text-slate-300 hover:text-red-500 rounded-xl apple-transition border border-white shadow-sm flex items-center justify-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Contenido del Card */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                    Precio
                  </p>
                  <p className="font-bold text-slate-600">
                    $
                    {Number(p.precio).toLocaleString("es-ES", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                    Stock
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${Number(p.stock) > 0 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500"}`}
                    ></div>
                    <span className="font-black text-slate-700 text-sm tracking-tight">
                      {p.stock || "0"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full h-[90vh] max-w-6xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {previewFile.nombre_archivo}
                  </h2>
                  <p className="text-gray-500 text-sm">Previsualización</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 bg-gray-100 p-4">
              {previewFile.nombre_archivo.toLowerCase().endsWith(".pdf") ? (
                <div className="w-full h-full bg-white rounded-lg shadow-sm overflow-hidden">
                  <iframe
                    src={previewFile.url}
                    className="w-full h-full"
                    title={`PDF: ${previewFile.nombre_archivo}`}
                    frameBorder="0"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={previewFile.url}
                    alt={previewFile.nombre_archivo}
                    className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
