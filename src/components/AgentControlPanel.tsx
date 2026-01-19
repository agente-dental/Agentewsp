import { useState, useEffect } from "react";
import { AgentSettingsService } from "../lib/agentSettings";
import { Plus, Edit2, Trash2, Power, Layers } from "lucide-react";

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

interface DailyOrder {
  id: string;
  content: string;
  active: boolean;
}

export const AgentControlPanel = () => {
  const [agenteActivo, setAgenteActivo] = useState(true);
  const [dailyOrders, setDailyOrders] = useState<DailyOrder[]>([]);
  const [newOrder, setNewOrder] = useState("");
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // Cargar órdenes diarias al montar
  useEffect(() => {
    loadDailyOrders();
  }, []);

  const loadDailyOrders = async () => {
    try {
      const ordersData = await AgentSettingsService.get("daily_orders");
      if (ordersData) {
        const parsed = JSON.parse(ordersData);
        setDailyOrders(parsed);
      }
    } catch (error) {
      console.error("Error al cargar órdenes diarias:", error);
    }
  };

  const addDailyOrder = async () => {
    if (!newOrder.trim()) return;

    const newOrderObj: DailyOrder = {
      id: Date.now().toString(),
      content: newOrder.trim(),
      active: true,
    };

    const updatedOrders = [...dailyOrders, newOrderObj];
    setDailyOrders(updatedOrders);
    setNewOrder("");

    await saveDailyOrders(updatedOrders);
  };

  const updateDailyOrder = async (id: string, content: string) => {
    const updatedOrders = dailyOrders.map((order) =>
      order.id === id ? { ...order, content } : order,
    );
    setDailyOrders(updatedOrders);
    await saveDailyOrders(updatedOrders);
    setEditingOrder(null);
  };

  const deleteDailyOrder = async (id: string) => {
    const updatedOrders = dailyOrders.filter((order) => order.id !== id);
    setDailyOrders(updatedOrders);
    await saveDailyOrders(updatedOrders);
  };

  const toggleOrderActive = async (id: string) => {
    const updatedOrders = dailyOrders.map((order) =>
      order.id === id ? { ...order, active: !order.active } : order,
    );
    setDailyOrders(updatedOrders);
    await saveDailyOrders(updatedOrders);
  };

  const saveDailyOrders = async (orders: DailyOrder[]) => {
    try {
      await AgentSettingsService.set("daily_orders", JSON.stringify(orders));
      console.log("✅ Órdenes diarias guardadas");
    } catch (error) {
      console.error("Error al guardar órdenes diarias:", error);
    }
  };

  const startEditing = (order: DailyOrder) => {
    setEditingOrder(order.id);
    setEditingContent(order.content);
  };

  const cancelEditing = () => {
    setEditingOrder(null);
    setEditingContent("");
  };

  const generateFinalPrompt = () => {
    const activeOrders = dailyOrders.filter((order) => order.active);
    const ordersText = activeOrders
      .map((order) => `• ${order.content}`)
      .join("\n");

    return `${FIXED_CORE_PROMPT}

🚨 ÓRDENES OPERATIVAS VIGENTES:
${ordersText || "No hay órdenes específicas activas."}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="premium-card p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row justify-between items-center gap-6 premium-transition">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 italic uppercase tracking-tight leading-none mb-2">
            Centro de Control Agente
          </h1>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider italic flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${agenteActivo ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
            ></span>
            Panel de Configuración •{" "}
            {agenteActivo ? "Agente En Línea" : "Agente En Pausa"}
          </p>
        </div>
        <button
          onClick={() => setAgenteActivo(!agenteActivo)}
          className={`flex items-center gap-3 px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all duration-300 rounded-2xl ${
            agenteActivo
              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/25 text-white"
              : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25 text-white"
          }`}
        >
          <Power size={20} className={agenteActivo ? "animate-pulse" : ""} />
          {agenteActivo ? "Agente Online" : "Agente Offline"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sección: Prompt del Agente */}
        <div className="premium-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg flex items-center justify-center">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight leading-tight">
                Prompt del Agente (Core + Órdenes Activas)
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
                  Prompt Completo (Core + Órdenes)
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
                {dailyOrders.filter((o) => o.active).length} orden
                {dailyOrders.filter((o) => o.active).length === 1
                  ? ""
                  : "es"}{" "}
                activa
                {dailyOrders.filter((o) => o.active).length === 1
                  ? ""
                  : "s"}{" "}
                integrada
                {dailyOrders.filter((o) => o.active).length === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Órdenes Diarias */}
        <div className="premium-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg flex items-center justify-center">
              <Power size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight leading-tight">
                Órdenes Diarias / Reglas Específicas
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Instrucciones temporales y específicas
              </p>
            </div>
          </div>

          {/* Agregar nueva orden */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newOrder}
              onChange={(e) => setNewOrder(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addDailyOrder()}
              placeholder="Ej: Hoy priorizar el scanner Fussen"
              className="flex-1 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 font-medium text-sm outline-none premium-transition focus:bg-white focus:border-orange-400 focus:shadow-lg"
            />
            <button
              onClick={addDailyOrder}
              className="premium-button px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl premium-transition"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Lista de órdenes */}
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {dailyOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No hay órdenes específicas. Agrega una para comenzar.
              </div>
            ) : (
              dailyOrders.map((order) => (
                <div
                  key={order.id}
                  className={`premium-transition p-4 rounded-2xl border flex items-center justify-between group ${
                    order.active
                      ? "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 shadow-md"
                      : "bg-gray-50 border-gray-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => toggleOrderActive(order.id)}
                      className={`w-6 h-6 rounded-full premium-transition ${
                        order.active
                          ? "bg-orange-500 shadow-md shadow-orange-500/25"
                          : "bg-gray-300"
                      }`}
                    />

                    {editingOrder === order.id ? (
                      <input
                        type="text"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            updateDailyOrder(order.id, editingContent);
                          } else if (e.key === "Escape") {
                            cancelEditing();
                          }
                        }}
                        onBlur={() =>
                          updateDailyOrder(order.id, editingContent)
                        }
                        className="flex-1 px-3 py-1 bg-white rounded-lg border border-orange-300 text-sm font-medium outline-none focus:border-orange-400"
                        autoFocus
                      />
                    ) : (
                      <span
                        className={`text-sm font-semibold tracking-tight flex-1 cursor-pointer ${
                          order.active
                            ? "text-gray-800"
                            : "text-gray-500 line-through"
                        }`}
                        onClick={() => startEditing(order)}
                      >
                        {order.content}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 premium-transition">
                    {editingOrder !== order.id && (
                      <button
                        onClick={() => startEditing(order)}
                        className="p-2 text-gray-400 hover:text-orange-500 premium-transition"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteDailyOrder(order.id)}
                      className="p-2 text-gray-400 hover:text-red-500 premium-transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
