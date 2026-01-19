import { useState, useEffect } from "react";
import {
  X,
  Filter,
  Play,
  FileText,
  Image,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Tag,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface ContentItem {
  id: string;
  title: string;
  type: "video" | "photo" | "text";
  thumbnail: string;
  url: string;
  date: string;
  description?: string;
  brand?: string; // Nueva propiedad para marcas
}

// Función para limpiar nombres de archivos y hacerlos legibles
const cleanFileName = (fileName: string): string => {
  return fileName
    .replace(/\.[^/.]+$/, "") // Quitar extensión
    .replace(/[-_]/g, " ") // Reemplazar guiones y guiones bajos con espacios
    .replace(/\b\w/g, (l) => l.toUpperCase()) // Capitalizar primera letra de cada palabra
    .trim();
};

// Función para determinar el tipo de archivo basado en extensión
const getFileType = (fileName: string): "video" | "photo" | "text" => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")) {
    return "photo";
  } else if (["pdf"].includes(extension || "")) {
    return "text";
  } else if (["mp4", "webm", "ogg", "mov", "avi"].includes(extension || "")) {
    return "video";
  }

  return "photo"; // Default a photo
};

// Función para extraer la marca del nombre del archivo
const extractBrand = (fileName: string): string => {
  const brands = [
    "Fussen",
    "Sirona",
    "Dentsply",
    "Ivoclar",
    "3M",
    "Zimmer",
    "BioHorizons",
    "Straumann",
    "Nobel",
  ];
  const cleanName = cleanFileName(fileName).toLowerCase();

  for (const brand of brands) {
    if (cleanName.includes(brand.toLowerCase())) {
      return brand;
    }
  }

  return "Otras";
};

