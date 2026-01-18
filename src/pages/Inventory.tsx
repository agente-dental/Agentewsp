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
  Package,
  DollarSign,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

export const Inventory = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState<any>({
    nombre: "",
    categoria: "equipamiento",
    precio: "",
    stock: "",
    descripcion_tecnica: "",
    archivos: [], // Para manejo local de archivos nuevos
  });

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("productos")
      .select("*, catalogos_archivos(*)")
      .order("created_at", { ascending: false });

    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- LÓGICA DE EXTRACCIÓN DE TEXTO PDF ---
  const extractTextFromPDF = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    const maxPages = Math.min(pdf.numPages, 40);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return fullText;
  };

  // --- MANEJO DE SUBIDA A STORAGE ---
  const handleFileUpload = async (productId: string, files: FileList) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
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
        extraido = await extractTextFromPDF(file);
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
        const { error } = await supabase
          .from("productos")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("productos")
          .insert([payload])
          .select();
        if (error) throw error;
        productId = data[0].id;
      }

      // Si hay archivos seleccionados, subirlos ahora
      const fileInput = document.getElementById(
        "file-upload",
      ) as HTMLInputElement;
      if (fileInput?.files?.length && productId) {
        await handleFileUpload(productId, fileInput.files);
      }

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
      alert("¡Guardado y archivos procesados!");
    } catch (err: any) {
      alert("Error: " + err.message);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
          Inventario
        </h2>
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs"
        >
          {showForm ? "Cerrar" : "Nuevo Registro"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[32px] shadow-xl border-2 border-blue-50 animate-in slide-in-from-top-4 duration-300">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <input
              placeholder="Nombre del Equipo"
              className="p-4 rounded-xl border-2 border-slate-50 font-bold focus:border-blue-500 outline-none"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              required
            />
            <select
              className="p-4 rounded-xl border-2 border-slate-50 font-bold bg-white"
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
              type="number"
              placeholder="Precio"
              className="p-4 rounded-xl border-2 border-slate-50 font-bold"
              value={formData.precio}
              onChange={(e) =>
                setFormData({ ...formData, precio: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Stock"
              className="p-4 rounded-xl border-2 border-slate-50 font-bold"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: e.target.value })
              }
            />

            {/* ZONA DE CARGA DE ARCHIVOS */}
            <div className="md:col-span-2 border-2 border-dashed border-slate-200 p-8 rounded-[24px] text-center bg-slate-50/50 hover:bg-blue-50/50 transition-all cursor-pointer relative">
              <input
                type="file"
                id="file-upload"
                multiple
                accept="application/pdf,image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <Paperclip className="text-blue-500" size={32} />
                <p className="font-black uppercase text-[10px] text-slate-400">
                  Adjuntar Catálogos PDF o Imágenes
                </p>
                <p className="text-[9px] text-slate-300 font-bold italic">
                  La IA leerá automáticamente hasta 40 páginas de cada PDF
                </p>
              </div>
            </div>

            <textarea
              placeholder="Descripción Técnica"
              className="md:col-span-2 p-4 rounded-xl border-2 border-slate-50 min-h-[100px]"
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
              className="md:col-span-2 bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest flex justify-center items-center gap-2"
            >
              {uploading ? (
                <Loader2 className="animate-spin" />
              ) : editingId ? (
                "Actualizar"
              ) : (
                "Guardar Todo"
              )}
            </button>
          </form>
        </div>
      )}

      {/* TABLA CON VISUALIZACIÓN DE ARCHIVOS */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-6 text-[10px] font-black uppercase text-slate-400 italic">
                Equipo y Archivos
              </th>
              <th className="p-6 text-[10px] font-black uppercase text-slate-400 italic">
                Precio
              </th>
              <th className="p-6 text-[10px] font-black uppercase text-slate-400 italic text-right">
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
                  <p className="font-black text-slate-800 text-lg uppercase italic">
                    {p.nombre}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <FileText size={10} /> {p.catalogos_archivos?.length || 0}{" "}
                      Manuales/Fotos
                    </span>
                    {p.stock <= 0 && (
                      <span className="text-[10px] font-black text-red-500 uppercase bg-red-50 px-2 py-0.5 rounded">
                        Sin Stock
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-6 font-bold text-slate-600">${p.precio}</td>
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
  );
};
