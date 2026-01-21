import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  Search,
  Loader2,
  Filter,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface ContentItem {
  id: string;
  title: string;
  type: "photo" | "text";
  url: string;
  date: string;
  fileName: string;
}

export const Gallery = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("catalogos_archivos")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        const formattedItems: ContentItem[] = data.map((item) => {
          const extension = item.url.split(".").pop()?.toLowerCase() || "";
          return {
            id: item.id,
            title: item.nombre_archivo
              .replace(/\.[^/.]+$/, "")
              .replace(/[-_]/g, " "),
            type: extension === "pdf" ? "text" : "photo",
            url: item.url,
            date: new Date(item.created_at).toLocaleDateString("es-AR"),
            fileName: item.nombre_archivo,
          };
        });
        setItems(formattedItems);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleDelete = async (item: ContentItem) => {
    if (
      !window.confirm(
        "¿Seguro que querés borrarlo? El agente ya no podrá enviarlo.",
      )
    )
      return;

    try {
      // 1. Decodificamos la URL para manejar espacios y puntos de WhatsApp/Screenshots
      const decodedUrl = decodeURIComponent(item.url);
      const urlParts = decodedUrl.split("/catalogos/");
      const filePath = urlParts[1];

      // 2. Intentamos borrar del Storage primero
      if (filePath) {
        await supabase.storage.from("catalogos").remove([filePath]);
      }

      // 3. Borramos de la base de datos (prioridad para el Agente)
      const { error } = await supabase
        .from("catalogos_archivos")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      setItems(items.filter((i) => i.id !== item.id));
      if (selectedItem?.id === item.id) setSelectedItem(null);
    } catch (error) {
      console.error("Error crítico al borrar:", error);
      // Fallback: Borrar de la DB aunque el storage falle para no trabar la UI
      await supabase.from("catalogos_archivos").delete().eq("id", item.id);
      setItems(items.filter((i) => i.id !== item.id));
    }
  };

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header Estética Inicial */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Galería de Contenidos
            </h1>
            <p className="text-gray-500 mt-1">
              Gestión técnica de Evolución Dental
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar catálogos o fotos..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-3 bg-gray-50 rounded-2xl text-gray-600 hover:bg-gray-100 transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-gray-500 font-medium">
            Cargando galería técnica...
          </p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Preview Box */}
              <div
                className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-4 cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                {item.type === "photo" ? (
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-red-50">
                    <FileText size={48} className="text-red-500" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                    <ExternalLink size={24} />
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 leading-tight line-clamp-2">
                    {item.title}
                  </h3>
                  <div
                    className={`p-2 rounded-xl shrink-0 ${item.type === "photo" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"}`}
                  >
                    {item.type === "photo" ? (
                      <ImageIcon size={18} />
                    ) : (
                      <FileText size={18} />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {item.date}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Estética Inicial */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-black/90 backdrop-blur-md">
          <div className="bg-white w-full max-w-6xl h-full rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedItem.type === "photo" ? "bg-blue-500" : "bg-red-500"}`}
                >
                  {selectedItem.type === "photo" ? (
                    <ImageIcon className="text-white" />
                  ) : (
                    <FileText className="text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedItem.title}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Documento de Evolución Dental • {selectedItem.date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="flex-1 bg-gray-50 p-4 sm:p-8 overflow-hidden">
              <div className="w-full h-full bg-white rounded-3xl shadow-inner overflow-hidden flex items-center justify-center">
                {selectedItem.type === "text" ? (
                  <iframe
                    src={selectedItem.url}
                    className="w-full h-full border-none"
                    title="Visor PDF"
                  />
                ) : (
                  <img
                    src={selectedItem.url}
                    alt={selectedItem.title}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
