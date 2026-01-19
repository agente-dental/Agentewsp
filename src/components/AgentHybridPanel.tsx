import { useState, useEffect } from "react";
import { AgentSettingsService } from "../lib/agentSettings";
import { Plus, X, Cpu, Layers } from "lucide-react";

interface OrderBubble {
  id: string;
  content: string;
  timestamp: string;
  active: boolean;
}

// PARTE FIJA (CORE) - Inmutable para garantizar estabilidad
const FIXED_CORE_PROMPT = `Eres el Asesor Técnico Principal de "evolucion dental". 

IDENTIDAD:
- Empresa: evolucion dental
- Rol: Asesor Técnico Principal
- Especialidad: Equipamiento dental profesional

PROPÓSITO FUNDAMENTAL:
- Cerrar ventas con asesoramiento técnico experto
- Resolver dudas técnicas sobre equipamiento dental
- Proporcionar información precisa de manuales y especificaciones

DIRECTRICES DE COMPORTAMIENTO:
- Profesional, experto y directo
- Usar siempre datos técnicos verificables
- Citar manuales técnicos: "Según el manual técnico..."
- Adjuntar siempre enlaces de descarga de PDFs
- Filtrar temas no relacionados: "Lo siento, como asistente técnico de evolucion dental solo puedo ayudarte con consultas sobre nuestro equipamiento profesional."

ESTRUCTURA DE RESPUESTA:
1. Identificar el equipo/producto mencionado
2. Proporcionar datos técnicos específicos
3. Ofrecer soluciones o alternativas
4. Incluir enlaces a documentación relevante`;

