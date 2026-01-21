import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { chatWithAgente } from "../lib/groq";
import { useAgent } from "../lib/agentContext";
import {
  MessageSquare,
  Send,
  X,
  Zap,
  Plus,
  Trash2,
  Power,
  Activity,
  Flame,
  ToggleLeft,
  ToggleRight,
  Clock,
} from "lucide-react";

export const ChatIA = ({
  showDashboard = false,
}: {
  showDashboard?: boolean;
}) => {
  // --- ESTADOS DE CONTROL ---
  const { agenteActivo } = useAgent();
  const [nuevaOrden, setNuevaOrden] = useState("");
  const [ordenes, setOrdenes] = useState<any[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [
      {
        role: "assistant",
        content:
          "¡Hola! Soy el asistente de Agente DENTAL. ¿Cual es tu consulta?",
      },
    ],
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    const { data } = await supabase
      .from("ordenes_diarias")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setOrdenes(data);
  };

  const agregarOrden = async () => {
    if (!nuevaOrden.trim()) return;
    const { error } = await supabase
      .from("ordenes_diarias")
      .insert([{ contenido: nuevaOrden }]);
    if (!error) {
      setNuevaOrden("");
      fetchOrdenes();
    }
  };

  const toggleOrden = async (id: string, estadoActual: boolean) => {
    await supabase
      .from("ordenes_diarias")
      .update({ activa: !estadoActual })
      .eq("id", id);
    fetchOrdenes();
  };

  const eliminarOrden = async (id: string) => {
    if (!confirm("¿Eliminar esta orden?")) return;
    await supabase.from("ordenes_diarias").delete().eq("id", id);
    fetchOrdenes();
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Verificar si el agente está activo
    if (!agenteActivo) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ El agente está actualmente en pausa. Por favor, activa el agente desde el Panel de Control para poder responder a tus consultas.",
        },
      ]);
      return;
    }

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const aiResponse = await chatWithAgente(userMsg, agenteActivo);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiResponse || "" },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "❌ Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta nuevamente.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Función para convertir URLs en enlaces clicables
  const formatMessageWithLinks = (text: string) => {
    if (!text) return text;

    // Regex para detectar URLs (http, https, www)
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;

    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      if (part.match(urlRegex)) {
        const url = part.startsWith("www.") ? `https://${part}` : part;
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Dashboard content - only show when showDashboard is true */}
      {showDashboard && (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
          {/* HEADER: PREMIUM MEDICAL STYLE */}
          <div className="premium-card p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row justify-between items-center gap-6 premium-transition">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 italic uppercase tracking-tight leading-none mb-2">
                Agente Inteligente
              </h1>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider italic flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${agenteActivo ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                ></span>
                Dashboard Operativo • {agenteActivo ? "En Línea" : "En Pausa"}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {agenteActivo
                  ? "✅ El agente está activo y respondiendo consultas"
                  : "⚠️ El agente está en pausa. Actívalo desde el Panel de Control."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* COLUMNA GESTIÓN DE ÓRDENES (Glass Effect) */}
            <div className="sm:col-span-2 lg:col-span-2 space-y-6">
              <div className="premium-card p-4 sm:p-6 lg:p-8 space-y-6 premium-transition">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg flex items-center justify-center">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight leading-tight">
                      Órdenes Operativas
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Gestiona las instrucciones activas
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <input
                    placeholder="Ej: 'Promoción especial para Fussen 6500 hoy'..."
                    className="flex-1 px-5 py-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 font-semibold text-sm outline-none premium-transition focus:bg-white focus:border-blue-400 focus:shadow-lg"
                    value={nuevaOrden}
                    onChange={(e) => setNuevaOrden(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && agregarOrden()}
                  />
                  <button
                    onClick={agregarOrden}
                    className="premium-button px-5 py-4 rounded-2xl shadow-lg hover:shadow-xl premium-transition"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="space-y-4 max-h-112.5 overflow-y-auto pr-2">
                  {ordenes.map((orden) => (
                    <div
                      key={orden.id}
                      className={`premium-transition p-4 rounded-2xl border flex items-center justify-between ${
                        orden.activa
                          ? "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-md"
                          : "bg-gray-50 border-gray-200 opacity-60"
                      }`}
                    >
                      <div className="flex gap-4 items-center flex-1">
                        <button
                          onClick={() => toggleOrden(orden.id, orden.activa)}
                          className={`premium-transition ${
                            orden.activa
                              ? "text-blue-600 hover:text-blue-700"
                              : "text-gray-400 hover:text-gray-500"
                          }`}
                        >
                          {orden.activa ? (
                            <ToggleRight size={32} />
                          ) : (
                            <ToggleLeft size={32} />
                          )}
                        </button>
                        <div>
                          <p
                            className={`text-sm font-semibold tracking-tight ${
                              orden.activa
                                ? "text-gray-800"
                                : "text-gray-500 line-through"
                            }`}
                          >
                            {orden.contenido}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock size={12} className="text-gray-400" />
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              {new Date(orden.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => eliminarOrden(orden.id)}
                        className="p-2 text-gray-400 hover:text-red-500 premium-transition ml-4"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMNA MÉTRICAS (Premium Medical Style) */}
            <div className="space-y-4 sm:space-y-6">
              <div className="premium-card p-6 sm:p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full blur-3xl group-hover:from-orange-400/30 premium-transition"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg flex items-center justify-center mb-4">
                    <Flame size={20} />
                  </div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    Cierre Estimado
                  </p>
                  <p className="text-4xl font-black text-gray-800 tracking-tight">
                    82
                    <span className="text-2xl font-bold text-orange-500">
                      %
                    </span>
                  </p>
                </div>
              </div>

              <div className="premium-card p-6 sm:p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl group-hover:from-blue-400/30 premium-transition"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg flex items-center justify-center mb-4">
                    <Activity size={20} />
                  </div>
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    Consultas Semanales
                  </p>
                  <p className="text-4xl font-black text-gray-800 tracking-tight">
                    1.4
                    <span className="text-2xl font-bold text-blue-500">k</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHAT FLOTANTE: PREMIUM MEDICAL STYLE - Always visible */}
      <div className="fixed bottom-6 right-6 z-50">
        {isOpen ? (
          <div className="fixed inset-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-87.5 sm:h-125 md:w-100 md:h-150 lg:w-112.5 lg:h-162.5 premium-card flex flex-col overflow-hidden animate-in zoom-in duration-300">
            {/* HEADER DEL CHAT CON AVATAR */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="avatar-circle">
                  <span className="text-sm font-bold">AI</span>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
                  Agente Dental
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white hover:rotate-90 premium-transition p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* CONTENIDO DEL CHAT CON BURBUJAS MODERNAS */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="avatar-circle mr-3 flex-shrink-0">
                      <span className="text-sm font-bold">AI</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] ${
                      m.role === "user"
                        ? "chat-bubble-user"
                        : "chat-bubble-assistant"
                    }`}
                  >
                    <p className="text-sm font-medium">
                      {formatMessageWithLinks(m.content)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* INPUT DEL CHAT ESTILO PREMIUM */}
            <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Escribe tu consulta aquí..."
                className="flex-1 px-5 py-3 bg-gray-50 rounded-2xl border border-gray-200 font-medium text-sm outline-none premium-transition focus:bg-white focus:border-blue-400 focus:shadow-lg"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="premium-button px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl premium-transition"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center hover:scale-110"
          >
            <MessageSquare size={20} />
          </button>
        )}
      </div>
    </>
  );
};
