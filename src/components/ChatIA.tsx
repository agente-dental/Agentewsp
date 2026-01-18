import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { chatWithAgente } from "../lib/groq";
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

export const ChatIA = () => {
  // --- ESTADOS DE CONTROL (Sin cambios) ---
  const [agenteActivo, setAgenteActivo] = useState(true);
  const [nuevaOrden, setNuevaOrden] = useState("");
  const [ordenes, setOrdenes] = useState<any[]>([]);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [
      {
        role: "assistant",
        content:
          "¡Hola! Soy el asistente de Dental Boss. ¿Qué equipo deseas probar hoy?",
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* HEADER: APPLE STYLE ON/OFF */}
      <div className="glass-card apple-shadow p-8 rounded-[32px] flex flex-col md:flex-row justify-between items-center gap-6 apple-transition">
        <div>
          <h1 className="text-4xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">
            Agente Inteligente
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 italic">
            Dashboard Operativo • {agenteActivo ? "En Línea" : "En Pausa"}
          </p>
        </div>
        <button
          onClick={() => setAgenteActivo(!agenteActivo)}
          className={`apple-transition flex items-center gap-4 px-10 py-5 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 ${
            agenteActivo
              ? "bg-green-500 text-white shadow-green-200/50 ring-8 ring-green-50"
              : "bg-slate-200 text-slate-500 shadow-none"
          }`}
        >
          <Power size={18} className={agenteActivo ? "animate-pulse" : ""} />
          {agenteActivo ? "Agente Online" : "Agente Offline"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA GESTIÓN DE ÓRDENES (Glass Effect) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card apple-shadow p-8 rounded-[32px] space-y-6 border-none">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-200">
                <Zap size={22} />
              </div>
              <h3 className="text-xl font-black uppercase italic text-slate-800 tracking-tighter">
                Órdenes Operativas
              </h3>
            </div>

            <div className="flex gap-2">
              <input
                placeholder="Ej: 'Promoción especial para Fussen 6500 hoy'..."
                className="flex-1 p-5 bg-white/50 rounded-2xl border-none font-bold text-sm outline-none apple-transition focus:bg-white"
                value={nuevaOrden}
                onChange={(e) => setNuevaOrden(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && agregarOrden()}
              />
              <button
                onClick={agregarOrden}
                className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg hover:bg-black active:scale-95 apple-transition"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
              {ordenes.map((orden) => (
                <div
                  key={orden.id}
                  className={`apple-transition p-5 rounded-[24px] border flex items-center justify-between ${
                    orden.activa
                      ? "bg-white/80 border-blue-50 apple-shadow"
                      : "bg-slate-100/50 border-transparent opacity-50"
                  }`}
                >
                  <div className="flex gap-4 items-center flex-1">
                    <button
                      onClick={() => toggleOrden(orden.id, orden.activa)}
                      className={`apple-transition ${orden.activa ? "text-blue-600" : "text-slate-300"}`}
                    >
                      {orden.activa ? (
                        <ToggleRight size={36} />
                      ) : (
                        <ToggleLeft size={36} />
                      )}
                    </button>
                    <div>
                      <p
                        className={`text-sm font-bold tracking-tight ${orden.activa ? "text-slate-700" : "text-slate-400 line-through"}`}
                      >
                        {orden.contenido}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={10} className="text-slate-300" />
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                          {new Date(orden.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => eliminarOrden(orden.id)}
                    className="p-2 text-slate-300 hover:text-red-400 apple-transition ml-4"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA MÉTRICAS (Premium Dark & Blue) */}
        <div className="space-y-6">
          <div className="bg-slate-900 apple-shadow p-8 rounded-[32px] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 apple-transition"></div>
            <Flame className="text-orange-500 mb-6 relative z-10" size={32} />
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] relative z-10">
              Cierre Estimado
            </p>
            <p className="text-5xl font-black italic tracking-tighter mt-1 relative z-10">
              82%
            </p>
          </div>

          <div className="bg-blue-600 apple-shadow p-8 rounded-[32px] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 apple-transition"></div>
            <Activity className="text-blue-100 mb-6 relative z-10" size={32} />
            <p className="text-[10px] font-black uppercase text-blue-200 tracking-[0.2em] relative z-10">
              Consultas Semanales
            </p>
            <p className="text-5xl font-black italic tracking-tighter mt-1 relative z-10">
              1.4k
            </p>
          </div>
        </div>
      </div>

      {/* CHAT FLOTANTE: GLASSMORPHISM */}
      <div className="fixed bottom-8 right-8 z-50">
        {isOpen ? (
          <div className="w-[400px] h-[600px] glass-card apple-shadow rounded-[32px] flex flex-col overflow-hidden animate-in zoom-in duration-300 border-white/40">
            <div className="p-6 bg-slate-900/95 text-white flex justify-between items-center backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${agenteActivo ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                ></div>
                <span className="text-[10px] font-black uppercase italic tracking-[0.15em]">
                  Agente de Simulación
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:rotate-90 apple-transition"
              >
                <X size={20} />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-[22px] text-xs font-bold leading-relaxed shadow-sm ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white text-slate-700 rounded-tl-none border border-white"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-[10px] font-black text-slate-400 p-2 animate-pulse uppercase italic tracking-widest text-center">
                  IA Procesando órdenes activas...
                </div>
              )}
            </div>

            <div className="p-5 bg-white/80 backdrop-blur-md border-t border-white/20 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Pregunta por el Fussen 6500..."
                className="flex-1 text-sm outline-none px-5 py-4 bg-slate-100/50 rounded-[20px] font-bold apple-transition focus:bg-white focus:ring-4 focus:ring-blue-50"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="p-4 bg-blue-600 text-white rounded-[20px] shadow-lg shadow-blue-200 apple-transition hover:bg-blue-700 active:scale-90"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-slate-900 text-white p-6 rounded-[28px] shadow-2xl flex items-center gap-4 hover:scale-[1.05] active:scale-95 apple-transition border-b-4 border-blue-600 font-black uppercase text-xs tracking-[0.15em] italic"
          >
            <MessageSquare size={24} />
            Probar Agente
          </button>
        )}
      </div>
    </div>
  );
};