export const AgentHybridPanel = () => {
  const [orderBubbles, setOrderBubbles] = useState<OrderBubble[]>([]);
  const [newOrder, setNewOrder] = useState("");
  const [editingBubble, setEditingBubble] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // Cargar burbujas al montar
  useEffect(() => {
    loadOrderBubbles();
  }, []);

  const loadOrderBubbles = async () => {
    console.log("🔄 Cargando burbujas de órdenes...");
    try {
      const bubblesData = await AgentSettingsService.get("order_bubbles");
      console.log("📥 Datos recibidos de la BD:", bubblesData);
      if (bubblesData) {
        const parsed = JSON.parse(bubblesData);
        console.log("📋 Datos parseados:", parsed);
        setOrderBubbles(parsed);
        // Forzar re-render con un pequeño delay
        setTimeout(() => {
          console.log("🔄 Estado actualizado forzado:", parsed);
        }, 100);
      } else {
        console.log("📭 No hay datos en la BD");
        setOrderBubbles([]);
      }
    } catch (error) {
      console.error("❌ Error al cargar burbujas de órdenes:", error);
    }
  };

  const saveOrderBubbles = async (bubbles: OrderBubble[]): Promise<boolean> => {
    try {
      const success = await AgentSettingsService.set(
        "order_bubbles",
        JSON.stringify(bubbles),
      );
      if (success) {
        console.log(
          "✅ Burbujas de órdenes guardadas:",
          bubbles.length,
          "órdenes",
        );
        return true;
      } else {
        throw new Error("No se pudo guardar en la base de datos");
      }
    } catch (error) {
      console.error("Error al guardar burbujas de órdenes:", error);
      return false;
    }
  };

  const addOrderBubble = async () => {
    console.log("🔄 addOrderBubble llamado con:", newOrder);
    if (!newOrder.trim()) {
      console.log("❌ Orden vacía, retornando");
      return;
    }

    const newBubble: OrderBubble = {
      id: Date.now().toString(),
      content: newOrder.trim(),
      timestamp: new Date().toISOString(),
      active: true, // Las nuevas órdenes se crean activas por defecto
    };

    console.log("📝 Nueva burbuja creada:", newBubble);
    const updatedBubbles = [...orderBubbles, newBubble];
    console.log("📋 Lista actualizada:", updatedBubbles);

    setNewOrder("");

    const saved = await saveOrderBubbles(updatedBubbles);
    if (saved) {
      console.log("✅ Guardado exitoso, actualizando UI...");
      // Solo actualizar el estado si el guardado fue exitoso
      setOrderBubbles(updatedBubbles);
    } else {
      console.error("❌ No se pudo guardar la burbuja");
    }
  };

  const updateOrderBubble = async (id: string, content: string) => {
    const updatedBubbles = orderBubbles.map((bubble) =>
      bubble.id === id ? { ...bubble, content } : bubble,
    );
    setOrderBubbles(updatedBubbles);
    await saveOrderBubbles(updatedBubbles);
    setEditingBubble(null);
  };

  const toggleOrderBubble = async (id: string) => {
    const updatedBubbles = orderBubbles.map((bubble) =>
      bubble.id === id ? { ...bubble, active: !bubble.active } : bubble,
    );
    setOrderBubbles(updatedBubbles);
    await saveOrderBubbles(updatedBubbles);
  };

  const deleteOrderBubble = async (id: string) => {
    const updatedBubbles = orderBubbles.filter((bubble) => bubble.id !== id);
    setOrderBubbles(updatedBubbles);
    await saveOrderBubbles(updatedBubbles);
  };

  const generateFinalPrompt = () => {
    const activeBubbles = orderBubbles.filter((bubble) => bubble.active);
    const bubblesText = activeBubbles
      .map((bubble) => `• ${bubble.content}`)
      .join("\n");

    return `${FIXED_CORE_PROMPT}

🚨 ÓRDENES OPERATIVAS VIGENTES:
${bubblesText || "No hay órdenes específicas activas."}`;
  };

  const startEditingBubble = (bubble: OrderBubble) => {
    setEditingBubble(bubble.id);
    setEditingContent(bubble.content);
  };

  const cancelEditing = () => {
    setEditingBubble(null);
    setEditingContent("");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="premium-card p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row justify-between items-center gap-6 premium-transition">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 italic uppercase tracking-tight leading-none mb-2">
            Panel Híbrido del Agente
          </h1>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider italic flex items-center gap-2">
            <Cpu size={16} />
            Arquitectura de Prompt Híbrido
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sección: Parte Fija (Core) */}
        <div className="premium-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg flex items-center justify-center">
              <Cpu size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight leading-tight">
                Parte Fija (Core)
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Identidad y propósito fundamental - Inmutable
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Layers size={16} className="text-purple-600" />
                <span className="text-sm font-bold text-purple-800 uppercase tracking-wide">
                  Prompt del Agente (Core + Órdenes Activas)
                </span>
              </div>
              <textarea
                value={generateFinalPrompt()}
                readOnly
                className="w-full h-80 px-4 py-3 bg-white rounded-xl border border-purple-200 font-mono text-xs outline-none resize-none"
                placeholder="Generando prompt completo..."
              />
              <div className="mt-2 text-xs text-purple-600 font-medium italic">
                📄 Prompt completo con{" "}
                {orderBubbles.filter((b) => b.active).length} orden
                {orderBubbles.filter((b) => b.active).length === 1
                  ? ""
                  : "es"}{" "}
                activa
                {orderBubbles.filter((b) => b.active).length === 1
                  ? ""
                  : "s"}{" "}
                integrada
                {orderBubbles.filter((b) => b.active).length === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Parte Dinámica (Burbujas) */}
        <div className="premium-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg flex items-center justify-center">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight leading-tight">
                Parte Dinámica (Burbujas)
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Órdenes accesorias - Editables y persistentes
              </p>
            </div>
          </div>

          {/* Input para nuevas órdenes */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newOrder}
                onChange={(e) => setNewOrder(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addOrderBubble()}
                placeholder="Escribe una orden específica..."
                className="flex-1 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 font-medium text-sm outline-none premium-transition focus:bg-white focus:border-orange-400 focus:shadow-lg"
              />
              <button
                onClick={addOrderBubble}
                className="premium-button px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl premium-transition"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Contenedor de Burbujas - Archivo de Órdenes */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {orderBubbles.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No hay órdenes en el archivo. Crea nuevas órdenes para
                activarlas.
              </div>
            ) : (
              orderBubbles.map((bubble) => (
                <div
                  key={bubble.id}
                  className={`group relative premium-transition p-4 rounded-2xl border shadow-md hover:shadow-lg ${
                    bubble.active
                      ? "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200"
                      : "bg-gray-50 border-gray-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Toggle de activación */}
                    <button
                      onClick={() => toggleOrderBubble(bubble.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        bubble.active
                          ? "bg-orange-500 border-orange-500"
                          : "bg-gray-300 border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {bubble.active && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </button>

                    {editingBubble === bubble.id ? (
                      <input
                        type="text"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            updateOrderBubble(bubble.id, editingContent);
                          } else if (e.key === "Escape") {
                            cancelEditing();
                          }
                        }}
                        onBlur={() =>
                          updateOrderBubble(bubble.id, editingContent)
                        }
                        className="flex-1 px-3 py-1 bg-white rounded-lg border border-orange-300 text-sm font-medium outline-none focus:border-orange-400"
                        autoFocus
                      />
                    ) : (
                      <span
                        className={`flex-1 text-sm font-semibold tracking-tight cursor-pointer ${
                          bubble.active ? "text-gray-800" : "text-gray-500"
                        }`}
                        onClick={() => startEditingBubble(bubble)}
                      >
                        {bubble.content}
                      </span>
                    )}
                  </div>

                  {/* Indicador de estado */}
                  <div className="absolute top-2 right-8 text-xs font-medium">
                    {bubble.active ? (
                      <span className="text-orange-600">✓ Activa</span>
                    ) : (
                      <span className="text-gray-400">Inactiva</span>
                    )}
                  </div>

                  {/* Botón de eliminar */}
                  <button
                    onClick={() => deleteOrderBubble(bubble.id)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 premium-transition opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Vista previa del Prompt Final - Solo para nuevos prompts */}
          <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Plus size={16} className="text-blue-600" />
              <span className="text-sm font-bold text-blue-800 uppercase tracking-wide">
                Órdenes Activas Actuales
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-blue-300 max-h-32 overflow-y-auto">
              {(() => {
                const activeBubbles = orderBubbles.filter(
                  (bubble) => bubble.active,
                );
                return activeBubbles.length === 0 ? (
                  <div className="text-xs text-gray-500 italic">
                    No hay órdenes activas. Activa órdenes desde el archivo
                    superior.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeBubbles.map((bubble: OrderBubble, index: number) => (
                      <div
                        key={bubble.id}
                        className="text-xs text-gray-700 font-mono bg-orange-50 p-2 rounded border border-orange-200"
                      >
                        <span className="text-orange-600 font-bold">
                          {index + 1}.
                        </span>{" "}
                        {bubble.content}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            {orderBubbles.filter((b) => b.active).length > 0 && (
              <div className="mt-2 text-xs text-green-600 text-center italic">
                ✅{" "}
                {orderBubbles.filter((b) => b.active).length === 1
                  ? "Una orden"
                  : `${orderBubbles.filter((b) => b.active).length} órdenes`}{" "}
                activa
                {orderBubbles.filter((b) => b.active).length === 1
                  ? ""
                  : "s"}{" "}
                integrada
                {orderBubbles.filter((b) => b.active).length === 1
                  ? ""
                  : "s"}{" "}
                automáticamente
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