export const Gallery = () => {
  const [filter, setFilter] = useState<
    "todos" | "video" | "photo" | "text" | "marcas"
  >("todos");
  const [brandFilter, setBrandFilter] = useState<string>("todos");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [catalogos, setCatalogos] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [customBrands, setCustomBrands] = useState<string[]>([]);

  // Funciones de zoom y rotación
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () =>
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  // Reset zoom cuando cambia la imagen seleccionada
  useEffect(() => {
    if (selectedItem) {
      setZoomLevel(1);
      setRotation(0);
    }
  }, [selectedItem]);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedItem) {
        setSelectedItem(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedItem]);

  // Función para obtener catálogos de Supabase
  const fetchCatalogos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.storage.from("catalogos").list();

      if (error) {
        console.error("Error fetching catalogos:", error);
        setError("No se pudieron cargar los catálogos");
        return;
      }

      if (!data || data.length === 0) {
        console.log("Bucket está vacío");
        setCatalogos([]);
        return;
      }

      // Procesar archivos y generar URLs públicas
      const processedItems: (ContentItem | null)[] = await Promise.all(
        data.map(async (file) => {
          try {
            const {
              data: { publicUrl },
            } = supabase.storage.from("catalogos").getPublicUrl(file.name);

            return {
              id: file.id || file.name,
              title: cleanFileName(file.name),
              type: getFileType(file.name),
              thumbnail: publicUrl,
              url: publicUrl,
              date: new Date(
                file.created_at || Date.now(),
              ).toLocaleDateString(),
              description: `Archivo de catálogo: ${cleanFileName(file.name)}`,
              brand: extractBrand(file.name),
            };
          } catch (fileError) {
            console.error(`Error processing file ${file.name}:`, fileError);
            return null;
          }
        }),
      );

      // Filtrar elementos nulos y ordenar por fecha
      const validItems = processedItems
        .filter((item): item is ContentItem => item !== null)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

      setCatalogos(validItems);
      console.log(`Loaded ${validItems.length} items from catalogos bucket`);
    } catch (err) {
      console.error("Error general en fetchCatalogos:", err);
      setError("Error al cargar los catálogos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogos();
  }, []);

  // Función para añadir una nueva marca personalizada
  const addCustomBrand = () => {
    if (!newBrandName.trim()) return;

    const brandName = newBrandName.trim();
    if (!customBrands.includes(brandName) && brandName !== "Otras") {
      setCustomBrands([...customBrands, brandName]);
      setNewBrandName("");
      setShowAddBrand(false);
    }
  };

  // Obtener todas las marcas disponibles (predefinidas + personalizadas)
  const predefinedBrands = [
    "Fussen",
    "Sirona",
    "Dentsply",
    "Ivoclar",
    "3M",
    "Zimmer",
    "BioHorizons",
    "Straumann",
    "Nobel",
  ];
  const allBrands = [...predefinedBrands, ...customBrands, "Otras"];
  const availableBrands = Array.from(
    new Set([...allBrands, ...catalogos.map((item) => item.brand || "Otras")]),
  ).sort();

  const filteredData =
    filter === "todos"
      ? catalogos
      : filter === "marcas"
        ? brandFilter === "todos"
          ? catalogos
          : catalogos.filter((item) => item.brand === brandFilter)
        : catalogos.filter((item) => item.type === filter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play size={16} />;
      case "photo":
        return <Image size={16} />;
      case "text":
        return <FileText size={16} />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "video":
        return "bg-red-500";
      case "photo":
        return "bg-blue-500";
      case "text":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">
          Galería de Contenido
        </h1>
        <p className="text-gray-600">Catálogo visual de productos y recursos</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-red-700 font-semibold">{error}</p>
          <button
            onClick={fetchCatalogos}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-2xl">
          <Filter size={18} className="text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Filtrar:</span>
        </div>

        <button
          onClick={() => setFilter("todos")}
          className={`px-6 py-2 rounded-2xl font-semibold transition-all ${
            filter === "todos"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          Todos
        </button>

        <button
          onClick={() => setFilter("video")}
          className={`px-6 py-2 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
            filter === "video"
              ? "bg-red-500 text-white shadow-lg shadow-red-200"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <Play size={16} />
          Videos
        </button>

        <button
          onClick={() => setFilter("photo")}
          className={`px-6 py-2 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
            filter === "photo"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-200"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <Image size={16} />
          Fotos
        </button>

        <button
          onClick={() => setFilter("text")}
          className={`px-6 py-2 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
            filter === "text"
              ? "bg-green-500 text-white shadow-lg shadow-green-200"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <FileText size={16} />
          Textos
        </button>

        <button
          onClick={() => setFilter("marcas")}
          className={`px-6 py-2 rounded-2xl font-semibold transition-all flex items-center gap-2 ${
            filter === "marcas"
              ? "bg-purple-500 text-white shadow-lg shadow-purple-200"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <Tag size={16} />
          Marcas
        </button>
      </div>

      {/* Brand Filter - Solo visible cuando el filtro principal es "marcas" */}
      {filter === "marcas" && (
        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-semibold text-gray-700 px-3 py-1">
              Filtrar por marca:
            </span>
            <button
              onClick={() => setBrandFilter("todos")}
              className={`px-4 py-2 rounded-xl font-semibold transition-all text-sm ${
                brandFilter === "todos"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              Todas
            </button>
            {availableBrands.map((brand) => (
              <button
                key={brand}
                onClick={() => setBrandFilter(brand)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all text-sm ${
                  brandFilter === brand
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {brand}
                {customBrands.includes(brand) && (
                  <span className="ml-1 text-xs bg-purple-100 text-purple-600 px-1 rounded">
                    Nuevo
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={() => setShowAddBrand(!showAddBrand)}
              className="px-4 py-2 rounded-xl font-semibold transition-all text-sm bg-purple-100 text-purple-600 hover:bg-purple-200 border border-purple-200"
            >
              + Añadir Marca
            </button>
          </div>

          {/* Formulario para añadir nueva marca */}
          {showAddBrand && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre de la nueva marca..."
                  className="flex-1 px-4 py-2 bg-white border border-purple-200 rounded-lg text-sm font-medium outline-none focus:border-purple-400 focus:shadow-lg"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addCustomBrand();
                    } else if (e.key === "Escape") {
                      setShowAddBrand(false);
                      setNewBrandName("");
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={addCustomBrand}
                  disabled={!newBrandName.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold text-sm hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Añadir
                </button>
                <button
                  onClick={() => {
                    setShowAddBrand(false);
                    setNewBrandName("");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-semibold text-sm hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
              <p className="text-xs text-purple-600 mt-2">
                💡 Añade marcas personalizadas para organizar mejor tus
                catálogos
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 rounded-2xl h-64">
                <div className="h-full bg-gray-300 rounded-2xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Content Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">
                  No hay archivos disponibles
                </p>
                <p className="text-sm mt-2">
                  No se encontraron archivos para el filtro seleccionado
                </p>
              </div>
            </div>
          ) : (
            filteredData.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                }}
                className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
              >
                {item.type === "video" ? (
                  /* Video Container - 9:16 aspect ratio */
                  <div className="relative aspect-9/16 bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                            <Play size={16} className="text-white ml-1" />
                          </div>
                          <span className="text-white text-xs font-bold uppercase tracking-wider">
                            Video
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-sm mb-1 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-white/80 text-xs line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Play size={24} className="text-red-500 ml-1" />
                      </div>
                    </div>
                  </div>
                ) : item.type === "photo" ? (
                  /* Photo Container */
                  <div className="relative aspect-4/3 bg-gray-100 rounded-2xl overflow-hidden shadow-lg group">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <Image size={16} className="text-white" />
                          </div>
                          <span className="text-white text-xs font-bold uppercase tracking-wider">
                            Foto
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-sm mb-1">
                          {item.title}
                        </h3>
                        <p className="text-white/80 text-xs">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Text Container - PDF */
                  <div className="relative aspect-4/3 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl overflow-hidden shadow-lg group border border-green-200">
                    <div className="p-6 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <FileText size={16} className="text-white" />
                          </div>
                          <span className="text-green-700 text-xs font-bold uppercase tracking-wider">
                            PDF
                          </span>
                        </div>
                        <h3 className="text-gray-900 font-bold text-lg mb-2 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-3">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">
                          {item.date}
                        </span>
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Play size={16} className="text-white ml-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Photo Content Modal */}
      {selectedItem && selectedItem.type === "photo" && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full h-[90vh] max-w-7xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Image size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedItem.title}
                  </h2>
                  <p className="text-gray-500 text-sm">{selectedItem.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={handleZoomOut}
                    className="p-2 hover:bg-white rounded transition-colors"
                    title="Alejar"
                  >
                    <ZoomOut size={16} className="text-gray-700" />
                  </button>
                  <span className="px-2 text-sm font-medium text-gray-700 min-w-[3rem] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-2 hover:bg-white rounded transition-colors"
                    title="Acercar"
                  >
                    <ZoomIn size={16} className="text-gray-700" />
                  </button>
                  <button
                    onClick={handleRotate}
                    className="p-2 hover:bg-white rounded transition-colors"
                    title="Rotar"
                  >
                    <RotateCw size={16} className="text-gray-700" />
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2 hover:bg-white rounded transition-colors text-xs"
                    title="Reiniciar"
                  >
                    Reset
                  </button>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors touch-manipulation"
                  aria-label="Cerrar modal"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Image Viewer - Responsive with Zoom */}
            <div className="flex-1 bg-gray-100 p-4 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full flex items-center justify-center relative">
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  className="max-w-full max-h-full object-contain shadow-lg rounded-lg transition-all duration-300"
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    maxHeight: "calc(90vh - 120px)",
                    maxWidth: "100%",
                    margin: "auto",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Text Content Modal */}
      {selectedItem && selectedItem.type === "text" && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full h-[90vh] max-w-7xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedItem.title}
                  </h2>
                  <p className="text-gray-500 text-sm">{selectedItem.date}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors touch-manipulation"
                aria-label="Cerrar modal"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* PDF Viewer - Full height */}
            <div className="flex-1 bg-gray-100 p-4">
              <div className="w-full h-full bg-white rounded-lg shadow-sm overflow-hidden">
                <iframe
                  src={selectedItem.url}
                  className="w-full h-full"
                  title={`PDF: ${selectedItem.title}`}
                  frameBorder="0"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
